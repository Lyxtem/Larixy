// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {LarixyError} from '@larixy/errors/src/LarixyError';

export class StripeSubscriptionAlreadyCancelingError extends LarixyError {
	constructor() {
		super({
			code: APIErrorCodes.STRIPE_SUBSCRIPTION_ALREADY_CANCELING,
			status: 400,
		});
	}
}
