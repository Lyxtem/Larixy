// SPDX-License-Identifier: AGPL-3.0-or-later

import type {UserID} from '@app/api/BrandedTypes';
import type {InstanceConfigRepository} from '@app/api/instance/InstanceConfigRepository';
import {KickStreamerClient} from '@app/api/streamer/platforms/KickStreamerClient';
import {
	StreamerPlatformError,
	type StreamerChannelLocator,
	type StreamerPlatformClient,
} from '@app/api/streamer/platforms/StreamerPlatformClient';
import {TwitchStreamerClient} from '@app/api/streamer/platforms/TwitchStreamerClient';
import {YoutubeStreamerClient} from '@app/api/streamer/platforms/YoutubeStreamerClient';
import {ValidationErrorCodes} from '@larixy/constants/src/ValidationErrorCodes';
import {FeatureTemporarilyDisabledError} from '@larixy/errors/src/domains/core/FeatureTemporarilyDisabledError';
import {InputValidationError} from '@larixy/errors/src/domains/core/InputValidationError';
import {streamerModeUserActive} from '@larixy/schema/src/domains/admin/StreamerModeSchemas';
import {
	type StreamerLinkValidateRequest,
	type StreamerLinkValidateResponse,
	type StreamerPlatform,
} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';

const TWITCH_LOGIN_PATTERN = /^[a-zA-Z0-9_]{3,25}$/;
const KICK_SLUG_PATTERN = /^[a-zA-Z0-9_-]{3,25}$/;
const YOUTUBE_HANDLE_PATTERN = /^@[a-zA-Z0-9._-]{3,30}$/;
const YOUTUBE_CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;

export class StreamerLinkService {
	constructor(private readonly instanceConfigRepository: InstanceConfigRepository) {}

	async validateLink(params: {
		userId: UserID;
		data: StreamerLinkValidateRequest;
	}): Promise<StreamerLinkValidateResponse> {
		const experiment = await this.instanceConfigRepository.getStreamerModeConfig();
		if (!streamerModeUserActive(experiment, params.userId.toString())) {
			throw new FeatureTemporarilyDisabledError();
		}
		const parsed = parseStreamerChannelUrl(params.data.url);
		const client = this.createClient(parsed.platform);
		try {
			const resolved = await client.resolveChannel(parsed.locator);
			return {
				platform: parsed.platform,
				url: resolved.canonicalUrl,
				platform_channel_id: resolved.platformChannelId,
				platform_login: resolved.platformLogin,
				display_name: resolved.displayName,
				avatar_url: resolved.avatarUrl,
				live_now: resolved.live.live,
			};
		} catch (error) {
			if (error instanceof StreamerPlatformError) throw toValidationError(error);
			throw error;
		}
	}

	private createClient(platform: StreamerPlatform): StreamerPlatformClient {
		switch (platform) {
			case 'twitch':
				return new TwitchStreamerClient(() => this.platformCredentials('twitch'));
			case 'kick':
				return new KickStreamerClient(() => this.platformCredentials('kick'));
			case 'youtube':
				return new YoutubeStreamerClient();
		}
	}

	private async platformCredentials(
		platform: 'twitch' | 'kick',
	): Promise<{clientId: string | null; clientSecret: string | null}> {
		const {streamer} = await this.instanceConfigRepository.getInstanceIntegrationsConfig();
		return platform === 'twitch'
			? {clientId: streamer.twitch_client_id, clientSecret: streamer.twitch_client_secret}
			: {clientId: streamer.kick_client_id, clientSecret: streamer.kick_client_secret};
	}
}

function toValidationError(error: StreamerPlatformError): InputValidationError {
	switch (error.kind) {
		case 'not_configured':
			return InputValidationError.fromCode('url', ValidationErrorCodes.STREAMER_PLATFORM_NOT_CONFIGURED);
		case 'not_found':
			return InputValidationError.fromCode('url', ValidationErrorCodes.STREAMER_CHANNEL_NOT_FOUND);
		case 'unavailable':
			return InputValidationError.fromCode('url', ValidationErrorCodes.STREAMER_PLATFORM_UNAVAILABLE);
	}
}

function invalidLink(): InputValidationError {
	return InputValidationError.fromCode('url', ValidationErrorCodes.STREAMER_LINK_INVALID);
}

function parseStreamerChannelUrl(rawUrl: string): {platform: StreamerPlatform; locator: StreamerChannelLocator} {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		throw invalidLink();
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') throw invalidLink();
	const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
	let segments: Array<string>;
	try {
		segments = url.pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
	} catch {
		throw invalidLink();
	}
	if (host === 'twitch.tv') {
		const login = segments[0];
		if (segments.length !== 1 || !login || !TWITCH_LOGIN_PATTERN.test(login)) throw invalidLink();
		return {platform: 'twitch', locator: {kind: 'login', login: login.toLowerCase()}};
	}
	if (host === 'kick.com') {
		const slug = segments[0];
		if (segments.length !== 1 || !slug || !KICK_SLUG_PATTERN.test(slug)) throw invalidLink();
		return {platform: 'kick', locator: {kind: 'login', login: slug.toLowerCase()}};
	}
	if (host === 'youtube.com') {
		const [first, second] = segments;
		if (segments.length === 1 && first && YOUTUBE_HANDLE_PATTERN.test(first)) {
			return {platform: 'youtube', locator: {kind: 'handle', handle: first}};
		}
		if (segments.length === 2 && first === 'channel' && second && YOUTUBE_CHANNEL_ID_PATTERN.test(second)) {
			return {platform: 'youtube', locator: {kind: 'channel_id', channelId: second}};
		}
		if (segments.length === 2 && (first === 'c' || first === 'user') && second) {
			return {platform: 'youtube', locator: {kind: 'custom', name: second}};
		}
		throw invalidLink();
	}
	if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
		throw InputValidationError.fromCode('url', ValidationErrorCodes.STREAMER_PLATFORM_UNSUPPORTED);
	}
	throw invalidLink();
}
