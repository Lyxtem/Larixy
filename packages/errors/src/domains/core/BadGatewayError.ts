// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {defaultCodeStatusError} from '@larixy/errors/src/LarixyError';

export class BadGatewayError extends defaultCodeStatusError(502, APIErrorCodes.BAD_GATEWAY) {}
