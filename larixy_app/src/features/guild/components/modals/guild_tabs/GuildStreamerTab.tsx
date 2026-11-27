// SPDX-License-Identifier: AGPL-3.0-or-later

import Channels from '@app/features/channel/state/Channels';
import styles from '@app/features/guild/components/modals/guild_tabs/GuildStreamerTab.module.css';
import type {ChannelLike} from '@app/features/guild/components/modals/guild_tabs/guild_overview_tab/GuildOverviewTypes';
import {StreamerSection} from '@app/features/guild/components/modals/guild_tabs/guild_overview_tab/sections/StreamerSection';
import Permission from '@app/features/permissions/state/Permission';
import {ChannelTypes, Permissions} from '@larixy/constants/src/ChannelConstants';
import {observer} from 'mobx-react-lite';
import type React from 'react';
import {useMemo} from 'react';

const GuildStreamerTab: React.FC<{guildId: string}> = observer(({guildId}) => {
	const canManageGuild = Permission.can(Permissions.MANAGE_GUILD, {guildId});
	const channels = Channels.getGuildChannels(guildId);
	const textChannels = useMemo(
		() =>
			channels.filter(
				(channel) => channel.type === ChannelTypes.GUILD_TEXT || channel.type === ChannelTypes.GUILD_ANNOUNCEMENT,
			) as Array<ChannelLike>,
		[channels],
	);
	return (
		<div className={styles.container} data-flx="guild.guild-tabs.guild-streamer-tab.container">
			<StreamerSection
				guildId={guildId}
				canManageGuild={canManageGuild}
				textChannels={textChannels}
				data-flx="guild.guild-tabs.guild-streamer-tab.streamer-section"
			/>
		</div>
	);
});

export default GuildStreamerTab;
