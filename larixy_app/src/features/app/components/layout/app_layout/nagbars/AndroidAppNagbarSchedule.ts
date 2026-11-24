// SPDX-License-Identifier: AGPL-3.0-or-later

import {useEffect, useState} from 'react';

// Larixy is not published on Google Play yet (the listing does not exist),
// so this nagbar stays off. Set the date back to the past to re-enable it
// once the app is actually available on Google Play.
const ANDROID_APP_NAGBAR_STARTS_AT_MS = Date.parse('2099-01-01T00:00:00.000Z');
const LONGEST_TIMER_MS = 24 * 60 * 60 * 1000;

export function useAndroidAppNagbarStarted(): boolean {
	const [now, setNow] = useState(Date.now);
	const started = now >= ANDROID_APP_NAGBAR_STARTS_AT_MS;
	useEffect(() => {
		if (started) return;
		const timer = window.setTimeout(
			() => setNow(Date.now()),
			Math.min(ANDROID_APP_NAGBAR_STARTS_AT_MS - now, LONGEST_TIMER_MS),
		);
		return () => window.clearTimeout(timer);
	}, [started, now]);
	return started;
}
