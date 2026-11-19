// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {LarixyError} from '@larixy/errors/src/LarixyError';

export class StripeError extends LarixyError {
	constructor(detail?: string) {
		super({
			code: APIErrorCodes.STRIPE_ERROR,
			status: 400,
			data: detail ? {detail} : undefined,
			messageVariables: detail ? {detail} : undefined,
		});
	}
}
