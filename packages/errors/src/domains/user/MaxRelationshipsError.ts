// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class MaxRelationshipsError extends BadRequestError {
	constructor(limit: number) {
		super({
			code: APIErrorCodes.MAX_FRIENDS,
			messageVariables: {count: limit},
			data: {
				max_relationships: limit,
			},
		});
	}
}
