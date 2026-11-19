// SPDX-License-Identifier: AGPL-3.0-or-later

import {statusError} from '@larixy/errors/src/LarixyError';

export class LockedError extends statusError(423, false) {}
