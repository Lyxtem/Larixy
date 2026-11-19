// SPDX-License-Identifier: AGPL-3.0-or-later

import {enableCompileCache} from 'node:module';

declare const __LARIXY_MAIN_BOOTSTRAP_OUTPUT_FILE__: string;

enableCompileCache();

await import(new URL(`./${__LARIXY_MAIN_BOOTSTRAP_OUTPUT_FILE__}`, import.meta.url).href);
