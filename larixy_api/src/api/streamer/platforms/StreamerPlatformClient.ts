// SPDX-License-Identifier: AGPL-3.0-or-later

import type {StreamerPlatform} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';
import {ms} from 'itty-time';

export interface StreamerLiveStatus {
	live: boolean;
	title: string | null;
	startedAt: string | null;
	viewerCount: number | null;
}

export interface ResolvedStreamerChannel {
	platformChannelId: string;
	platformLogin: string;
	displayName: string;
	avatarUrl: string | null;
	canonicalUrl: string;
	live: StreamerLiveStatus;
}

export type StreamerChannelLocator =
	| {kind: 'login'; login: string}
	| {kind: 'handle'; handle: string}
	| {kind: 'channel_id'; channelId: string}
	| {kind: 'custom'; name: string};

export class StreamerPlatformError extends Error {
	constructor(
		readonly kind: 'not_configured' | 'not_found' | 'unavailable',
		message: string,
	) {
		super(message);
		this.name = 'StreamerPlatformError';
	}
}

export interface StreamerPlatformClient {
	readonly platform: StreamerPlatform;
	resolveChannel(locator: StreamerChannelLocator): Promise<ResolvedStreamerChannel>;
	getLiveStatus(platformChannelId: string, platformLogin: string): Promise<StreamerLiveStatus>;
}

export type StreamerCredentialsProvider = () => Promise<{clientId: string | null; clientSecret: string | null}>;

const FETCH_TIMEOUT_MS = ms('10 seconds');

export async function streamerPlatformFetch(url: string, init?: RequestInit): Promise<Response> {
	try {
		return await fetch(url, {...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)});
	} catch {
		throw new StreamerPlatformError('unavailable', `Could not reach ${new URL(url).host}`);
	}
}

export function offlineStreamerLiveStatus(): StreamerLiveStatus {
	return {live: false, title: null, startedAt: null, viewerCount: null};
}
