// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {LarixyError} from '@larixy/errors/src/LarixyError';

export class StripeBillingCycleChangeNeedsResubscribeError extends LarixyError {
	constructor() {
		super({
			code: APIErrorCodes.STRIPE_BILLING_CYCLE_CHANGE_NEEDS_RESUBSCRIBE,
			status: 400,
		});
	}
}
