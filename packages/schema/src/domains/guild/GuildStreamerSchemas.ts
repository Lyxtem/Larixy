// SPDX-License-Identifier: AGPL-3.0-or-later

import {GuildIdParam} from '@larixy/schema/src/domains/common/CommonParamSchemas';
import {SnowflakeStringType, SnowflakeType} from '@larixy/schema/src/primitives/SchemaPrimitives';
import {URLType} from '@larixy/schema/src/primitives/UrlValidators';
import {z} from 'zod';

export const StreamerPlatformSchema = z
	.enum(['twitch', 'kick', 'youtube'])
	.describe('Streaming platform: twitch, kick or youtube');

export type StreamerPlatform = z.infer<typeof StreamerPlatformSchema>;

export const StreamerConfigStatusSchema = z
	.enum(['active', 'needs_review'])
	.describe('Streamer config health: active, or needs_review when something the alerts rely on is gone');

export type StreamerConfigStatus = z.infer<typeof StreamerConfigStatusSchema>;

export const StreamerLinkSchema = z.object({
	platform: StreamerPlatformSchema,
	url: URLType.describe('The channel URL the owner pasted'),
	platform_channel_id: z
		.string()
		.min(1)
		.max(128)
		.describe('Platform channel identifier, resolved when the link was validated'),
	platform_login: z.string().min(1).max(128).describe('Platform login, slug or handle of the channel'),
	display_name: z.string().min(1).max(128).describe('Channel display name, used in the live alert text'),
});

export type StreamerLink = z.infer<typeof StreamerLinkSchema>;

export const GuildStreamerConfigResponse = z.object({
	guild_id: SnowflakeStringType.describe('ID of the guild'),
	owner_user_id: SnowflakeStringType.describe('ID of the guild owner, whose channels are watched'),
	enabled: z.boolean().describe('Whether live alerts are on for this guild'),
	status: StreamerConfigStatusSchema,
	alerts_channel_id: SnowflakeStringType.nullable().describe('Channel where live alerts are posted'),
	alerts_role_id: SnowflakeStringType.nullable().describe('Role the live alerts mention when mention_role is on'),
	mention_role: z.boolean().describe('Whether live alerts mention the alerts role'),
	links: z.array(StreamerLinkSchema).describe('Linked channels, at most one per platform'),
	created_at: z.iso.datetime().describe('When the streamer config was created'),
	updated_at: z.iso.datetime().describe('When the streamer config was last changed'),
});

export type GuildStreamerConfigResponse = z.infer<typeof GuildStreamerConfigResponse>;

export const GuildStreamerConfigUpdateRequest = z.object({
	alerts_channel_id: SnowflakeType.nullish().describe('New alerts channel, or null to clear it'),
	enabled: z.boolean().optional().describe('Turn live alerts on or off without deleting the config'),
	mention_role: z.boolean().optional().describe('Whether live alerts mention the alerts role'),
});

export type GuildStreamerConfigUpdateRequest = z.infer<typeof GuildStreamerConfigUpdateRequest>;

export const StreamerLinkCreateRequest = StreamerLinkSchema;

export type StreamerLinkCreateRequest = z.infer<typeof StreamerLinkCreateRequest>;

export const StreamerLinkParam = GuildIdParam.extend({
	platform: StreamerPlatformSchema,
});

export type StreamerLinkParam = z.infer<typeof StreamerLinkParam>;
