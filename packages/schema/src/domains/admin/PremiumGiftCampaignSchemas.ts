// SPDX-License-Identifier: AGPL-3.0-or-later

import {z} from 'zod';

const premiumGiftCampaignConfigFields = {
	enabled: z
		.boolean()
		.describe(
			'Master switch for the premium gift campaign: when on, the system account DMs every non-Premium user (and every new registration) a bound gift link worth 3 months of Premium',
		),
};

export const PremiumGiftCampaignConfigSchema = z.object({
	enabled: premiumGiftCampaignConfigFields.enabled.default(false),
});

export type PremiumGiftCampaignConfig = z.infer<typeof PremiumGiftCampaignConfigSchema>;

export const PremiumGiftCampaignConfigResponse = PremiumGiftCampaignConfigSchema;

export const PremiumGiftCampaignConfigUpdateRequest = z.object(premiumGiftCampaignConfigFields).partial();

export type PremiumGiftCampaignConfigUpdateRequest = z.infer<typeof PremiumGiftCampaignConfigUpdateRequest>;
