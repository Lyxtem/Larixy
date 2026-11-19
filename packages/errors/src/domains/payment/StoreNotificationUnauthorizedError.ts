// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {LarixyError} from '@larixy/errors/src/LarixyError';

export class StoreNotificationUnauthorizedError extends LarixyError {
	constructor() {
		super({
			code: APIErrorCodes.STORE_NOTIFICATION_UNAUTHORIZED,
			status: 401,
		});
	}
}
