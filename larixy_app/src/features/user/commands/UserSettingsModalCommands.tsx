// SPDX-License-Identifier: AGPL-3.0-or-later

import {UserSettingsModal} from '@app/features/app/components/dialogs/LoadableSettingsModals';
import {isDesktopLocalAppDocument} from '@app/features/platform/DesktopLocalAppRuntime';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {modal} from '@app/features/ui/commands/ModalCommands';
import {isMobileExperienceEnabled} from '@app/features/ui/utils/MobileExperience';
import UserSettings from '@app/features/user/state/UserSettings';

const DESKTOP_SETTINGS_LOAD_WAIT_MS = 800;

export function openUserSettingsModal(): void {
	if (!isDesktopLocalAppDocument()) {
		pushUserSettingsModal();
		return;
	}
	void Promise.race([
		UserSettingsModal.preload(),
		new Promise<void>((resolve) => setTimeout(resolve, DESKTOP_SETTINGS_LOAD_WAIT_MS)),
	]).then(pushUserSettingsModal);
}

function pushUserSettingsModal(): void {
	// On mobile the settings open at the root list: deep-linking into the
	// privacy section on every open (because a privacy review is pending)
	// makes the settings feel broken. The pending review stays visible as
	// a badge on the Privacy row instead. Desktop keeps the deep link
	// because the section list remains visible next to the content.
	const privacyReviewPending = UserSettings.isPrivacySetupPending() && !isMobileExperienceEnabled();
	ModalCommands.push(
		modal(
			() =>
				privacyReviewPending ? (
					<UserSettingsModal
						initialTab="privacy_safety"
						initialSubtab="connections"
						data-flx="user.user-settings-modal-commands.open-user-settings-modal.user-settings-modal--privacy-review"
					/>
				) : (
					<UserSettingsModal data-flx="user.user-settings-modal-commands.open-user-settings-modal.user-settings-modal" />
				),
			'user-settings',
		),
	);
}

export function preloadUserSettingsModal(): void {
	void UserSettingsModal.preload();
}

export const PROFILE_BADGES_SECTION_ID = 'profile-badges';

export function openProfileBadgeSettings(): void {
	ModalCommands.push(
		modal(
			() => (
				<UserSettingsModal
					initialTab="my_profile"
					initialSubtab={PROFILE_BADGES_SECTION_ID}
					data-flx="user.user-settings-modal-commands.open-profile-badge-settings.user-settings-modal"
				/>
			),
			'user-settings',
		),
	);
}
