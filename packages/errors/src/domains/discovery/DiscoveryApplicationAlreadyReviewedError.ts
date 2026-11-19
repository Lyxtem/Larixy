// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ConflictError} from '@larixy/errors/src/domains/core/ConflictError';

export class DiscoveryApplicationAlreadyReviewedError extends ConflictError {
	constructor() {
		super({
			code: APIErrorCodes.DISCOVERY_APPLICATION_ALREADY_REVIEWED,
		});
	}
}
