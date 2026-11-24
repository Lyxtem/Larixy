// SPDX-License-Identifier: AGPL-3.0-or-later

import type {FunctionComponent, SVGProps} from 'react';

declare module '*.css' {}

declare module '*.svg' {
	const url: string;
	export default url;
}

declare module '*.svg?react' {
	const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
	export default ReactComponent;
}

declare module '*.png' {
	const url: string;
	export default url;
}

declare module '@pkgs/liblarixycore/liblarixycore_bg.wasm' {
	const url: string;
	export default url;
}

declare module '@pkgs/liblarixywebp/liblarixywebp_bg.wasm' {
	const url: string;
	export default url;
}

declare module '@pkgs/liblarixywebp/liblarixywebp_simd_bg.wasm' {
	const url: string;
	export default url;
}

declare module '*.onnx' {
	const url: string;
	export default url;
}
