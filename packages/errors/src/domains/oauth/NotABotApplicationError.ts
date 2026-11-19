// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class NotABotApplicationError extends BadRequestError {
	constructor(messageVariables?: Record<string, unknown>) {
		super({
			code: APIErrorCodes.NOT_A_BOT_APPLICATION,
			messageVariables,
		});
	}
}
