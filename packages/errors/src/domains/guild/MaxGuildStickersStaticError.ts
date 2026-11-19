// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class MaxGuildStickersStaticError extends BadRequestError {
	constructor(maxStickers: number) {
		super({
			code: APIErrorCodes.MAX_STICKERS,
			messageVariables: {count: maxStickers},
		});
	}
}
