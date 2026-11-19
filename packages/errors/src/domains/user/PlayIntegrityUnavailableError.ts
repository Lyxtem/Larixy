// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ServiceUnavailableError} from '@larixy/errors/src/domains/core/ServiceUnavailableError';

export class PlayIntegrityUnavailableError extends ServiceUnavailableError {
	constructor() {
		super({code: APIErrorCodes.PLAY_INTEGRITY_UNAVAILABLE});
	}
}
