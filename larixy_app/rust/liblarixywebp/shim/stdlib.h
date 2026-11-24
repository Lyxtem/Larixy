// SPDX-License-Identifier: AGPL-3.0-or-later

#ifndef LARIXYWEBP_STDLIB_H
#define LARIXYWEBP_STDLIB_H
#include <stddef.h>
void* larixywebp_shim_malloc(size_t size);
void* larixywebp_shim_calloc(size_t nmemb, size_t size);
void larixywebp_shim_free(void* ptr);
void larixywebp_shim_qsort(void* base, size_t nitems, size_t size, int (*compar)(const void*, const void*));
#define malloc(size) larixywebp_shim_malloc(size)
#define calloc(nmemb, size) larixywebp_shim_calloc(nmemb, size)
#define free(ptr) larixywebp_shim_free(ptr)
#define qsort(base, nitems, size, compar) larixywebp_shim_qsort(base, nitems, size, compar)
#define abort() __builtin_trap()
static inline int abs(int x) { return x < 0 ? -x : x; }
#endif
