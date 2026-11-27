// SPDX-License-Identifier: AGPL-3.0-or-later

import type {UserID} from '@app/api/BrandedTypes';

/**
 * One row per account that has been issued a premium gift campaign code.
 * The row doubles as the sent registry (sent_at) and the claim ledger
 * (claimed_at): an account can be sent at most one campaign gift ever and
 * can claim at most one, enforced in StripeGiftService.redeemGiftCode.
 */
export interface PremiumGiftCampaignEntryRow {
	user_id: UserID;
	code: string;
	sent_at: Date | null;
	claimed_at: Date | null;
	created_at: Date;
}

export const PREMIUM_GIFT_CAMPAIGN_ENTRY_COLUMNS = [
	'user_id',
	'code',
	'sent_at',
	'claimed_at',
	'created_at',
] as const satisfies ReadonlyArray<keyof PremiumGiftCampaignEntryRow>;

export interface PremiumGiftCampaignEntryByCodeRow {
	code: string;
	user_id: UserID;
}

export const PREMIUM_GIFT_CAMPAIGN_ENTRY_BY_CODE_COLUMNS = [
	'code',
	'user_id',
] as const satisfies ReadonlyArray<keyof PremiumGiftCampaignEntryByCodeRow>;
