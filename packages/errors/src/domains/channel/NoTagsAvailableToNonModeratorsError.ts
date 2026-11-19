// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class NoTagsAvailableToNonModeratorsError extends BadRequestError {
	constructor() {
		super({
			code: APIErrorCodes.NO_TAGS_AVAILABLE_TO_NON_MODERATORS,
		});
	}
}
