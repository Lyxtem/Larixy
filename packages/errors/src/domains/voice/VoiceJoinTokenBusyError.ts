// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ConflictError} from '@larixy/errors/src/domains/core/ConflictError';

export class VoiceJoinTokenBusyError extends ConflictError {
	constructor() {
		super({code: APIErrorCodes.VOICE_JOIN_TOKEN_BUSY});
	}
}
