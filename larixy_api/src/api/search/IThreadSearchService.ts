// SPDX-License-Identifier: AGPL-3.0-or-later

import type {ISearchAdapter} from '@larixy/schema/src/contracts/search/SearchAdapterTypes';
import type {SearchableThread, ThreadSearchFilters} from '@larixy/schema/src/contracts/search/SearchDocumentTypes';

export interface IThreadSearchService extends ISearchAdapter<ThreadSearchFilters, SearchableThread> {
	ready(): Promise<void>;
}
