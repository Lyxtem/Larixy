// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {BadRequestError} from '@larixy/errors/src/domains/core/BadRequestError';
import type {LarixyErrorData} from '@larixy/errors/src/LarixyError';

export class CaptchaRequiredError extends BadRequestError {
	constructor(data?: LarixyErrorData) {
		super({code: APIErrorCodes.CAPTCHA_REQUIRED, data});
		this.name = 'CaptchaRequiredError';
	}
}

export class InvalidCaptchaError extends BadRequestError {
	constructor(data?: LarixyErrorData) {
		super({code: APIErrorCodes.INVALID_CAPTCHA, data});
		this.name = 'InvalidCaptchaError';
	}
}
