// SPDX-License-Identifier: AGPL-3.0-or-later

type LarixyDebugObject = NonNullable<Window['__LARIXY_DEBUG__']>;

export function getLarixyDebugObject(): LarixyDebugObject | null {
	if (typeof window === 'undefined') {
		return null;
	}
	const existing = window.__LARIXY_DEBUG__;
	if (existing === undefined || existing === null) {
		const created: LarixyDebugObject = {};
		window.__LARIXY_DEBUG__ = created;
		return created;
	}
	if (typeof existing !== 'object' || Array.isArray(existing)) {
		return null;
	}
	return existing;
}
