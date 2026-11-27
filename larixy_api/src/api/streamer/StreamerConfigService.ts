// SPDX-License-Identifier: AGPL-3.0-or-later

import {createChannelID, type ChannelID, type GuildID, type UserID} from '@app/api/BrandedTypes';
import type {ChannelDataRepository} from '@app/api/channel/repositories/ChannelDataRepository';
import type {GuildStreamerConfigRow} from '@app/api/database/types/StreamerTypes';
import type {GuildDataHelpers} from '@app/api/guild/services/data/GuildDataHelpers';
import type {InstanceConfigRepository} from '@app/api/instance/InstanceConfigRepository';
import {StreamerConfigRepository} from '@app/api/streamer/StreamerConfigRepository';
import {Permissions} from '@larixy/constants/src/ChannelConstants';
import {ValidationErrorCodes} from '@larixy/constants/src/ValidationErrorCodes';
import {UnknownChannelError} from '@larixy/errors/src/domains/channel/UnknownChannelError';
import {InputValidationError} from '@larixy/errors/src/domains/core/InputValidationError';
import {UnknownGuildError} from '@larixy/errors/src/domains/guild/UnknownGuildError';
import {streamerModeGuildActive} from '@larixy/schema/src/domains/admin/StreamerModeSchemas';
import {
	StreamerConfigStatusSchema,
	StreamerPlatformSchema,
	type GuildStreamerConfigResponse,
	type GuildStreamerConfigUpdateRequest,
	type StreamerLink,
	type StreamerPlatform,
} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';

function toStreamerConfigResponse(row: GuildStreamerConfigRow): GuildStreamerConfigResponse {
	return {
		guild_id: row.guild_id.toString(),
		owner_user_id: row.owner_user_id.toString(),
		enabled: row.enabled,
		status: StreamerConfigStatusSchema.parse(row.status),
		alerts_channel_id: row.alerts_channel_id?.toString() ?? null,
		alerts_role_id: row.alerts_role_id?.toString() ?? null,
		mention_role: row.mention_role,
		links: row.links.map((link) => ({
			platform: StreamerPlatformSchema.parse(link.platform),
			url: link.url,
			platform_channel_id: link.platform_channel_id,
			platform_login: link.platform_login,
			display_name: link.display_name,
		})),
		created_at: row.created_at.toISOString(),
		updated_at: row.updated_at.toISOString(),
	};
}

export class StreamerConfigService {
	private readonly repository = new StreamerConfigRepository();

	constructor(
		private readonly instanceConfigRepository: InstanceConfigRepository,
		private readonly guildDataHelpers: GuildDataHelpers,
		private readonly channelDataRepository: ChannelDataRepository,
	) {}

	async getConfig(params: {userId: UserID; guildId: GuildID}): Promise<GuildStreamerConfigResponse> {
		const row = await this.getAuthorizedConfig(params);
		return toStreamerConfigResponse(row);
	}

	async updateConfig(params: {
		userId: UserID;
		guildId: GuildID;
		data: GuildStreamerConfigUpdateRequest;
	}): Promise<GuildStreamerConfigResponse> {
		const row = await this.getAuthorizedConfig(params);
		const {data} = params;
		const next: GuildStreamerConfigRow = {...row, links: [...row.links], updated_at: new Date()};
		if (data.alerts_channel_id !== undefined) {
			next.alerts_channel_id =
				data.alerts_channel_id === null
					? null
					: await this.assertGuildChannel(params.guildId, data.alerts_channel_id);
		}
		if (data.enabled !== undefined) next.enabled = data.enabled;
		if (data.mention_role !== undefined) next.mention_role = data.mention_role;
		await this.repository.upsertConfig(next);
		return toStreamerConfigResponse(next);
	}

	async addLink(params: {
		userId: UserID;
		guildId: GuildID;
		link: StreamerLink;
	}): Promise<GuildStreamerConfigResponse> {
		const row = await this.getAuthorizedConfig(params);
		if (row.links.some((existing) => existing.platform === params.link.platform)) {
			throw InputValidationError.fromCode('platform', ValidationErrorCodes.STREAMER_PLATFORM_ALREADY_LINKED);
		}
		const next: GuildStreamerConfigRow = {
			...row,
			links: [...row.links, {...params.link}],
			updated_at: new Date(),
		};
		await this.repository.upsertConfig(next);
		return toStreamerConfigResponse(next);
	}

	async removeLink(params: {userId: UserID; guildId: GuildID; platform: StreamerPlatform}): Promise<void> {
		const row = await this.getAuthorizedConfig(params);
		const removed = row.links.find((link) => link.platform === params.platform);
		if (!removed) return;
		const next: GuildStreamerConfigRow = {
			...row,
			links: row.links.filter((link) => link.platform !== params.platform),
			updated_at: new Date(),
		};
		await this.repository.upsertConfig(next);
		await this.repository.deleteLiveState(params.guildId, removed.platform, removed.platform_channel_id);
	}

	private async getAuthorizedConfig(params: {userId: UserID; guildId: GuildID}): Promise<GuildStreamerConfigRow> {
		await this.assertExperimentGuildActive(params.guildId);
		const {checkPermission} = await this.guildDataHelpers.getGuildAuthenticated(params);
		await checkPermission(Permissions.MANAGE_GUILD);
		const row = await this.repository.getConfig(params.guildId);
		if (!row) throw new UnknownGuildError();
		return row;
	}

	private async assertExperimentGuildActive(guildId: GuildID): Promise<void> {
		const config = await this.instanceConfigRepository.getStreamerModeConfig();
		if (!streamerModeGuildActive(config, guildId.toString())) {
			throw new UnknownGuildError();
		}
	}

	private async assertGuildChannel(guildId: GuildID, channelId: bigint): Promise<ChannelID> {
		const branded = createChannelID(channelId);
		const channel = await this.channelDataRepository.findUnique(branded);
		if (!channel || channel.guildId !== guildId) throw new UnknownChannelError();
		return branded;
	}
}
