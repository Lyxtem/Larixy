// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {ConflictError} from '@larixy/errors/src/domains/core/ConflictError';

export class SyncedPreferencesConflictError extends ConflictError {
	constructor() {
		super({
			code: APIErrorCodes.SYNCED_PREFERENCES_CONFLICT,
		});
	}
}
