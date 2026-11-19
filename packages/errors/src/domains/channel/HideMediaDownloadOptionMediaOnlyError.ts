// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';

export class HideMediaDownloadOptionMediaOnlyError extends BadRequestError {
	constructor() {
		super({
			code: APIErrorCodes.HIDE_MEDIA_DOWNLOAD_OPTION_MEDIA_ONLY,
		});
	}
}
