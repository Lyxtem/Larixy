// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {LarixyError} from '@larixy/errors/src/LarixyError';

export class StripeWebhookNotAvailableError extends LarixyError {
	constructor() {
		super({
			code: APIErrorCodes.STRIPE_WEBHOOK_NOT_AVAILABLE,
			status: 400,
		});
	}
}
