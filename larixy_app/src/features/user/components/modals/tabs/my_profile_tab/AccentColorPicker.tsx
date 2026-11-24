// SPDX-License-Identifier: AGPL-3.0-or-later

import {LimitResolver} from '@app/features/app/utils/LimitResolverAdapter';
import {isLimitToggleEnabled} from '@app/features/app/utils/LimitUtils';
import {getPremiumProductName} from '@app/features/premium/utils/PremiumUtils';
import {ColorPickerField} from '@app/features/ui/components/form/ColorPickerField';
import {PlutoniumUpsell} from '@app/features/ui/plutonium_upsell/PlutoniumUpsell';
import myProfileTabStyles from '@app/features/user/components/modals/tabs/MyProfileTab.module.css';
import styles from '@app/features/user/components/modals/tabs/my_profile_tab/AccentColorPicker.module.css';
import {ACCENT_COLOR_DESCRIPTOR} from '@app/features/user/utils/UserMessageDescriptors';
import {msg} from '@lingui/core/macro';
import {Trans, useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';

const DEFAULT_PROFILE_ACCENT_COLOR = 0x4641d9;
const DEFAULT_PROFILE_BANNER_COLOR = 0x3630f6;

const CUSTOMIZES_THE_BORDER_AND_BANNER_COLOR_ON_YOUR_DESCRIPTOR = msg({
	message: 'Personaliza los colores en degradado de tu perfil estilo Discord',
	comment: 'Label in the accent color picker. Keep the tone plain and specific.',
});

interface AccentColorPickerProps {
	value: number | null;
	onChange: (value: number | null) => void;
	bannerColor?: number | null;
	onBannerColorChange?: (value: number | null) => void;
	hasStoredGradient?: boolean;
	disabled?: boolean;
	errorMessage?: string;
}

export const AccentColorPicker = observer(
	({value, onChange, bannerColor, onBannerColorChange, hasStoredGradient, disabled, errorMessage}: AccentColorPickerProps) => {
		const {i18n} = useLingui();
		const isDualTheme = onBannerColorChange !== undefined;
		const PREMIUM_PRODUCT_NAME = getPremiumProductName();
		const hasProfileColorsEntitlement = isLimitToggleEnabled(
			{feature_profile_colors: LimitResolver.resolve({key: 'feature_profile_colors', fallback: 0})},
			'feature_profile_colors',
		);
		// Grandfathering: a profile that already stores a gradient keeps full
		// editing access even without the entitlement.
		const isGradientLocked = isDualTheme && !hasProfileColorsEntitlement && hasStoredGradient !== true;

		const currentPrimary = bannerColor ?? DEFAULT_PROFILE_BANNER_COLOR;
		const currentAccent = value ?? DEFAULT_PROFILE_ACCENT_COLOR;
		const primaryHex = `#${(currentPrimary >>> 0).toString(16).padStart(6, '0')}`;
		const accentHex = `#${(currentAccent >>> 0).toString(16).padStart(6, '0')}`;
		const gradientStyle = `linear-gradient(135deg, ${primaryHex} 0%, ${accentHex} 100%)`;

		return (
			<div data-flx="user.my-profile-tab.accent-color-picker.div" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
				{isDualTheme && (
					<div>
						<div style={{fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-primary)'}}>
							Tema de perfil
						</div>
						<div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>
							{i18n._(CUSTOMIZES_THE_BORDER_AND_BANNER_COLOR_ON_YOUR_DESCRIPTOR)}
						</div>
						{isGradientLocked && (
							<PlutoniumUpsell data-flx="user.my-profile-tab.accent-color-picker.plutonium-upsell">
								<Trans>
									Profile gradient colors require {PREMIUM_PRODUCT_NAME}. A single accent color is free
									for everyone.
								</Trans>
							</PlutoniumUpsell>
						)}
						<div
							style={{
								height: '2.5rem',
								borderRadius: '0.5rem',
								background: gradientStyle,
								border: '1px solid rgba(255, 255, 255, 0.15)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#ffffff',
								fontWeight: 600,
								fontSize: '0.8125rem',
								textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
								marginBottom: '0.5rem',
							}}
						>
							Degradado del perfil
						</div>
						<div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
							<ColorPickerField
								label="Color Primario (Superior / Banner)"
								description="Color del banner y extremo superior del degradado"
								descriptionClassName={myProfileTabStyles.inputFooter}
								value={bannerColor ?? DEFAULT_PROFILE_BANNER_COLOR}
								onChange={onBannerColorChange}
								defaultValue={DEFAULT_PROFILE_BANNER_COLOR}
								isDefaultValue={bannerColor === null}
								onReset={() => onBannerColorChange(null)}
								disabled={disabled || isGradientLocked}
								data-flx="user.my-profile-tab.banner-color-picker.color-picker-field.change"
							/>
							<ColorPickerField
								label="Color de Acento (Inferior / Bordes)"
								description="Color de acento y extremo inferior del degradado"
								descriptionClassName={myProfileTabStyles.inputFooter}
								value={value ?? DEFAULT_PROFILE_ACCENT_COLOR}
								onChange={onChange}
								defaultValue={DEFAULT_PROFILE_ACCENT_COLOR}
								isDefaultValue={value === null}
								onReset={() => onChange(null)}
								disabled={disabled}
								data-flx="user.my-profile-tab.accent-color-picker.color-picker-field.change"
							/>
						</div>
					</div>
				)}
				{!isDualTheme && (
					<ColorPickerField
						label={i18n._(ACCENT_COLOR_DESCRIPTOR)}
						description={i18n._(CUSTOMIZES_THE_BORDER_AND_BANNER_COLOR_ON_YOUR_DESCRIPTOR)}
						descriptionClassName={myProfileTabStyles.inputFooter}
						value={value ?? DEFAULT_PROFILE_ACCENT_COLOR}
						onChange={onChange}
						defaultValue={DEFAULT_PROFILE_ACCENT_COLOR}
						isDefaultValue={value === null}
						onReset={() => onChange(null)}
						disabled={disabled}
						data-flx="user.my-profile-tab.accent-color-picker.color-picker-field.change"
					/>
				)}
				{errorMessage && (
					<p className={styles.errorMessage} data-flx="user.my-profile-tab.accent-color-picker.error-message">
						{errorMessage}
					</p>
				)}
			</div>
		);
	},
);
