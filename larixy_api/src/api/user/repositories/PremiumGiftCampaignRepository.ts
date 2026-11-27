// SPDX-License-Identifier: AGPL-3.0-or-later

import type {UserID} from '@app/api/BrandedTypes';
import {BatchBuilder, fetchOne, upsertOne} from '@app/api/database/CassandraQueryExecution';
import {Db} from '@app/api/database/CassandraTypes';
import type {PremiumGiftCampaignEntryRow} from '@app/api/database/types/PremiumGiftCampaignTypes';
import {PremiumGiftCampaignEntries, PremiumGiftCampaignEntriesByCode} from '@app/api/Tables';

const FETCH_ENTRY_BY_USER_QUERY = PremiumGiftCampaignEntries.selectCql({
	where: PremiumGiftCampaignEntries.where.eq('user_id'),
	limit: 1,
});

const FETCH_ENTRY_USER_BY_CODE_QUERY = PremiumGiftCampaignEntriesByCode.selectCql({
	columns: ['user_id'],
	where: PremiumGiftCampaignEntriesByCode.where.eq('code'),
	limit: 1,
});

export class PremiumGiftCampaignRepository {
	async findEntryByUser(userId: UserID): Promise<PremiumGiftCampaignEntryRow | null> {
		return fetchOne<PremiumGiftCampaignEntryRow>(FETCH_ENTRY_BY_USER_QUERY, {user_id: userId});
	}

	async findEntryByCode(code: string): Promise<PremiumGiftCampaignEntryRow | null> {
		const link = await fetchOne<{user_id: UserID}>(FETCH_ENTRY_USER_BY_CODE_QUERY, {code});
		if (!link) {
			return null;
		}
		return this.findEntryByUser(link.user_id);
	}

	async createEntry(row: PremiumGiftCampaignEntryRow): Promise<void> {
		const batch = new BatchBuilder();
		batch.addPrepared(PremiumGiftCampaignEntries.insert(row));
		batch.addPrepared(
			PremiumGiftCampaignEntriesByCode.upsertAll({
				code: row.code,
				user_id: row.user_id,
			}),
		);
		await batch.execute();
	}

	async markSent(userId: UserID): Promise<void> {
		await upsertOne(
			PremiumGiftCampaignEntries.patchByPk({user_id: userId}, {sent_at: Db.set(new Date())}),
		);
	}

	async markClaimed(userId: UserID): Promise<void> {
		await upsertOne(
			PremiumGiftCampaignEntries.patchByPk({user_id: userId}, {claimed_at: Db.set(new Date())}),
		);
	}
}
