// SPDX-License-Identifier: AGPL-3.0-or-later

import {
	offlineStreamerLiveStatus,
	StreamerPlatformError,
	streamerPlatformFetch,
	type ResolvedStreamerChannel,
	type StreamerChannelLocator,
	type StreamerCredentialsProvider,
	type StreamerLiveStatus,
	type StreamerPlatformClient,
} from '@app/api/streamer/platforms/StreamerPlatformClient';

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

interface TwitchUser {
	id: string;
	login: string;
	display_name: string;
	profile_image_url: string;
}

interface TwitchStream {
	title: string;
	viewer_count: number;
	started_at: string;
}

let cachedAppToken: {value: string; clientId: string; expiresAtMs: number} | null = null;

export class TwitchStreamerClient implements StreamerPlatformClient {
	readonly platform = 'twitch' as const;

	constructor(private readonly credentials: StreamerCredentialsProvider) {}

	async resolveChannel(locator: StreamerChannelLocator): Promise<ResolvedStreamerChannel> {
		if (locator.kind !== 'login') {
			throw new StreamerPlatformError('not_found', 'Twitch channels are resolved by login');
		}
		const user = await this.getUserByLogin(locator.login);
		const live = await this.getLiveStatus(user.id);
		return {
			platformChannelId: user.id,
			platformLogin: user.login,
			displayName: user.display_name,
			avatarUrl: user.profile_image_url || null,
			canonicalUrl: `https://www.twitch.tv/${user.login}`,
			live,
		};
	}

	async getLiveStatus(platformChannelId: string): Promise<StreamerLiveStatus> {
		const data = await this.helixGet<Array<TwitchStream>>(`/streams?user_id=${encodeURIComponent(platformChannelId)}`);
		const stream = data[0];
		if (!stream) return offlineStreamerLiveStatus();
		return {
			live: true,
			title: stream.title || null,
			startedAt: stream.started_at || null,
			viewerCount: stream.viewer_count,
		};
	}

	private async getUserByLogin(login: string): Promise<TwitchUser> {
		const data = await this.helixGet<Array<TwitchUser>>(`/users?login=${encodeURIComponent(login)}`);
		const user = data[0];
		if (!user) throw new StreamerPlatformError('not_found', `No Twitch channel for login ${login}`);
		return user;
	}

	private async helixGet<T>(path: string): Promise<T> {
		const {token, clientId} = await this.getAppToken();
		const response = await streamerPlatformFetch(`${TWITCH_API_BASE}${path}`, {
			headers: {
				'Client-Id': clientId,
				Authorization: `Bearer ${token}`,
			},
		});
		if (response.status === 401) {
			cachedAppToken = null;
			throw new StreamerPlatformError('unavailable', 'Twitch rejected the app token');
		}
		if (!response.ok) {
			throw new StreamerPlatformError('unavailable', `Twitch answered ${response.status}`);
		}
		const body = (await response.json()) as {data?: T};
		if (!body.data) throw new StreamerPlatformError('unavailable', 'Twitch answered without data');
		return body.data;
	}

	private async getAppToken(): Promise<{token: string; clientId: string}> {
		const {clientId, clientSecret} = await this.credentials();
		if (!clientId || !clientSecret) {
			throw new StreamerPlatformError('not_configured', 'Twitch is not configured on this instance');
		}
		if (cachedAppToken && cachedAppToken.clientId === clientId && cachedAppToken.expiresAtMs > Date.now()) {
			return {token: cachedAppToken.value, clientId};
		}
		const response = await streamerPlatformFetch(TWITCH_TOKEN_URL, {
			method: 'POST',
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'client_credentials',
			}),
		});
		if (!response.ok) {
			throw new StreamerPlatformError('not_configured', 'Twitch rejected the app credentials');
		}
		const body = (await response.json()) as {access_token?: string; expires_in?: number};
		if (!body.access_token) {
			throw new StreamerPlatformError('unavailable', 'Twitch answered without an access token');
		}
		const ttlMs = Math.max((body.expires_in ?? 3600) - 60, 60) * 1000;
		cachedAppToken = {value: body.access_token, clientId, expiresAtMs: Date.now() + ttlMs};
		return {token: body.access_token, clientId};
	}
}
