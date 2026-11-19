// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class CannotRedeemPlutoniumWithVisionaryError extends BadRequestError {
	constructor(premiumTierName = 'Plutonium') {
		super({
			code: APIErrorCodes.CANNOT_REDEEM_PLUTONIUM_WITH_VISIONARY,
			messageVariables: {premium_tier_name: premiumTierName},
		});
	}
}
