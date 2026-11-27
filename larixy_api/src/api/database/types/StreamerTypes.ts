// SPDX-License-Identifier: AGPL-3.0-or-later

import type {ChannelID, GuildID, MessageID, RoleID, UserID} from '@app/api/BrandedTypes';

export interface StreamerLinkUdt {
	platform: string;
	url: string;
	platform_channel_id: string;
	platform_login: string;
	display_name: string;
}

export interface GuildStreamerConfigRow {
	guild_id: GuildID;
	owner_user_id: UserID;
	enabled: boolean;
	status: string;
	alerts_channel_id: ChannelID | null;
	alerts_role_id: RoleID | null;
	mention_role: boolean;
	links: Array<StreamerLinkUdt>;
	created_at: Date;
	updated_at: Date;
}

export const GUILD_STREAMER_CONFIG_COLUMNS = [
	'guild_id',
	'owner_user_id',
	'enabled',
	'status',
	'alerts_channel_id',
	'alerts_role_id',
	'mention_role',
	'links',
	'created_at',
	'updated_at',
] as const satisfies ReadonlyArray<keyof GuildStreamerConfigRow>;

export interface GuildStreamerLiveStateRow {
	guild_id: GuildID;
	platform: string;
	platform_channel_id: string;
	state: string;
	session_started_at: Date | null;
	last_seen_live_at: Date | null;
	last_seen_offline_at: Date | null;
	alert_message_id: MessageID | null;
	alerted: boolean;
}

export const GUILD_STREAMER_LIVE_STATE_COLUMNS = [
	'guild_id',
	'platform',
	'platform_channel_id',
	'state',
	'session_started_at',
	'last_seen_live_at',
	'last_seen_offline_at',
	'alert_message_id',
	'alerted',
] as const satisfies ReadonlyArray<keyof GuildStreamerLiveStateRow>;
