// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class MaxGuildInvitesError extends BadRequestError {
	constructor(limit: number) {
		super({
			code: APIErrorCodes.MAX_INVITES,
			messageVariables: {count: limit},
			data: {
				max_guild_invites: limit,
			},
		});
	}
}
