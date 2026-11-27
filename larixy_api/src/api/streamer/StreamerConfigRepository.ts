// SPDX-License-Identifier: AGPL-3.0-or-later

import type {GuildID} from '@app/api/BrandedTypes';
import {deleteOneOrMany, fetchOne, upsertOne} from '@app/api/database/CassandraQueryExecution';
import type {GuildStreamerConfigRow} from '@app/api/database/types/StreamerTypes';
import {GuildStreamerConfigs, GuildStreamerLiveStates} from '@app/api/Tables';

const GET_CONFIG_CQL = GuildStreamerConfigs.selectCql({
	where: [GuildStreamerConfigs.where.eq('guild_id')],
	limit: 1,
});

export class StreamerConfigRepository {
	async getConfig(guildId: GuildID): Promise<GuildStreamerConfigRow | null> {
		return fetchOne<GuildStreamerConfigRow>(GET_CONFIG_CQL, {guild_id: guildId});
	}

	async upsertConfig(row: GuildStreamerConfigRow): Promise<void> {
		await upsertOne(GuildStreamerConfigs.insert(row));
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
