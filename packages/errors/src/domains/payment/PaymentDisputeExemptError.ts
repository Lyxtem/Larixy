// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ConflictError} from '@larixy/errors/src/domains/core/ConflictError';

export class PaymentDisputeExemptError extends ConflictError {
	constructor(reasons: ReadonlyArray<string>) {
		super({code: APIErrorCodes.PAYMENT_DISPUTE_EXEMPT, data: {reasons: [...reasons]}});
	}
}
