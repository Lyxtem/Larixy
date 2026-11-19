// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class CannotSendMessagesToUserError extends BadRequestError {
	constructor() {
		super({code: APIErrorCodes.CANNOT_SEND_MESSAGES_TO_USER});
	}
}
