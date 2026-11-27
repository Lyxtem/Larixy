// SPDX-License-Identifier: AGPL-3.0-or-later

import type {RouteRateLimitConfig} from '@app/api/middleware/RateLimitMiddleware';
import {ms} from 'itty-time';

export const StreamerRateLimitConfigs = {
	GUILD_STREAMER_CONFIG: {
		bucket: 'guild:streamer:config',
		config: {limit: 30, windowMs: ms('10 seconds')},
	} as RouteRateLimitConfig,
	GUILD_STREAMER_CONFIG_UPDATE: {
		bucket: 'guild:streamer:config_update',
		config: {limit: 10, windowMs: ms('10 seconds')},
	} as RouteRateLimitConfig,
} as const;
