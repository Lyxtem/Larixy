// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ForbiddenError} from '@larixy/errors/src/domains/core/ForbiddenError';

export class FeatureNotAvailableSelfHostedError extends ForbiddenError {
	constructor() {
		super({
			code: APIErrorCodes.FEATURE_NOT_AVAILABLE_SELF_HOSTED,
		});
	}
}
