// SPDX-License-Identifier: AGPL-3.0-or-later

import {BUILD_CHANNEL, type BuildChannel} from '@electron/common/BuildChannel';

const DESKTOP_APP_NAMES: Record<BuildChannel, string> = {
	stable: 'Larixy',
	canary: 'Larixy Canary',
	development: 'Larixy Development',
};
const MACOS_BUNDLE_IDS: Record<BuildChannel, string> = {
	stable: 'app.larixy',
	canary: 'app.larixy.canary',
	development: 'app.larixy.comelopment',
};
const LINUX_DESKTOP_ENTRY_IDS: Record<BuildChannel, string> = {
	stable: 'app.larixy.LarixyDesktop',
	canary: 'app.larixy.LarixyDesktopCanary',
	development: 'app.larixy.LarixyDesktopDevelopment',
};
const LEGACY_LINUX_DESKTOP_ENTRY_IDS: Record<BuildChannel, string> = {
	stable: 'larixy',
	canary: 'larixy-canary',
	development: 'larixy-development',
};
const LINUX_PORTAL_SESSION_TOKENS: Record<BuildChannel, string> = {
	stable: 'larixy_global_shortcuts',
	canary: 'larixy_canary_global_shortcuts',
	development: 'larixy_development_global_shortcuts',
};
const WINDOWS_VELOPACK_IDS: Record<BuildChannel, string> = {
	stable: 'larixy_desktop',
	canary: 'larixy_desktop_canary',
	development: 'larixy_desktop_development',
};
const WINDOWS_APP_USER_MODEL_IDS: Record<BuildChannel, string> = {
	stable: 'Larixy.Larixy',
	canary: 'Larixy.Larixy.Canary',
	development: 'Larixy.Larixy.Development',
};
const WINDOWS_TOAST_ACTIVATOR_CLSIDS: Record<BuildChannel, string> = {
	stable: '{48EEF21B-F3AE-431E-8CF2-386FFB2143F2}',
	canary: '{9CEDB5C0-3552-43B0-A279-2232E0CDF74C}',
	development: '{B277AB5D-371C-4098-A76D-1DAE00AC0863}',
};

export const DESKTOP_APP_NAME = DESKTOP_APP_NAMES[BUILD_CHANNEL];
export const MACOS_BUNDLE_ID = MACOS_BUNDLE_IDS[BUILD_CHANNEL];
export const LINUX_DESKTOP_ENTRY_ID = LINUX_DESKTOP_ENTRY_IDS[BUILD_CHANNEL];
export const LINUX_PORTAL_SESSION_TOKEN = LINUX_PORTAL_SESSION_TOKENS[BUILD_CHANNEL];
export const LEGACY_LINUX_DESKTOP_ENTRY_ID = LEGACY_LINUX_DESKTOP_ENTRY_IDS[BUILD_CHANNEL];
export const LINUX_ICON_NAME = LEGACY_LINUX_DESKTOP_ENTRY_IDS[BUILD_CHANNEL];
export const OTHER_CHANNEL_LINUX_DESKTOP_FILES: ReadonlySet<string> = new Set(
	(Object.keys(LINUX_DESKTOP_ENTRY_IDS) as Array<BuildChannel>)
		.filter((channel) => channel !== BUILD_CHANNEL)
		.flatMap((channel) => [LINUX_DESKTOP_ENTRY_IDS[channel], LEGACY_LINUX_DESKTOP_ENTRY_IDS[channel]])
		.map((id) => `${id}.desktop`),
);
export const WINDOWS_SHORTCUT_AUTHOR = 'Larixy Platform AB';
export const WINDOWS_VELOPACK_ID = WINDOWS_VELOPACK_IDS[BUILD_CHANNEL];
export const WINDOWS_LEGACY_SQUIRREL_ID = 'larixy_app';
export const WINDOWS_APP_USER_MODEL_ID = WINDOWS_APP_USER_MODEL_IDS[BUILD_CHANNEL];
export const WINDOWS_LEGACY_APP_USER_MODEL_IDS = [`velopack.${WINDOWS_VELOPACK_ID}`];
export const WINDOWS_TOAST_ACTIVATOR_CLSID = WINDOWS_TOAST_ACTIVATOR_CLSIDS[BUILD_CHANNEL];
