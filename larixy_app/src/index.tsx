// SPDX-License-Identifier: AGPL-3.0-or-later

import '@app/app/BootShell.css';
import '@larixy/fonts/css/larixy-sans.css';
import '@larixy/fonts/css/larixy-mono.css';
import '@larixy/fonts/css/variables.css';
import '@larixy/fonts/css/locale-fallbacks.css';
import '@app/app/font-fallback.css';
import '@app/app/fonts/fallback/fallback-faces.css';
import '@app/app/globals.css';
import '@app/features/theme/styles/generated/color-system.css';
import '@app/features/theme/styles/generated/message-layout.css';
import '@app/features/theme/styles/preflight.css';

void import(/* webpackMode: "eager" */ '@app/indexMain');
