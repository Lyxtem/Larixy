// SPDX-License-Identifier: AGPL-3.0-or-later

import {
	desktopExecRunsPath,
	isAppImageIntegratorEntry,
	isWindowDesktopEntry,
	readDesktopEntryValue,
	setDesktopEntryValue,
} from '@electron/main/DesktopEntryText';
import {describe, expect, it} from 'vitest';

const STABLE_CLASSES = ['app.larixy.LarixyDesktop', 'larixy'];

function entry(...lines: Array<string>): string {
	return ['[Desktop Entry]', 'Type=Application', 'Name=Larixy', ...lines, ''].join('\n');
}

describe('readDesktopEntryValue', () => {
	it('reads keys written with spaces around the equals sign', () => {
		expect(readDesktopEntryValue(entry('StartupWMClass = larixy'), 'StartupWMClass')).toBe('larixy');
	});

	it('ignores localized keys and keys in other groups', () => {
		const contents = [
			'[Desktop Entry]',
			'Name[de]=Larixy DE',
			'Name=Larixy',
			'',
			'[Desktop Action new-dm]',
			'Exec=/opt/other %U',
		].join('\n');
		expect(readDesktopEntryValue(contents, 'Name')).toBe('Larixy');
		expect(readDesktopEntryValue(contents, 'Exec')).toBeNull();
	});
});

describe('setDesktopEntryValue', () => {
	it('replaces a spaced key in place without adding a duplicate', () => {
		const updated = setDesktopEntryValue(
			entry('StartupWMClass = larixy'),
			'StartupWMClass',
			'app.larixy.LarixyDesktop',
		);
		expect(updated.match(/StartupWMClass/g)).toHaveLength(1);
		expect(readDesktopEntryValue(updated, 'StartupWMClass')).toBe('app.larixy.LarixyDesktop');
	});

	it('drops repeated keys so the file stays valid', () => {
		const updated = setDesktopEntryValue(entry('StartupWMClass=a', 'StartupWMClass=b'), 'StartupWMClass', 'c');
		expect(updated.match(/StartupWMClass/g)).toHaveLength(1);
	});

	it('inserts a missing key at the end of the main group only', () => {
		const contents = ['[Desktop Entry]', 'Name=Larixy', '', '[Desktop Action a]', 'Name=A', ''].join('\n');
		expect(setDesktopEntryValue(contents, 'StartupWMClass', 'x')).toBe(
			['[Desktop Entry]', 'Name=Larixy', 'StartupWMClass=x', '', '[Desktop Action a]', 'Name=A', ''].join('\n'),
		);
	});
});

describe('desktopExecRunsPath', () => {
	it('matches the launch command as a whole program token', () => {
		expect(desktopExecRunsPath('larixy %U', 'larixy')).toBe(true);
		expect(desktopExecRunsPath('/usr/bin/larixy %U', 'larixy')).toBe(true);
		expect(desktopExecRunsPath('env FOO=1 /opt/Larixy/larixy %U', '/opt/Larixy/larixy')).toBe(true);
	});

	it('does not match other channels or the Flatpak export for the bare larixy command', () => {
		expect(desktopExecRunsPath('/opt/larixy-canary/larixy-canary %U', 'larixy')).toBe(false);
		expect(desktopExecRunsPath('larixy-canary %U', 'larixy')).toBe(false);
		expect(
			desktopExecRunsPath(
				'/usr/bin/flatpak run --branch=stable --arch=x86_64 --command=larixy --file-forwarding app.larixy.Larixy @@u %U @@',
				'larixy',
			),
		).toBe(false);
	});

	it('does not match a sibling tar.gz install whose path starts with ours', () => {
		expect(desktopExecRunsPath('/home/u/larixy/larixy-canary-x64/larixy-canary %U', '/home/u/larixy/larixy')).toBe(
			false,
		);
		expect(desktopExecRunsPath('/home/u/larixy/larixy2 %U', '/home/u/larixy/larixy')).toBe(false);
	});

	it('reads paths quoted and escaped the way our own entry writes them', () => {
		expect(desktopExecRunsPath('"/home/u/My Apps/Flu\\\\$x.AppImage" %U', '/home/u/My Apps/Flu$x.AppImage')).toBe(true);
		expect(desktopExecRunsPath("'/home/u/My Apps/larixy.xyzimage' %U", '/home/u/My Apps/larixy.xyzimage')).toBe(true);
	});
});

describe('isWindowDesktopEntry', () => {
	const official = {wmClasses: STABLE_CLASSES, launchPath: '/opt/Larixy/larixy'};

	it('claims legacy entries that name the old window class or our binary', () => {
		expect(isWindowDesktopEntry(entry('StartupWMClass=Larixy', 'Exec=/somewhere/else %U'), official)).toBe(true);
		expect(isWindowDesktopEntry(entry('Exec=/opt/Larixy/larixy %U'), official)).toBe(true);
	});

	it('skips hidden entries and other channels', () => {
		expect(isWindowDesktopEntry(entry('Hidden=true', 'Exec=/opt/Larixy/larixy %U'), official)).toBe(false);
		expect(
			isWindowDesktopEntry(
				entry('StartupWMClass=app.larixy.LarixyDesktopCanary', 'Exec="/opt/larixy-canary/larixy-canary" %U'),
				{wmClasses: STABLE_CLASSES, launchPath: 'larixy'},
			),
		).toBe(false);
	});

	it('never claims other Electron apps when running on a stock Electron binary', () => {
		const stock = {wmClasses: STABLE_CLASSES, launchPath: '/usr/lib/electron44/electron'};
		expect(isWindowDesktopEntry(entry('Exec=electron44 /usr/lib/other/app.asar %U'), stock)).toBe(false);
		expect(isWindowDesktopEntry(entry('Exec=/usr/lib/electron44/electron %U', 'StartupWMClass=electron'), stock)).toBe(
			false,
		);
	});
});

describe('isAppImageIntegratorEntry', () => {
	const appImage = '/home/u/AppImages/larixy.xyzimage';

	it('accepts the entry Gear Lever writes for the AppImage', () => {
		const gearLever = entry(
			`Exec=${appImage} %U`,
			`TryExec=${appImage}`,
			'X-AppImage-Version=2026.1116.172250',
			'X-AppImage-Name=Larixy',
		);
		expect(isAppImageIntegratorEntry(gearLever, appImage)).toBe(true);
	});

	it('accepts the entry AppImageLauncher writes for the AppImage', () => {
		const launcher = entry(`Exec="${appImage}" %U`, 'X-AppImage-Identifier=0d1e');
		expect(isAppImageIntegratorEntry(launcher, appImage)).toBe(true);
	});

	it('leaves hand-written entries alone', () => {
		expect(isAppImageIntegratorEntry(entry(`Exec=${appImage} %U`, 'StartupWMClass=larixy'), appImage)).toBe(false);
	});

	it('leaves integrator entries for other AppImages alone', () => {
		const canary = entry('Exec=/home/u/AppImages/larixy_canary.appimage %U', 'X-AppImage-Name=Larixy Canary');
		expect(isAppImageIntegratorEntry(canary, appImage)).toBe(false);
		expect(isAppImageIntegratorEntry(entry('Exec=larixy %U', 'X-AppImage-Name=Larixy'), 'larixy')).toBe(false);
	});
});
