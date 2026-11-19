// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class MaxGuildMembersError extends BadRequestError {
	constructor(maxMembers: number) {
		super({
			code: APIErrorCodes.MAX_GUILD_MEMBERS,
			messageVariables: {count: maxMembers},
		});
	}
}
