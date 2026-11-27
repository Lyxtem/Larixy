// SPDX-License-Identifier: AGPL-3.0-or-later

import type {GuildID, UserID} from '@app/api/BrandedTypes';
import type {ChannelDataRepository} from '@app/api/channel/repositories/ChannelDataRepository';
import type {GuildStreamerConfigRow} from '@app/api/database/types/StreamerTypes';
import type {GuildRepository} from '@app/api/guild/repositories/GuildRepository';
import type {InstanceConfigRepository} from '@app/api/instance/InstanceConfigRepository';
import {Logger} from '@app/api/Logger';
import {StreamerConfigRepository} from '@app/api/streamer/StreamerConfigRepository';
import {ChannelTypes} from '@larixy/constants/src/ChannelConstants';
import {FeatureTemporarilyDisabledError} from '@larixy/errors/src/domains/core/FeatureTemporarilyDisabledError';
import {InputValidationError} from '@larixy/errors/src/domains/core/InputValidationError';
import {streamerModeUserActive} from '@larixy/schema/src/domains/admin/StreamerModeSchemas';
import type {StreamerLink} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';
import type {GuildCreateRequest} from '@larixy/schema/src/domains/guild/GuildRequestSchemas';
import type {TemplateSerializedGuild} from '@larixy/schema/src/domains/guild/GuildTemplateSchemas';

const ALERTS_CHANNEL_NAME = 'avisos';
const ALERTS_ROLE_NAME = 'Avisos';

function buildStreamerGuildTemplate(guildName: string): TemplateSerializedGuild {
	return {
		name: guildName,
		roles: [{id: 1, name: ALERTS_ROLE_NAME, permissions_new: '0', mentionable: true, hoist: false}],
		channels: [
			{id: 10, type: 4, name: '📌 Información', position: 0},
			{id: 11, type: 0, name: 'reglas', position: 0, parent_id: 10},
			{id: 12, type: 0, name: ALERTS_CHANNEL_NAME, position: 1, parent_id: 10},
			{id: 20, type: 4, name: '💬 Comunidad', position: 1},
			{id: 21, type: 0, name: 'general', position: 0, parent_id: 20},
			{id: 22, type: 0, name: 'clips-y-videos', position: 1, parent_id: 20},
			{id: 30, type: 4, name: '🎮 A jugar', position: 2},
			{id: 31, type: 0, name: 'busco-grupo', position: 0, parent_id: 30},
			{id: 32, type: 2, name: 'En directo', position: 1, parent_id: 30},
		],
		system_channel_id: 21,
	};
}

export class StreamerGuildCreationService {
	private readonly repository = new StreamerConfigRepository();

	constructor(
		private readonly instanceConfigRepository: InstanceConfigRepository,
		private readonly channelDataRepository: ChannelDataRepository,
		private readonly guildRepository: GuildRepository,
	) {}

	async prepareCreate(params: {userId: UserID; data: GuildCreateRequest}): Promise<GuildCreateRequest> {
		const {data} = params;
		if (!data.streamer) return data;
		const config = await this.instanceConfigRepository.getStreamerModeConfig();
		if (!streamerModeUserActive(config, params.userId.toString())) {
			throw new FeatureTemporarilyDisabledError();
		}
		if (data.template) {
			throw InputValidationError.create('template', 'Choose either a template or streamer mode, not both');
		}
		return {
			name: data.name,
			icon: data.icon,
			empty_features: data.empty_features,
			template: buildStreamerGuildTemplate(data.name),
		};
	}

	async completeCreate(params: {guildId: GuildID; ownerUserId: UserID; links: Array<StreamerLink>}): Promise<void> {
		const now = new Date();
		const baseRow: GuildStreamerConfigRow = {
			guild_id: params.guildId,
			owner_user_id: params.ownerUserId,
			enabled: true,
			status: 'needs_review',
			alerts_channel_id: null,
			alerts_role_id: null,
			mention_role: true,
			links: params.links.map((link) => ({
				platform: link.platform,
				url: link.url,
				platform_channel_id: link.platform_channel_id,
				platform_login: link.platform_login,
				display_name: link.display_name,
			})),
			created_at: now,
			updated_at: now,
		};
		try {
			const [channels, roles] = await Promise.all([
				this.channelDataRepository.listGuildChannels(params.guildId, 'complete'),
				this.guildRepository.listRoles(params.guildId),
			]);
			const alertsChannel = channels.find(
				(channel) => channel.type === ChannelTypes.GUILD_TEXT && channel.name === ALERTS_CHANNEL_NAME,
			);
			const alertsRole = roles.find((role) => role.name === ALERTS_ROLE_NAME);
			if (!alertsChannel || !alertsRole) {
				throw new Error('Streamer template entities were not found after guild creation');
			}
			await this.repository.upsertConfig({
				...baseRow,
				status: 'active',
				alerts_channel_id: alertsChannel.id,
				alerts_role_id: alertsRole.id,
			});
			for (const link of params.links) {
				await this.repository.upsertLiveState({
					guild_id: params.guildId,
					platform: link.platform,
					platform_channel_id: link.platform_channel_id,
					state: 'offline',
					session_started_at: null,
					last_seen_live_at: null,
					last_seen_offline_at: null,
					alert_message_id: null,
					alerted: false,
				});
			}
			await this.addGuildToAllowlist(params.guildId);
		} catch (error) {
			Logger.error(
				{err: error, guildId: params.guildId.toString()},
				'[StreamerGuildCreationService] Streamer setup incomplete; config left as needs_review',
			);
			try {
				await this.repository.upsertConfig(baseRow);
			} catch (configError) {
				Logger.error(
					{err: configError, guildId: params.guildId.toString()},
					'[StreamerGuildCreationService] Could not store the streamer config',
				);
			}
		}
	}

	private async addGuildToAllowlist(guildId: GuildID): Promise<void> {
		const config = await this.instanceConfigRepository.getStreamerModeConfig();
		const guildIdString = guildId.toString();
		if (config.included_guild_ids.includes(guildIdString)) return;
		if (config.included_guild_ids.length >= 1000) {
			Logger.warn(
				{guildId: guildIdString},
				'[StreamerGuildCreationService] Streamer guild allowlist is full; guild not added',
			);
			return;
		}
		await this.instanceConfigRepository.updateStreamerModeConfig({
			included_guild_ids: [...config.included_guild_ids, guildIdString],
		});
	}
}
