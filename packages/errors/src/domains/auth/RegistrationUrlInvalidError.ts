// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class RegistrationUrlInvalidError extends BadRequestError {
	constructor() {
		super({code: APIErrorCodes.REGISTRATION_URL_INVALID});
		this.name = 'RegistrationUrlInvalidError';
	}
}
