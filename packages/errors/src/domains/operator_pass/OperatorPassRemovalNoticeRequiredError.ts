// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ConflictError} from '@larixy/errors/src/domains/core/ConflictError';

export class OperatorPassRemovalNoticeRequiredError extends ConflictError {
	constructor() {
		super({code: APIErrorCodes.OPERATOR_PASS_REMOVAL_NOTICE_REQUIRED});
	}
}
