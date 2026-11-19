// SPDX-License-Identifier: AGPL-3.0-or-later

import {APIErrorCodes} from '@larixy/constants/src/ApiErrorCodes';
import {defaultCodeStatusError} from '@larixy/errors/src/LarixyError';

export class SsoProviderUnavailableError extends defaultCodeStatusError(503, APIErrorCodes.SSO_PROVIDER_UNAVAILABLE) {}
