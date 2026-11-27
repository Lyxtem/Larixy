// SPDX-License-Identifier: AGPL-3.0-or-later

import {Endpoints} from '@app/features/app/constants/Endpoints';
import AppStorage from '@app/features/platform/state/PersistentStorage';
import {http} from '@app/features/platform/transport/RestTransport';
import {Logger} from '@app/features/platform/utils/AppLogger';

interface CapacitorPluginListenerHandle {
	remove: () => Promise<void>;
}

interface PushNotificationsPlugin {
	checkPermissions: () => Promise<{receive: string}>;
	requestPermissions: () => Promise<{receive: string}>;
	register: () => Promise<void>;
	addListener: (
		eventName: 'registration',
		listener: (event: {value: string}) => void,
	) => Promise<CapacitorPluginListenerHandle>;
	addListener: (
		eventName: 'registrationError',
		listener: (event: {error: string}) => void,
	) => Promise<CapacitorPluginListenerHandle>;
	addListener: (
		eventName: 'pushNotificationReceived',
		listener: (event: {id?: string}) => void,
	) => Promise<CapacitorPluginListenerHandle>;
}

interface CapacitorBridge {
	isNativePlatform: () => boolean;
	getPlatform: () => string;
	registerPlugin: (name: string) => unknown;
}

const logger = new Logger('NativePushService');
const LAST_NATIVE_PUSH_TOKEN_KEY = 'larixy.lastNativePushToken';
const ANDROID_FCM_PLATFORM = 'android_fcm';
const REGISTRATION_TIMEOUT_MS = 15000;

const readLastNativePushToken = (): string | null => {
	try {
		return AppStorage.getItem(LAST_NATIVE_PUSH_TOKEN_KEY);
	} catch (error) {
		logger.warn('Failed to read the last registered native push token', error);
		return null;
	}
};
const writeLastNativePushToken = (token: string | null): void => {
	try {
		if (token) AppStorage.setItem(LAST_NATIVE_PUSH_TOKEN_KEY, token);
		else AppStorage.removeItem(LAST_NATIVE_PUSH_TOKEN_KEY);
	} catch (error) {
		logger.warn('Failed to persist the last registered native push token', error);
	}
};

const getCapacitorBridge = (): CapacitorBridge | null => {
	if (typeof window === 'undefined') return null;
	const bridge = (window as unknown as {Capacitor?: CapacitorBridge}).Capacitor;
	return bridge ?? null;
};

// The web bundle is also served inside the Capacitor shell (server.url), where
// the native bridge injects window.Capacitor. Web Push must not be used there:
// the shell registers a native FCM device instead, exactly like the desktop
// client blocks Web Push in favour of native notifications.
export function isNativePushSupported(): boolean {
	const bridge = getCapacitorBridge();
	if (!bridge || typeof bridge.isNativePlatform !== 'function' || !bridge.isNativePlatform()) return false;
	return bridge.getPlatform() === 'android';
}

const getPushNotificationsPlugin = (): PushNotificationsPlugin | null => {
	const bridge = getCapacitorBridge();
	if (!bridge || typeof bridge.registerPlugin !== 'function') return null;
	try {
		return bridge.registerPlugin('PushNotifications') as PushNotificationsPlugin;
	} catch (error) {
		logger.warn('PushNotifications plugin is not available in this shell', {error});
		return null;
	}
};

async function registerDeviceToken(token: string): Promise<string | null> {
	if (!token) return null;
	const previousToken = readLastNativePushToken();
	if (previousToken && previousToken !== token) {
		try {
			await http.post(Endpoints.USER_MOBILE_DEVICES_UNREGISTER, {
				body: {platform: ANDROID_FCM_PLATFORM, token: previousToken},
			});
		} catch (error) {
			logger.warn('Failed to unregister the previous native push token', {error});
		}
	}
	const response = await http.post<{device_id: string}>(Endpoints.USER_MOBILE_DEVICES, {
		body: {
			platform: ANDROID_FCM_PLATFORM,
			token,
			user_agent: navigator.userAgent,
			app_id: 'stable',
		},
	});
	writeLastNativePushToken(token);
	logger.debug('Registered native push device', {deviceId: response.body.device_id});
	return response.body.device_id;
}

let listenersAttached = false;
let tokenWaiters: Array<(deviceId: string | null) => void> = [];
const settleTokenWaiters = (deviceId: string | null): void => {
	const waiters = tokenWaiters;
	tokenWaiters = [];
	for (const waiter of waiters) waiter(deviceId);
};

async function ensureListeners(plugin: PushNotificationsPlugin): Promise<void> {
	if (listenersAttached) return;
	listenersAttached = true;
	await plugin.addListener('registration', (event) => {
		void registerDeviceToken(event.value).then(
			(deviceId) => settleTokenWaiters(deviceId),
			(error) => {
				logger.error('Failed to register the native push token with the backend', {error});
				settleTokenWaiters(null);
			},
		);
	});
	await plugin.addListener('registrationError', (event) => {
		logger.error('Native push registration failed', {error: event.error});
		settleTokenWaiters(null);
	});
	await plugin.addListener('pushNotificationReceived', (event) => {
		// The live gateway already updates the UI while the app is in the
		// foreground; this listener only keeps the delivery observable.
		logger.debug('Native push notification received in the foreground', {id: event.id});
	});
}

let nativeRegisterPromise: Promise<string | null> | null = null;

export async function registerNativePushSubscription(): Promise<string | null> {
	if (nativeRegisterPromise) return nativeRegisterPromise;
	const promise = (async () => {
		try {
			const plugin = getPushNotificationsPlugin();
			if (!plugin) return null;
			let permission = await plugin.checkPermissions();
			if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
				permission = await plugin.requestPermissions();
			}
			if (permission.receive !== 'granted') {
				logger.debug('Native push permission is not granted; skipping registration', {
					status: permission.receive,
				});
				return null;
			}
			await ensureListeners(plugin);
			const deviceIdPromise = new Promise<string | null>((resolve) => {
				tokenWaiters.push(resolve);
				setTimeout(() => resolve(null), REGISTRATION_TIMEOUT_MS);
			});
			await plugin.register();
			// The registration event settles the waiters; if the plugin stays
			// silent the timeout resolves null here, but a late event still
			// completes the backend registration in the background.
			return await deviceIdPromise;
		} catch (error) {
			logger.error('Failed to register native push subscription', {error});
			return null;
		} finally {
			nativeRegisterPromise = null;
		}
	})();
	nativeRegisterPromise = promise;
	return promise;
}

export async function unregisterNativePushSubscription(): Promise<void> {
	const token = readLastNativePushToken();
	if (!token) return;
	try {
		await http.post(Endpoints.USER_MOBILE_DEVICES_UNREGISTER, {
			body: {platform: ANDROID_FCM_PLATFORM, token},
		});
	} catch (error) {
		logger.warn('Failed to unregister the native push device', {error});
	}
	writeLastNativePushToken(null);
}
