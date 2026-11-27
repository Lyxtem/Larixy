// SPDX-License-Identifier: AGPL-3.0-or-later

import {createGuildID} from '@app/api/BrandedTypes';
import {LoginRequired} from '@app/api/middleware/AuthMiddleware';
import {RateLimitMiddleware} from '@app/api/middleware/RateLimitMiddleware';
import {OpenAPI} from '@app/api/middleware/ResponseTypeMiddleware';
import {RateLimitConfigs} from '@app/api/RateLimitConfig';
import type {HonoApp} from '@app/api/types/HonoEnv';
import {Validator} from '@app/api/Validator';
import {GuildIdParam} from '@larixy/schema/src/domains/common/CommonParamSchemas';
import {
	GuildStreamerConfigResponse,
	GuildStreamerConfigUpdateRequest,
	StreamerLinkCreateRequest,
	StreamerLinkParam,
	StreamerLinkValidateRequest,
	StreamerLinkValidateResponse,
} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';

export function StreamerController(app: HonoApp) {
	app.post(
		'/streamer/validate-link',
		RateLimitMiddleware(RateLimitConfigs.STREAMER_LINK_VALIDATE),
		LoginRequired,
		Validator('json', StreamerLinkValidateRequest),
		OpenAPI({
			operationId: 'validate_streamer_link',
			summary: 'Validate a streamer channel link',
			description:
				'Resolves a YouTube, Twitch or Kick channel link to the platform channel: its identifier, login, display name and whether it is live right now. Part of the closed streamer mode experiment: accounts outside the experiment get a feature disabled answer.',
			responseSchema: StreamerLinkValidateResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
		}),
		async (ctx) =>
			ctx.json(
				await ctx.get('streamerLinkService').validateLink({
					userId: ctx.get('user').id,
					data: ctx.req.valid('json'),
				}),
			),
	);
	app.get(
		'/guilds/:guild_id/streamer',
		RateLimitMiddleware(RateLimitConfigs.GUILD_STREAMER_CONFIG),
		LoginRequired,
		Validator('param', GuildIdParam),
		OpenAPI({
			operationId: 'get_guild_streamer_config',
			summary: 'Get guild streamer config',
			description:
				'Returns the streamer config of the guild: linked channels, alerts channel and role, and whether live alerts are on. Requires manage guild permission. Part of the closed streamer mode experiment: for guilds outside the experiment this answers as if the guild did not exist.',
			responseSchema: GuildStreamerConfigResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
		}),
		async (ctx) =>
			ctx.json(
				await ctx.get('streamerConfigService').getConfig({
					userId: ctx.get('user').id,
					guildId: createGuildID(ctx.req.valid('param').guild_id),
				}),
			),
	);
	app.patch(
		'/guilds/:guild_id/streamer',
		RateLimitMiddleware(RateLimitConfigs.GUILD_STREAMER_CONFIG_UPDATE),
		LoginRequired,
		Validator('param', GuildIdParam),
		Validator('json', GuildStreamerConfigUpdateRequest),
		OpenAPI({
			operationId: 'update_guild_streamer_config',
			summary: 'Update guild streamer config',
			description:
				'Changes the alerts channel, turns live alerts on or off, and toggles the alerts role mention. Requires manage guild permission. Part of the closed streamer mode experiment.',
			responseSchema: GuildStreamerConfigResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
		}),
		async (ctx) =>
			ctx.json(
				await ctx.get('streamerConfigService').updateConfig({
					userId: ctx.get('user').id,
					guildId: createGuildID(ctx.req.valid('param').guild_id),
					data: ctx.req.valid('json'),
				}),
			),
	);
	app.post(
		'/guilds/:guild_id/streamer/links',
		RateLimitMiddleware(RateLimitConfigs.GUILD_STREAMER_CONFIG_UPDATE),
		LoginRequired,
		Validator('param', GuildIdParam),
		Validator('json', StreamerLinkCreateRequest),
		OpenAPI({
			operationId: 'add_guild_streamer_link',
			summary: 'Add a streamer link to a guild',
			description:
				'Links a streaming channel to the guild, at most one per platform. The channel must already be resolved by link validation. Requires manage guild permission. Part of the closed streamer mode experiment.',
			responseSchema: GuildStreamerConfigResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
		}),
		async (ctx) =>
			ctx.json(
				await ctx.get('streamerConfigService').addLink({
					userId: ctx.get('user').id,
					guildId: createGuildID(ctx.req.valid('param').guild_id),
					link: ctx.req.valid('json'),
				}),
			),
	);
	app.delete(
		'/guilds/:guild_id/streamer/links/:platform',
		RateLimitMiddleware(RateLimitConfigs.GUILD_STREAMER_CONFIG_UPDATE),
		LoginRequired,
		Validator('param', StreamerLinkParam),
		OpenAPI({
			operationId: 'remove_guild_streamer_link',
			summary: 'Remove a streamer link from a guild',
			description:
				'Removes the link for the given platform and its live state. Answers 204 even when the guild had no link for that platform. Requires manage guild permission. Part of the closed streamer mode experiment.',
			responseSchema: null,
			statusCode: 204,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
		}),
		async (ctx) => {
			const params = ctx.req.valid('param');
			await ctx.get('streamerConfigService').removeLink({
				userId: ctx.get('user').id,
				guildId: createGuildID(params.guild_id),
				platform: params.platform,
			});
			return ctx.body(null, 204);
		},
	);
}
