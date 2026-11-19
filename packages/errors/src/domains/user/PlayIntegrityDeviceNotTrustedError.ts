// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class PlayIntegrityDeviceNotTrustedError extends BadRequestError {
	constructor() {
		super({code: APIErrorCodes.PLAY_INTEGRITY_DEVICE_NOT_TRUSTED});
	}
}
