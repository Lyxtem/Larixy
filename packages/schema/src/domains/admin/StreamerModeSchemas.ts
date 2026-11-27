// SPDX-License-Identifier: AGPL-3.0-or-later

import {z} from 'zod';

const STREAMER_MODE_MAX_TARGETED_IDS = 1000;

const StreamerModeIdsSchema = z.array(z.string().regex(/^\d{1,20}$/u)).max(STREAMER_MODE_MAX_TARGETED_IDS);

const streamerModeConfigFields = {
	enabled: z.boolean().describe('Kill switch for the streamer mode experiment'),
	included_user_ids: StreamerModeIdsSchema.describe('Accounts that can create and manage streamer guilds'),
	included_guild_ids: StreamerModeIdsSchema.describe('Guilds where streamer mode is active'),
};

export const StreamerModeConfigSchema = z.object({
	enabled: streamerModeConfigFields.enabled.default(false),
	included_user_ids: streamerModeConfigFields.included_user_ids.default([]),
	included_guild_ids: streamerModeConfigFields.included_guild_ids.default([]),
});

export type StreamerModeConfig = z.infer<typeof StreamerModeConfigSchema>;

export const StreamerModeConfigResponse = StreamerModeConfigSchema;

export const StreamerModeConfigUpdateRequest = z.object(streamerModeConfigFields).partial();

export type StreamerModeConfigUpdateRequest = z.infer<typeof StreamerModeConfigUpdateRequest>;

export const StreamerModeAssignmentResponse = z.object({
	enabled: z.boolean().describe('Whether this person can use streamer mode'),
});

export type StreamerModeAssignmentResponse = z.infer<typeof StreamerModeAssignmentResponse>;

export function streamerModeUserActive(config: StreamerModeConfig, userId: string): boolean {
	if (!config.enabled) return false;
	return config.included_user_ids.includes(userId);
}
