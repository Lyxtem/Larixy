// SPDX-License-Identifier: AGPL-3.0-or-later

import type {
	AccountVerificationNeed,
	RestrictedAccountTier,
	TierGatedAction,
} from '@larixy/constants/src/AccountTierConstants';
import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ForbiddenError} from '@larixy/errors/src/domains/core/ForbiddenError';

export class AccountVerificationRequiredError extends ForbiddenError {
	constructor(action: TierGatedAction, tier: RestrictedAccountTier, need: AccountVerificationNeed) {
		super({
			code: APIErrorCodes.ACCOUNT_VERIFICATION_REQUIRED,
			data: {action, tier, need},
			messageVariables: {action, need},
		});
	}
}
