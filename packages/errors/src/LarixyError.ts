// SPDX-License-Identifier: AGPL-3.0-or-later

import type {APIErrorCode} from '@larixy/constants/src/ApiErrorCodes';
import type {ErrorResponse} from '@larixy/schema/src/domains/common/ErrorSchemas';
import {HTTPException} from 'hono/http-exception';

export type LarixyErrorData = Record<string, unknown>;
export type LarixyErrorStatus = HTTPException['status'];

interface LarixyErrorOptions {
	code: string;
	message?: string;
	status: LarixyErrorStatus;
	data?: LarixyErrorData;
	headers?: Record<string, string>;
	messageVariables?: Record<string, unknown>;
	cause?: Error;
}

export class LarixyError extends HTTPException {
	readonly code: string;
	override readonly message: string;
	override readonly status: LarixyErrorStatus;
	readonly data?: LarixyErrorData;
	readonly headers?: Record<string, string>;
	readonly messageVariables?: Record<string, unknown>;

	constructor(options: LarixyErrorOptions) {
		const resolvedMessage = options.message ?? options.code;
		super(options.status, {message: resolvedMessage, cause: options.cause});
		this.code = options.code;
		this.message = resolvedMessage;
		this.status = options.status;
		this.data = options.data;
		this.headers = options.headers;
		this.messageVariables = options.messageVariables;
		this.name = 'LarixyError';
	}

	override getResponse(): Response {
		return new Response(JSON.stringify(this.toJSON()), {
			status: this.status,
			headers: {
				'Content-Type': 'application/json',
				...this.headers,
			},
		});
	}

	toJSON(): ErrorResponse {
		return {
			code: this.code,
			message: this.message,
			...this.data,
		};
	}
}

type StatusErrorOptions = Omit<LarixyErrorOptions, 'status' | 'code'>;
type RequiredStatusErrorOptions<TAllowMessage extends boolean> = {code: APIErrorCode} & (TAllowMessage extends true
	? StatusErrorOptions
	: Omit<StatusErrorOptions, 'message'>);

export function statusError<TAllowMessage extends boolean = true>(
	status: LarixyErrorStatus,
	allowMessage: TAllowMessage = true as TAllowMessage,
) {
	return class extends LarixyError {
		constructor(options: RequiredStatusErrorOptions<TAllowMessage>) {
			const {message, ...rest} = options as StatusErrorOptions & {code: APIErrorCode};
			super({...rest, status, message: allowMessage ? message : undefined});
		}
	};
}

export function defaultCodeStatusError<TCode extends string = APIErrorCode>(
	status: LarixyErrorStatus,
	defaultCode: NoInfer<TCode>,
) {
	return class extends LarixyError {
		constructor({code = defaultCode, ...options}: StatusErrorOptions & {code?: TCode} = {}) {
			super({...options, code, status});
		}
	};
}
