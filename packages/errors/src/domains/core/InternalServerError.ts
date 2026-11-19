// SPDX-License-Identifier: AGPL-3.0-or-later

import {statusError} from '@larixy/errors/src/LarixyError';

export class InternalServerError extends statusError(500, false) {}
