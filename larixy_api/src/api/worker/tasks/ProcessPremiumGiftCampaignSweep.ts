// SPDX-License-Identifier: AGPL-3.0-or-later

import {Logger} from '@app/api/Logger';
import {
	buildWorkerSystemDmDeps,
	ensurePremiumGiftDm,
	type PremiumGiftCampaignDeps,
	type PremiumGiftCampaignOutcome,
} from '@app/api/premium/PremiumGiftCampaign';
import {isPremiumTieringActive} from '@app/api/stripe/BillingConfigCache';
import {getWorkerDependencies} from '@app/api/worker/WorkerContext';
import type {WorkerTaskHandler} from '@pkgs/worker/src/contracts/WorkerTask';

const BATCH_SIZE = 100;

/**
 * Caps how many gift DMs one run may send. The sweep is resumable: accounts
 * already sent are skipped via the campaign ledger, so the next hourly run
 * continues where this one stopped.
 */
const MAX_SENDS_PER_RUN = 100;

type SweepOutcomes = Record<PremiumGiftCampaignOutcome, number>;

const processPremiumGiftCampaignSweep: WorkerTaskHandler = async (_payload, helpers) => {
	helpers.logger.debug('Processing premium gift campaign sweep task');
	if (!isPremiumTieringActive()) {
		helpers.logger.debug('Skipping premium gift campaign sweep because premium tiering is not active');
		return;
	}
	const deps = getWorkerDependencies();
	const config = await deps.instanceConfigRepository.getPremiumGiftCampaignConfig();
	if (!config.enabled) {
		helpers.logger.debug('Skipping premium gift campaign sweep because the campaign is disabled');
		return;
	}
	const campaignDeps: PremiumGiftCampaignDeps = {
		userRepository: deps.userRepository,
		instanceConfigRepository: deps.instanceConfigRepository,
		systemDm: buildWorkerSystemDmDeps(deps),
	};
	const outcomes: SweepOutcomes = {disabled: 0, ineligible: 0, already_sent: 0, sent: 0, dm_failed: 0};
	let processed = 0;
	let pageState: string | null = null;
	do {
		const page = await deps.userRepository.scanAllUsersPage(BATCH_SIZE, pageState);
		pageState = page.pageState;
		for (const user of page.users) {
			try {
				const outcome = await ensurePremiumGiftDm(campaignDeps, user);
				outcomes[outcome] += 1;
			} catch (error) {
				outcomes.dm_failed += 1;
				Logger.error({error, userId: user.id.toString()}, 'Failed to process user in premium gift campaign sweep');
			}
			processed += 1;
			if (outcomes.sent >= MAX_SENDS_PER_RUN) {
				break;
			}
		}
	} while (pageState && outcomes.sent < MAX_SENDS_PER_RUN);
	Logger.info({processed, outcomes}, 'Completed premium gift campaign sweep');
};

export default processPremiumGiftCampaignSweep;
