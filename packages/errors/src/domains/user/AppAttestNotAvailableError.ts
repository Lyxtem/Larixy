// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {NotFoundError} from '@larixy/errors/src/domains/core/NotFoundError';

export class AppAttestNotAvailableError extends NotFoundError {
	constructor() {
		super({code: APIErrorCodes.APP_ATTEST_NOT_AVAILABLE});
	}
}
