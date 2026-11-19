// SPDX-License-Identifier: AGPL-3.0-or-later

import {createLogger, type Logger as LarixyLogger} from '@larixy/logger/src/Logger';

export const Logger = createLogger('larixy-api');

export type Logger = LarixyLogger;
