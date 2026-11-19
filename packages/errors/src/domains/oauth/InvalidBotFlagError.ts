// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class InvalidBotFlagError extends BadRequestError {
	constructor() {
		super({code: APIErrorCodes.INVALID_BOT_FLAG});
	}
}
