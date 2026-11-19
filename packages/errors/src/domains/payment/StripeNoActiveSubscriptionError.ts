// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {LarixyError} from '@larixy/errors/src/LarixyError';

export class StripeNoActiveSubscriptionError extends LarixyError {
	constructor() {
		super({
			code: APIErrorCodes.STRIPE_NO_ACTIVE_SUBSCRIPTION,
			status: 400,
		});
	}
}
