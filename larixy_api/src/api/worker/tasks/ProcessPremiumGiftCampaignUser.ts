// SPDX-License-Identifier: AGPL-3.0-or-later

import {createUserID} from '@app/api/BrandedTypes';
import {Logger} from '@app/api/Logger';
import {buildWorkerSystemDmDeps, ensurePremiumGiftDm} from '@app/api/premium/PremiumGiftCampaign';
import {getWorkerDependencies} from '@app/api/worker/WorkerContext';
import type {WorkerTaskHandler} from '@pkgs/worker/src/contracts/WorkerTask';
import {z} from 'zod';

const PayloadSchema = z.object({user_id: z.string().regex(/^\d+$/u)});

const processPremiumGiftCampaignUser: WorkerTaskHandler = async (payload, helpers) => {
	const {user_id: userIdRaw} = PayloadSchema.parse(payload);
	const deps = getWorkerDependencies();
	const user = await deps.userRepository.findUnique(createUserID(BigInt(userIdRaw)));
	if (!user) {
		helpers.logger.warn({userId: userIdRaw}, 'Premium gift campaign user task for unknown user');
		return;
	}
	const outcome = await ensurePremiumGiftDm(
		{
			userRepository: deps.userRepository,
			instanceConfigRepository: deps.instanceConfigRepository,
			systemDm: buildWorkerSystemDmDeps(deps),
		},
		user,
	);
	Logger.debug({userId: userIdRaw, outcome}, 'Processed premium gift campaign user task');
};

export default processPremiumGiftCampaignUser;
