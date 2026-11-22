// SPDX-License-Identifier: AGPL-3.0-or-later

export const NATIVE_TITLEBAR_CONTROL_ATTR = 'data-window-control';

export type NativeTitlebarControlName = 'minimize' | 'maximize' | 'close';
export type NativeTitlebarLayout = 'macos' | 'controls';

export const NATIVE_TITLEBAR_CLASS = {
	root: 'larixy-native-titlebar',
	left: 'larixy-native-titlebar__left',
	wordmark: 'larixy-native-titlebar__wordmark',
	spacer: 'larixy-native-titlebar__spacer',
	action: 'larixy-native-titlebar__action',
	controls: 'larixy-native-titlebar__controls',
	control: 'larixy-native-titlebar__control',
	controlClose: 'larixy-native-titlebar__control--close',
} as const;

const NATIVE_TITLEBAR_DEFAULT_PRODUCT_NAME = 'Larixy';

const NATIVE_TITLEBAR_WORDMARK_VIEWBOX = '0 0 1382 512';

const NATIVE_TITLEBAR_WORDMARK_PATHS: ReadonlyArray<string> = [
	'M40.36 405.0V62.30000000000001H111.66000000000001V342.9H256.56V405.0Z M364.66 410.52Q337.52 410.52 317.74 401.78Q297.96000000000004 393.04 287.38 376.71000000000004Q276.8 360.38 276.8 337.84000000000003Q276.8 316.68 286.46000000000004 300.35Q296.12 284.02 316.13 272.98Q336.14 261.94 366.04 257.34000000000003L442.86 244.92V295.52L378.46000000000004 307.02Q363.74 309.78 355.92 316.45Q348.1 323.12 348.1 335.53999999999996Q348.1 347.04 356.84000000000003 353.48Q365.58000000000004 359.92 378.46000000000004 359.92Q395.48 359.92 408.36 352.56Q421.24 345.2 428.37 332.54999999999995Q435.5 319.9 435.5 304.72V239.4Q435.5 225.14 424.23 215.48Q412.96000000000004 205.82 393.64 205.82Q375.24 205.82 361.21000000000004 215.94Q347.18 226.06 340.74 242.62L285.54 216.4Q292.9 195.23999999999998 309.0 180.06Q325.1 164.88 347.64 156.6Q370.18 148.32 396.86 148.32Q428.6 148.32 452.98 159.82Q477.36 171.32 490.93 191.79Q504.5 212.26 504.5 239.4V405.0H440.1V364.52L455.74 361.76Q444.70000000000005 378.32 431.36 389.13Q418.02 399.94 401.46 405.23Q384.9 410.52 364.66 410.52Z M555.0999999999999 405.0V153.83999999999997H619.5V214.1L614.9 205.35999999999999Q623.18 173.61999999999998 642.27 162.34999999999997Q661.3599999999999 151.07999999999998 687.5799999999999 151.07999999999998H702.3V210.88H680.68Q655.38 210.88 639.74 226.29Q624.0999999999999 241.7 624.0999999999999 269.76V405.0Z M732.6599999999999 405.0V153.83999999999997H801.6599999999999V405.0ZM732.6599999999999 131.3V62.30000000000001H801.6599999999999V131.3Z M832.4799999999999 405.0 920.3399999999999 278.96 832.0199999999999 153.83999999999997H912.06L978.3 251.35999999999999H943.3399999999999L1009.5799999999999 153.83999999999997H1089.62L1001.3 278.96L1088.6999999999998 405.0H1009.1199999999999L944.26 307.48H977.3799999999999L912.52 405.0Z M1159.08 506.2Q1148.0399999999997 506.2 1137.6899999999998 504.36Q1127.34 502.52 1119.5199999999998 498.38V441.8Q1125.9599999999998 443.64 1134.6999999999998 445.02Q1143.4399999999998 446.4 1150.7999999999997 446.4Q1171.0399999999997 446.4 1179.7799999999997 436.97Q1188.5199999999998 427.54 1194.0399999999997 415.58L1211.06 376.48L1210.1399999999999 433.98L1099.7399999999998 153.83999999999997H1173.7999999999997L1246.9399999999998 353.02H1219.34L1292.4799999999998 153.83999999999997H1366.54L1258.8999999999999 428.46Q1248.7799999999997 454.22 1234.06 471.70000000000005Q1219.34 489.18 1200.71 497.69Q1182.08 506.2 1159.08 506.2Z',
];

export const NATIVE_TITLEBAR_CONTROL_ICON_PATH = {
	minimize: 'M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128Z',
	maximize:
		'M208,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28Zm-4,176H52V52H204Z',
	restore:
		'M180,64H40A12,12,0,0,0,28,76V216a12,12,0,0,0,12,12H180a12,12,0,0,0,12-12V76A12,12,0,0,0,180,64ZM168,204H52V88H168ZM228,40V180a12,12,0,0,1-24,0V52H76a12,12,0,0,1,0-24H216A12,12,0,0,1,228,40Z',
	close:
		'M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z',
} as const;

export type NativeTitlebarControlIconName = keyof typeof NATIVE_TITLEBAR_CONTROL_ICON_PATH;

function nativeTitlebarControlIconSvg(icon: NativeTitlebarControlIconName): string {
	return (
		'<svg viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
		`<path d="${NATIVE_TITLEBAR_CONTROL_ICON_PATH[icon]}"/></svg>`
	);
}

function nativeTitlebarWordmarkSvg(className: string = NATIVE_TITLEBAR_CLASS.wordmark): string {
	const paths = NATIVE_TITLEBAR_WORDMARK_PATHS.map((d) => `<path fill="currentColor" d="${d}"/>`).join('');
	return (
		`<svg class="${className}" role="img" aria-label="${NATIVE_TITLEBAR_DEFAULT_PRODUCT_NAME}" xmlns="http://www.w3.org/2000/svg" ` +
		`style="height:13px;width:auto;max-height:13px;display:inline-block;vertical-align:middle;" ` +
		`fill="none" viewBox="${NATIVE_TITLEBAR_WORDMARK_VIEWBOX}">${paths}</svg>`
	);
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function nativeTitlebarProductNameHtml(productName: string): string {
	const name = escapeHtml(productName);
	return (
		`<span class="${NATIVE_TITLEBAR_CLASS.wordmark}" role="img" dir="auto" aria-label="${name}" ` +
		`style="align-items:center;display:inline-flex;font-weight:800;line-height:1">${name}</span>`
	);
}

interface StartupControlLabels {
	readonly minimize: string;
	readonly maximize: string;
	readonly close: string;
}

const DEFAULT_STARTUP_CONTROL_LABELS: StartupControlLabels = {
	minimize: 'Minimize window',
	maximize: 'Maximize window',
	close: 'Close window',
};

function controlButtonHtml(
	name: NativeTitlebarControlName,
	icon: NativeTitlebarControlIconName,
	label: string,
	extraClass?: string,
): string {
	const className = extraClass ? `${NATIVE_TITLEBAR_CLASS.control} ${extraClass}` : NATIVE_TITLEBAR_CLASS.control;
	return (
		`<button type="button" tabindex="-1" class="${className}" ${NATIVE_TITLEBAR_CONTROL_ATTR}="${name}" ` +
		`aria-label="${label}">${nativeTitlebarControlIconSvg(icon)}</button>`
	);
}

function nativeTitlebarControlsHtml(labels: StartupControlLabels = DEFAULT_STARTUP_CONTROL_LABELS): string {
	return (
		`<div class="${NATIVE_TITLEBAR_CLASS.controls}">` +
		controlButtonHtml('minimize', 'minimize', labels.minimize) +
		controlButtonHtml('maximize', 'maximize', labels.maximize) +
		controlButtonHtml('close', 'close', labels.close, NATIVE_TITLEBAR_CLASS.controlClose) +
		'</div>'
	);
}

export function buildNativeTitlebarStartupHtml(
	layout: NativeTitlebarLayout,
	productName: string | null = null,
): string {
	const mark =
		productName === null || productName === NATIVE_TITLEBAR_DEFAULT_PRODUCT_NAME
			? nativeTitlebarWordmarkSvg()
			: nativeTitlebarProductNameHtml(productName);
	const brand = `<div class="${NATIVE_TITLEBAR_CLASS.left}">${mark}</div>`;
	const spacer = `<div class="${NATIVE_TITLEBAR_CLASS.spacer}"></div>`;
	if (layout === 'macos') {
		return `${spacer}${brand}`;
	}
	return `${brand}${spacer}${nativeTitlebarControlsHtml()}`;
}
