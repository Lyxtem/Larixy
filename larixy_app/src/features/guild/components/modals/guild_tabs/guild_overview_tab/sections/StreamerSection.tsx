// SPDX-License-Identifier: AGPL-3.0-or-later

import * as GuildCommands from '@app/features/guild/commands/GuildCommands';
import {SettingsSection} from '@app/features/guild/components/modals/guild_tabs/guild_overview_tab/components/GuildOverviewTabSettingsSection';
import type {ChannelLike} from '@app/features/guild/components/modals/guild_tabs/guild_overview_tab/GuildOverviewTypes';
import {Logger} from '@app/features/platform/utils/AppLogger';
import {Button} from '@app/features/ui/button/Button';
import * as ToastCommands from '@app/features/ui/commands/ToastCommands';
import type {ComboboxOption} from '@app/features/ui/components/form/FormCombobox';
import {Input} from '@app/features/ui/components/form/FormInput';
import {Switch} from '@app/features/ui/components/form/FormSwitch';
import {CompactComboboxRow} from '@app/features/user/components/modals/tabs/components/CompactComboboxRow';
import type {
	GuildStreamerConfigResponse,
	StreamerLink,
	StreamerPlatform,
} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';
import {useEffect, useMemo, useState} from 'react';

const logger = new Logger('StreamerSection');

const STREAMER_TITLE_DESCRIPTOR = msg({
	message: 'Streamer',
	comment: 'Heading of the streamer section in community settings. Only shown for communities in the streamer mode experiment.',
});
const LIVE_ALERTS_DESCRIPTOR = msg({
	message: 'Live alerts',
	comment: 'Switch label in the streamer settings section. Turns the automatic live announcements on or off.',
});
const LIVE_ALERTS_HELP_DESCRIPTOR = msg({
	message: 'Post one message in the alerts channel when a linked channel goes live.',
	comment: 'Help text under the live alerts switch in the streamer settings section.',
});
const MENTION_ROLE_DESCRIPTOR = msg({
	message: 'Mention the Avisos role',
	comment: 'Switch label in the streamer settings section. When on, live alerts ping the Avisos role.',
});
const MENTION_ROLE_HELP_DESCRIPTOR = msg({
	message: 'Members who took the Avisos role get pinged when the alert is posted.',
	comment: 'Help text under the mention switch in the streamer settings section.',
});
const ALERTS_CHANNEL_DESCRIPTOR = msg({
	message: 'Alerts channel',
	comment: 'Label of the channel picker in the streamer settings section.',
});
const NO_ALERTS_CHANNEL_DESCRIPTOR = msg({
	message: 'No alerts channel',
	comment: 'Empty option of the alerts channel picker in the streamer settings section.',
});
const UNNAMED_CHANNEL_DESCRIPTOR = msg({
	message: 'Unnamed channel',
	comment: 'Fallback label for a channel without a name in the streamer settings section.',
});
const NEEDS_REVIEW_DESCRIPTOR = msg({
	message:
		'Live alerts are paused: something they rely on is missing. Pick an alerts channel below and make sure the Avisos role still exists.',
	comment: 'Warning in the streamer settings section when the streamer config needs review.',
});
const LINKED_CHANNELS_DESCRIPTOR = msg({
	message: 'Linked channels',
	comment: 'Heading of the linked channels list in the streamer settings section.',
});
const NO_LINKS_DESCRIPTOR = msg({
	message: 'No channels linked yet.',
	comment: 'Empty state of the linked channels list in the streamer settings section.',
});
const REMOVE_LINK_DESCRIPTOR = msg({
	message: 'Remove',
	comment: 'Button that unlinks a streaming channel in the streamer settings section.',
});
const NEW_LINK_LABEL_DESCRIPTOR = msg({
	message: 'Channel link',
	comment: 'Label of the input where a new streaming channel link is pasted in the streamer settings section.',
});
const ADD_LINK_DESCRIPTOR = msg({
	message: 'Add link',
	comment: 'Button that validates and links a new streaming channel in the streamer settings section.',
});
const UPDATE_FAILED_DESCRIPTOR = msg({
	message: "Couldn't save the streamer settings. Try again.",
	comment: 'Error toast when a streamer setting could not be saved.',
});
const LINK_ADD_FAILED_DESCRIPTOR = msg({
	message: "Couldn't add that link. Check the URL and try again.",
	comment: 'Error toast when a streaming channel link could not be validated or added.',
});

export const StreamerSection = observer(function StreamerSection({
	guildId,
	canManageGuild,
	textChannels,
}: {
	guildId: string;
	canManageGuild: boolean;
	textChannels: Array<ChannelLike>;
}) {
	const {i18n} = useLingui();
	const [config, setConfig] = useState<GuildStreamerConfigResponse | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [busy, setBusy] = useState(false);
	const [newLinkUrl, setNewLinkUrl] = useState('');
	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const fetched = await GuildCommands.getStreamerConfig(guildId);
				if (!cancelled) {
					setConfig(fetched);
					setLoaded(true);
				}
			} catch {
				// Guilds outside the experiment (or without a streamer config)
				// answer as if the config did not exist: the section stays hidden.
				if (!cancelled) setLoaded(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [guildId]);
	const channelOptions = useMemo<Array<ComboboxOption<string | null>>>(
		() => [
			{value: null, label: i18n._(NO_ALERTS_CHANNEL_DESCRIPTOR)},
			...textChannels.map((channel) => ({
				value: channel.id,
				label: channel.name ?? i18n._(UNNAMED_CHANNEL_DESCRIPTOR),
			})),
		],
		[textChannels, i18n.locale],
	);
	if (!loaded || !config) return null;
	const applyUpdate = async (run: () => Promise<GuildStreamerConfigResponse>): Promise<void> => {
		if (busy) return;
		setBusy(true);
		try {
			setConfig(await run());
		} catch (error) {
			logger.error('Failed to update streamer config', error);
			ToastCommands.error(i18n._(UPDATE_FAILED_DESCRIPTOR));
		} finally {
			setBusy(false);
		}
	};
	const handleAddLink = async (): Promise<void> => {
		const url = newLinkUrl.trim();
		if (!url || busy) return;
		setBusy(true);
		try {
			const resolved = await GuildCommands.validateStreamerLink(url);
			const link: StreamerLink = {
				platform: resolved.platform,
				url: resolved.url,
				platform_channel_id: resolved.platform_channel_id,
				platform_login: resolved.platform_login,
				display_name: resolved.display_name,
			};
			setConfig(await GuildCommands.addStreamerLink(guildId, link));
			setNewLinkUrl('');
		} catch (error) {
			logger.error('Failed to add streamer link', error);
			ToastCommands.error(i18n._(LINK_ADD_FAILED_DESCRIPTOR));
		} finally {
			setBusy(false);
		}
	};
	const handleRemoveLink = async (platform: StreamerPlatform): Promise<void> => {
		if (busy) return;
		setBusy(true);
		try {
			await GuildCommands.removeStreamerLink(guildId, platform);
			setConfig(await GuildCommands.getStreamerConfig(guildId));
		} catch (error) {
			logger.error('Failed to remove streamer link', error);
			ToastCommands.error(i18n._(UPDATE_FAILED_DESCRIPTOR));
		} finally {
			setBusy(false);
		}
	};
	return (
		<SettingsSection
			title={i18n._(STREAMER_TITLE_DESCRIPTOR)}
			data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.settings-section"
		>
			{config.status === 'needs_review' && (
				<p data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.needs-review">
					{i18n._(NEEDS_REVIEW_DESCRIPTOR)}
				</p>
			)}
			<Switch
				label={i18n._(LIVE_ALERTS_DESCRIPTOR)}
				description={i18n._(LIVE_ALERTS_HELP_DESCRIPTOR)}
				value={config.enabled}
				onChange={(next) =>
					void applyUpdate(() => GuildCommands.updateStreamerConfig(guildId, {enabled: next}))
				}
				disabled={!canManageGuild || busy}
				data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.switch.enabled"
			/>
			<Switch
				label={i18n._(MENTION_ROLE_DESCRIPTOR)}
				description={i18n._(MENTION_ROLE_HELP_DESCRIPTOR)}
				value={config.mention_role}
				onChange={(next) =>
					void applyUpdate(() => GuildCommands.updateStreamerConfig(guildId, {mention_role: next}))
				}
				disabled={!canManageGuild || busy}
				data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.switch.mention-role"
			/>
			<CompactComboboxRow<string | null>
				label={i18n._(ALERTS_CHANNEL_DESCRIPTOR)}
				value={config.alerts_channel_id}
				onChange={(value) =>
					void applyUpdate(() => GuildCommands.updateStreamerConfig(guildId, {alerts_channel_id: value}))
				}
				options={channelOptions}
				disabled={!canManageGuild || busy}
				controlWidth="wide"
				menuMinWidth={280}
				dataFlx="guild.guild-tabs.guild-overview-tab.streamer-section.alerts-channel"
				data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.compact-combobox-row.alerts-channel"
			/>
			<div data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.links">
				<p data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.links-heading">
					{i18n._(LINKED_CHANNELS_DESCRIPTOR)}
				</p>
				{config.links.length === 0 && (
					<p data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.links-empty">
						{i18n._(NO_LINKS_DESCRIPTOR)}
					</p>
				)}
				{config.links.map((link) => (
					<div
						key={link.platform}
						data-flx={`guild.guild-tabs.guild-overview-tab.streamer-section.link.${link.platform}`}
					>
						<span>
							{link.display_name} · {link.platform}
						</span>
						<Button
							variant="secondary"
							small={true}
							onClick={() => void handleRemoveLink(link.platform)}
							disabled={!canManageGuild || busy}
							data-flx={`guild.guild-tabs.guild-overview-tab.streamer-section.button.remove.${link.platform}`}
						>
							{i18n._(REMOVE_LINK_DESCRIPTOR)}
						</Button>
					</div>
				))}
				<Input
					data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.input.new-link"
					label={i18n._(NEW_LINK_LABEL_DESCRIPTOR)}
					placeholder="https://www.twitch.tv/yourchannel"
					type="text"
					value={newLinkUrl}
					disabled={!canManageGuild || busy}
					onChange={(event) => setNewLinkUrl(event.target.value)}
				/>
				<Button
					variant="secondary"
					small={true}
					onClick={() => void handleAddLink()}
					submitting={busy}
					disabled={!canManageGuild || !newLinkUrl.trim()}
					data-flx="guild.guild-tabs.guild-overview-tab.streamer-section.button.add-link"
				>
					{i18n._(ADD_LINK_DESCRIPTOR)}
				</Button>
			</div>
		</SettingsSection>
	);
});
