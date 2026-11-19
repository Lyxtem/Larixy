// SPDX-License-Identifier: AGPL-3.0-or-later

import type {ValidationErrorCode} from '@larixy/constants/src/ValidationErrorCodes';
import type {ValidationErrorItem} from '@larixy/schema/src/domains/common/ErrorSchemas';

export interface ValidationError extends ValidationErrorItem {
	code?: ValidationErrorCode;
}
