// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class CannotTransferOwnershipToBotError extends BadRequestError {
	constructor() {
		super({
			code: APIErrorCodes.CANNOT_TRANSFER_OWNERSHIP_TO_BOT,
		});
	}
}
