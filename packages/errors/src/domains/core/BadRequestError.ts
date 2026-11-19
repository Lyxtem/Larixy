// SPDX-License-Identifier: AGPL-3.0-or-later

import {statusError} from '@larixy/errors/src/LarixyError';

export class BadRequestError extends statusError(400) {}
