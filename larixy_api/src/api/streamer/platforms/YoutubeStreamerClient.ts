// SPDX-License-Identifier: AGPL-3.0-or-later

import {
	offlineStreamerLiveStatus,
	StreamerPlatformError,
	streamerPlatformFetch,
	type ResolvedStreamerChannel,
	type StreamerChannelLocator,
	type StreamerLiveStatus,
	type StreamerPlatformClient,
} from '@app/api/streamer/platforms/StreamerPlatformClient';

const YOUTUBE_BASE = 'https://www.youtube.com';
const CHANNEL_ID_PATTERN = /"channelId":"(UC[A-Za-z0-9_-]{22})"|"browseId":"(UC[A-Za-z0-9_-]{22})"/;
const OG_TITLE_PATTERN = /<meta property="og:title" content="([^"]*)"/;
const OG_IMAGE_PATTERN = /<meta property="og:image" content="([^"]*)"/;
const LIVE_TITLE_PATTERN = /"videoDetails":\{"videoId":"[^"]+","title":"((?:[^"\\]|\\.)*)"/;

const YOUTUBE_HEADERS = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
	'Accept-Language': 'en-US,en;q=0.9',
	Cookie: 'CONSENT=YES+cb.20240101-01-p0.en+FX+100',
};

export class YoutubeStreamerClient implements StreamerPlatformClient {
	readonly platform = 'youtube' as const;

	async resolveChannel(locator: StreamerChannelLocator): Promise<ResolvedStreamerChannel> {
		const channelId = locator.kind === 'channel_id' ? locator.channelId : await this.resolveChannelId(locator);
		const page = await this.fetchPage(`${YOUTUBE_BASE}/channel/${channelId}`);
		const displayName = firstMatch(page, OG_TITLE_PATTERN);
		if (!displayName) {
			throw new StreamerPlatformError('unavailable', 'YouTube did not answer with channel metadata');
		}
		const live = await this.getLiveStatus(channelId);
		return {
			platformChannelId: channelId,
			platformLogin: channelId,
			displayName,
			avatarUrl: firstMatch(page, OG_IMAGE_PATTERN),
			canonicalUrl: `${YOUTUBE_BASE}/channel/${channelId}`,
			live,
		};
	}

	async getLiveStatus(platformChannelId: string): Promise<StreamerLiveStatus> {
		const page = await this.fetchPage(`${YOUTUBE_BASE}/channel/${platformChannelId}/live`);
		if (!page.includes('"isLive":true')) return offlineStreamerLiveStatus();
		return {live: true, title: extractLiveTitle(page), startedAt: null, viewerCount: null};
	}

	private async resolveChannelId(locator: StreamerChannelLocator): Promise<string> {
		const path =
			locator.kind === 'handle' ? `/${locator.handle}` : locator.kind === 'custom' ? `/c/${locator.name}` : null;
		if (path === null) {
			throw new StreamerPlatformError('not_found', 'YouTube channels are resolved by handle or channel id');
		}
		const page = await this.fetchPage(`${YOUTUBE_BASE}${path}`);
		const match = CHANNEL_ID_PATTERN.exec(page);
		const channelId = match?.[1] ?? match?.[2];
		if (!channelId) {
			throw new StreamerPlatformError('unavailable', 'YouTube did not answer with a channel id');
		}
		return channelId;
	}

	private async fetchPage(url: string): Promise<string> {
		const response = await streamerPlatformFetch(url, {headers: YOUTUBE_HEADERS});
		if (response.status === 404) {
			throw new StreamerPlatformError('not_found', 'That YouTube channel does not exist');
		}
		if (!response.ok) {
			throw new StreamerPlatformError('unavailable', `YouTube answered ${response.status}`);
		}
		return response.text();
	}
}

function firstMatch(page: string, pattern: RegExp): string | null {
	const match = pattern.exec(page);
	return match?.[1] ? unescapeHtml(match[1]) : null;
}

function extractLiveTitle(page: string): string | null {
	const match = LIVE_TITLE_PATTERN.exec(page);
	if (!match?.[1]) return null;
	try {
		return JSON.parse(`"${match[1]}"`) as string;
	} catch {
		return match[1];
	}
}

function unescapeHtml(value: string): string {
	return value
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'")
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&amp;', '&');
}
