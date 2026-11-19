// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {InternalServerError} from '@larixy/errors/src/domains/core/InternalServerError';

export class UpdateFailedError extends InternalServerError {
	constructor(detail?: string) {
		super({
			code: APIErrorCodes.UPDATE_FAILED,
			messageVariables: detail ? {detail} : undefined,
		});
	}
}
