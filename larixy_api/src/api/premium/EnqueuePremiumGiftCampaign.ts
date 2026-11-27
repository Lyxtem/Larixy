// SPDX-License-Identifier: AGPL-3.0-or-later

import type {UserID} from '@app/api/BrandedTypes';
import {Logger} from '@app/api/Logger';
import {getWorkerService} from '@app/api/middleware/ServiceRegistry';
import {getInstanceConfigRepository} from '@app/api/middleware/ServiceSingletons';

/**
 * Queues the campaign gift DM for a freshly registered account. Fire and
 * forget: registration must never fail because of the campaign, and the
 * worker task re-checks the campaign flag and eligibility before sending.
 */
export async function enqueuePremiumGiftCampaign(userId: UserID): Promise<void> {
	try {
		const config = await getInstanceConfigRepository().getPremiumGiftCampaignConfig();
		if (!config.enabled) return;
		await getWorkerService().addJob(
			'processPremiumGiftCampaignUser',
			{user_id: userId.toString()},
			{jobKey: `processPremiumGiftCampaignUser:${userId.toString()}`},
		);
	} catch (error) {
		Logger.warn({userId: userId.toString(), error}, 'Could not queue the premium gift campaign DM');
	}
}
