// SPDX-License-Identifier: AGPL-3.0-or-later

import {Logger} from '@app/features/platform/utils/AppLogger';
import type {InitOutput} from '@pkgs/liblarixycore/liblarixycore';
import initLiblarixycore, * as wasm from '@pkgs/liblarixycore/liblarixycore';
import liblarixycoreWasmUrl from '@pkgs/liblarixycore/liblarixycore_bg.wasm';

const logger = new Logger('liblarixycore');
const MAX_RETAINED_LIBLARIXYCORE_WASM_MEMORY_BYTES = 64 * 1024 * 1024;

let modulePromise: Promise<void> | null = null;
let moduleReady = false;
let moduleExports: InitOutput | null = null;
let pendingModuleOperations = 0;
const liveZstdStreamDecoders = new Set<number>();
const liveZstdStreamEncoders = new Set<number>();

async function loadModule(): Promise<void> {
	if (!modulePromise) {
		modulePromise = (async () => {
			try {
				if (typeof initLiblarixycore === 'function') {
					moduleExports = await initLiblarixycore({module_or_path: liblarixycoreWasmUrl});
				}
				moduleReady = true;
			} catch (err) {
				moduleExports = null;
				moduleReady = false;
				modulePromise = null;
				logger.warn('Failed to load wasm module', err);
				throw err;
			}
		})();
	}
	await modulePromise;
}

function isLiblarixycoreModulePinned(): boolean {
	return pendingModuleOperations > 0 || liveZstdStreamDecoders.size > 0 || liveZstdStreamEncoders.size > 0;
}

async function withPinnedLiblarixycoreModule<T>(run: () => T): Promise<T> {
	pendingModuleOperations++;
	try {
		await loadModule();
		return run();
	} finally {
		pendingModuleOperations--;
		releaseLiblarixycoreMemoryIfIdle();
	}
}

function requireLiveZstdStreamHandle(handle: number, live: Set<number>): number {
	if (!live.has(handle)) {
		throw new Error('liblarixycore zstd stream handle is no longer live');
	}
	return handle;
}

export function isLiblarixycoreReady(): boolean {
	return moduleReady;
}

export async function ensureLiblarixycoreReady(): Promise<void> {
	await loadModule();
}

function releaseLiblarixycoreMemoryIfIdle(): void {
	if (isLiblarixycoreModulePinned()) return;
	if ((moduleExports?.memory.buffer.byteLength ?? 0) <= MAX_RETAINED_LIBLARIXYCORE_WASM_MEMORY_BYTES) return;
	wasm.__resetLiblarixycoreWasmForMemoryPressure();
	modulePromise = null;
	moduleReady = false;
	moduleExports = null;
}

export async function detectAnimatedImage(data: Uint8Array): Promise<boolean> {
	return withPinnedLiblarixycoreModule(() => Boolean(wasm.is_animated_image(data)));
}

export async function sniffImageFormat(data: Uint8Array): Promise<number> {
	return withPinnedLiblarixycoreModule(() => wasm.sniff_image_format(data));
}

export async function createZstdStreamDecoder(): Promise<number> {
	return withPinnedLiblarixycoreModule(() => {
		const decoder = wasm.create_zstd_stream_decoder();
		liveZstdStreamDecoders.add(decoder);
		return decoder;
	});
}

export async function decompressZstdStreamChunk(decoder: number, input: Uint8Array): Promise<Uint8Array> {
	return withPinnedLiblarixycoreModule(() => {
		const result = wasm.decompress_zstd_stream_chunk(
			requireLiveZstdStreamHandle(decoder, liveZstdStreamDecoders),
			input,
		);
		return result instanceof Uint8Array ? result : new Uint8Array(result);
	});
}

export function freeZstdStreamDecoder(decoder: number): void {
	if (!liveZstdStreamDecoders.delete(decoder)) return;
	try {
		wasm.free_zstd_stream_decoder(decoder);
	} finally {
		releaseLiblarixycoreMemoryIfIdle();
	}
}

export function createZstdStreamEncoderSync(level: number): number {
	const encoder = wasm.create_zstd_stream_encoder(level);
	liveZstdStreamEncoders.add(encoder);
	return encoder;
}

export function compressZstdStreamChunk(encoder: number, input: Uint8Array): Uint8Array {
	const result = wasm.compress_zstd_stream_chunk(requireLiveZstdStreamHandle(encoder, liveZstdStreamEncoders), input);
	return result instanceof Uint8Array ? result : new Uint8Array(result);
}

export function freeZstdStreamEncoder(encoder: number): void {
	if (!liveZstdStreamEncoders.delete(encoder)) return;
	try {
		wasm.free_zstd_stream_encoder(encoder);
	} finally {
		releaseLiblarixycoreMemoryIfIdle();
	}
}
