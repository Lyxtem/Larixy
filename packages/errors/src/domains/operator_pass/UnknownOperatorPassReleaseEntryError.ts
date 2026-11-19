// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {NotFoundError} from '@larixy/errors/src/domains/core/NotFoundError';

export class UnknownOperatorPassReleaseEntryError extends NotFoundError {
	constructor() {
		super({code: APIErrorCodes.UNKNOWN_OPERATOR_PASS_RELEASE_ENTRY});
	}
}
