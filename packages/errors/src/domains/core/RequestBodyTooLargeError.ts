// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {statusError} from '@larixy/errors/src/LarixyError';

export class RequestBodyTooLargeError extends statusError(413) {
	constructor(maxSize: number) {
		super({code: APIErrorCodes.FILE_SIZE_TOO_LARGE, messageVariables: {maxSize}});
	}
}
