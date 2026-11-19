// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {NotFoundError} from '@larixy/errors/src/domains/core/NotFoundError';

export class UnknownVoiceRegionError extends NotFoundError {
	constructor() {
		super({code: APIErrorCodes.UNKNOWN_VOICE_REGION});
	}
}
