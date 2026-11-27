// SPDX-License-Identifier: AGPL-3.0-or-later

import type {GuildID} from '@app/api/BrandedTypes';
import {
	deleteOneOrMany,
	fetchOne,
	fetchPage,
	upsertOne,
	type PagedQueryResult,
} from '@app/api/database/CassandraQueryExecution';
import type {GuildStreamerConfigRow, GuildStreamerLiveStateRow} from '@app/api/database/types/StreamerTypes';
import {GuildStreamerConfigs, GuildStreamerLiveStates} from '@app/api/Tables';

const GET_CONFIG_CQL = GuildStreamerConfigs.selectCql({
	where: [GuildStreamerConfigs.where.eq('guild_id')],
	limit: 1,
});

const LIST_CONFIGS_CQL = GuildStreamerConfigs.selectCql();

const GET_LIVE_STATE_CQL = GuildStreamerLiveStates.selectCql({
	where: [
		GuildStreamerLiveStates.where.eq('guild_id'),
		GuildStreamerLiveStates.where.eq('platform'),
		GuildStreamerLiveStates.where.eq('platform_channel_id'),
	],
	limit: 1,
});

export class StreamerConfigRepository {
	async getConfig(guildId: GuildID): Promise<GuildStreamerConfigRow | null> {
		return fetchOne<GuildStreamerConfigRow>(GET_CONFIG_CQL, {guild_id: guildId});
	}

	async listConfigsPage(
		pageSize: number,
		pageState?: string | null,
	): Promise<PagedQueryResult<GuildStreamerConfigRow>> {
		return fetchPage<GuildStreamerConfigRow>(LIST_CONFIGS_CQL, undefined, {pageSize, pageState});
	}

	async upsertConfig(row: GuildStreamerConfigRow): Promise<void> {
		await upsertOne(GuildStreamerConfigs.insert(row));
	}

	async getLiveState(
		guildId: GuildID,
		platform: string,
		platformChannelId: string,
	): Promise<GuildStreamerLiveStateRow | null> {
		return fetchOne<GuildStreamerLiveStateRow>(GET_LIVE_STATE_CQL, {
			guild_id: guildId,
			platform: platform,
			platform_channel_id: platformChannelId,
		});
	}

	async upsertLiveState(row: GuildStreamerLiveStateRow): Promise<void> {
		await upsertOne(GuildStreamerLiveStates.insert(row));
	}

	async deleteLiveState(guildId: GuildID, platform: string, platformChannelId: string): Promise<void> {
		await deleteOneOrMany(
			GuildStreamerLiveStates.deleteByPk({
				guild_id: guildId,
				platform: platform,
				platform_channel_id: platformChannelId,
			}),
		);
	}
}
