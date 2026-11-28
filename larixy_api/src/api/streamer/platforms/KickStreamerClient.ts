// SPDX-License-Identifier: AGPL-3.0-or-later

import {
	offlineStreamerLiveStatus,
	STREAMER_BROWSER_USER_AGENT,
	StreamerPlatformError,
	streamerPlatformFetch,
	type ResolvedStreamerChannel,
	type StreamerChannelLocator,
	type StreamerCredentialsProvider,
	type StreamerLiveStatus,
	type StreamerPlatformClient,
} from '@app/api/streamer/platforms/StreamerPlatformClient';

const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token';
const KICK_API_BASE = 'https://api.kick.com/public/v1';

interface KickStream {
	is_live?: boolean;
	start_time?: string;
	viewer_count?: number;
}

interface KickChannel {
	broadcaster_user_id: number;
	slug: string;
	stream_title?: string;
	stream?: KickStream | null;
}

let cachedAppToken: {value: string; clientId: string; expiresAtMs: number} | null = null;

export class KickStreamerClient implements StreamerPlatformClient {
	readonly platform = 'kick' as const;

	constructor(private readonly credentials: StreamerCredentialsProvider) {}

	async resolveChannel(locator: StreamerChannelLocator): Promise<ResolvedStreamerChannel> {
		if (locator.kind !== 'login') {
			throw new StreamerPlatformError('not_found', 'Kick channels are resolved by slug');
		}
		const channel = await this.getChannel(`slug=${encodeURIComponent(locator.login)}`);
		return {
			platformChannelId: String(channel.broadcaster_user_id),
			platformLogin: channel.slug,
			displayName: channel.slug,
			avatarUrl: null,
			canonicalUrl: `https://kick.com/${channel.slug}`,
			live: toLiveStatus(channel),
		};
	}

	async getLiveStatus(platformChannelId: string): Promise<StreamerLiveStatus> {
		const channel = await this.getChannel(`broadcaster_user_id=${encodeURIComponent(platformChannelId)}`);
		return toLiveStatus(channel);
	}

	private async getChannel(query: string): Promise<KickChannel> {
		const token = await this.getAppToken();
		const response = await streamerPlatformFetch(`${KICK_API_BASE}/channels?${query}`, {
			headers: {Authorization: `Bearer ${token}`, 'User-Agent': STREAMER_BROWSER_USER_AGENT},
		});
		if (response.status === 401) {
			cachedAppToken = null;
			throw new StreamerPlatformError('unavailable', 'Kick rejected the app token');
		}
		if (!response.ok) {
			throw new StreamerPlatformError('unavailable', `Kick answered ${response.status}`);
		}
		const body = (await response.json()) as {data?: Array<KickChannel>};
		const channel = body.data?.[0];
		if (!channel) throw new StreamerPlatformError('not_found', 'No Kick channel matched');
		return channel;
	}

	private async getAppToken(): Promise<string> {
		const {clientId, clientSecret} = await this.credentials();
		if (!clientId || !clientSecret) {
			throw new StreamerPlatformError('not_configured', 'Kick is not configured on this instance');
		}
		if (cachedAppToken && cachedAppToken.clientId === clientId && cachedAppToken.expiresAtMs > Date.now()) {
			return cachedAppToken.value;
		}
		const form = new URLSearchParams({
			client_id: clientId,
			grant_type: 'client_credentials',
		});
		form.set('client_secret', clientSecret);
		const response = await streamerPlatformFetch(KICK_TOKEN_URL, {
			method: 'POST',
			headers: {'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': STREAMER_BROWSER_USER_AGENT},
			body: form,
		});
		if (!response.ok) {
			throw new StreamerPlatformError('not_configured', 'Kick rejected the app credentials');
		}
		const body = (await response.json()) as {access_token?: string; expires_in?: number};
		if (!body.access_token) {
			throw new StreamerPlatformError('unavailable', 'Kick answered without an access token');
		}
		const ttlMs = Math.max((body.expires_in ?? 3600) - 60, 60) * 1000;
		cachedAppToken = {value: body.access_token, clientId, expiresAtMs: Date.now() + ttlMs};
		return body.access_token;
	}
}

function toLiveStatus(channel: KickChannel): StreamerLiveStatus {
	const stream = channel.stream;
	if (!stream?.is_live) return offlineStreamerLiveStatus();
	const startedAt = stream.start_time && !stream.start_time.startsWith('0001-') ? stream.start_time : null;
	return {
		live: true,
		title: channel.stream_title || null,
		startedAt,
		viewerCount: stream.viewer_count ?? null,
	};
}
