// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ForbiddenError} from '@larixy/errors/src/domains/core/ForbiddenError';
import type {EnforcementNotice} from '@larixy/schema/src/domains/auth/EnforcementNoticeSchemas';

export class AccountTemporarilySuspendedError extends ForbiddenError {
	constructor(notice: EnforcementNotice) {
		super({code: APIErrorCodes.ACCOUNT_SUSPENDED_TEMPORARILY, data: {notice}});
	}
}
