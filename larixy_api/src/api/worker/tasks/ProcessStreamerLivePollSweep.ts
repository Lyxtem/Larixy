// SPDX-License-Identifier: AGPL-3.0-or-later

import type {ChannelRepository} from '@app/api/channel/ChannelRepository';
import type {ChannelService} from '@app/api/channel/services/ChannelService';
import {SYSTEM_USER_ID} from '@app/api/constants/Core';
import type {
	GuildStreamerConfigRow,
	GuildStreamerLiveStateRow,
	StreamerLinkUdt,
} from '@app/api/database/types/StreamerTypes';
import {SYSTEM_THREAD_VIEWER} from '@app/api/experiment/ChannelThreadsGate';
import type {GuildRepository} from '@app/api/guild/repositories/GuildRepository';
import type {InstanceConfigRepository} from '@app/api/instance/InstanceConfigRepository';
import {Logger} from '@app/api/Logger';
import {createRequestCache, type RequestCache} from '@app/api/middleware/RequestCacheMiddleware';
import type {User} from '@app/api/models/User';
import {StreamerConfigRepository} from '@app/api/streamer/StreamerConfigRepository';
import {KickStreamerClient} from '@app/api/streamer/platforms/KickStreamerClient';
import {
	StreamerPlatformError,
	type StreamerLiveStatus,
	type StreamerPlatformClient,
} from '@app/api/streamer/platforms/StreamerPlatformClient';
import {TwitchStreamerClient} from '@app/api/streamer/platforms/TwitchStreamerClient';
import {YoutubeStreamerClient} from '@app/api/streamer/platforms/YoutubeStreamerClient';
import type {UserRepository} from '@app/api/user/repositories/UserRepository';
import {getWorkerDependencies} from '@app/api/worker/WorkerContext';
import {MessageFlags} from '@larixy/constants/src/ChannelConstants';
import {
	streamerModeGuildActive,
	type StreamerModeConfig,
} from '@larixy/schema/src/domains/admin/StreamerModeSchemas';
import {
	StreamerPlatformSchema,
	type StreamerPlatform,
} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';
import type {WorkerTaskHandler} from '@pkgs/worker/src/contracts/WorkerTask';
import {ms} from 'itty-time';

const PAGE_SIZE = 100;
const GRACE_WINDOW_MS = ms('10 minutes');
const MAX_TITLE_LENGTH = 200;

interface SweepDeps {
	configRepository: StreamerConfigRepository;
	instanceConfigRepository: InstanceConfigRepository;
	channelRepository: ChannelRepository;
	guildRepository: GuildRepository;
	channelService: ChannelService;
	userRepository: UserRepository;
}

interface SweepResult {
	configs: number;
	checked: number;
	alerts: number;
	resumed: number;
	failed: number;
}

function createPlatformClient(
	instanceConfigRepository: InstanceConfigRepository,
	platform: StreamerPlatform,
): StreamerPlatformClient {
	const credentials = async (
		target: 'twitch' | 'kick',
	): Promise<{clientId: string | null; clientSecret: string | null}> => {
		const {streamer} = await instanceConfigRepository.getInstanceIntegrationsConfig();
		return target === 'twitch'
			? {clientId: streamer.twitch_client_id, clientSecret: streamer.twitch_client_secret}
			: {clientId: streamer.kick_client_id, clientSecret: streamer.kick_client_secret};
	};
	switch (platform) {
		case 'twitch':
			return new TwitchStreamerClient(() => credentials('twitch'));
		case 'kick':
			return new KickStreamerClient(() => credentials('kick'));
		case 'youtube':
			return new YoutubeStreamerClient();
	}
}

function sanitizeStreamTitle(title: string): string {
	return title
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/<@[!&]?\d+>|<#\d+>/g, '@…')
		.replace(/@(everyone|here)/gi, '@​$1')
		.slice(0, MAX_TITLE_LENGTH);
}

function emptyLiveState(config: GuildStreamerConfigRow, link: StreamerLinkUdt): GuildStreamerLiveStateRow {
	return {
		guild_id: config.guild_id,
		platform: link.platform,
		platform_channel_id: link.platform_channel_id,
		state: 'offline',
		session_started_at: null,
		last_seen_live_at: null,
		last_seen_offline_at: null,
		alert_message_id: null,
		alerted: false,
	};
}

async function markConfigNeedsReview(deps: SweepDeps, config: GuildStreamerConfigRow, reason: string): Promise<void> {
	Logger.warn({guildId: config.guild_id.toString(), reason}, 'Streamer config marked as needs_review');
	if (config.status === 'needs_review') return;
	await deps.configRepository.upsertConfig({...config, status: 'needs_review', updated_at: new Date()});
}

async function publishLiveAlert(params: {
	deps: SweepDeps;
	config: GuildStreamerConfigRow;
	link: StreamerLinkUdt;
	status: StreamerLiveStatus;
	state: GuildStreamerLiveStateRow;
	systemUser: User;
	requestCache: RequestCache;
	now: Date;
}): Promise<boolean> {
	const {deps, config, link, status, state, systemUser, requestCache, now} = params;
	const alertsChannelId = config.alerts_channel_id;
	if (alertsChannelId === null) {
		await markConfigNeedsReview(deps, config, 'alerts channel is not configured');
		return false;
	}
	const channel = await deps.channelRepository.channelData.findUnique(alertsChannelId);
	if (!channel || channel.guildId !== config.guild_id) {
		await markConfigNeedsReview(deps, config, 'alerts channel no longer exists');
		return false;
	}
	let mentionRoleId: string | null = null;
	let roleMissing = false;
	if (config.mention_role) {
		if (config.alerts_role_id === null) {
			roleMissing = true;
		} else {
			const role = await deps.guildRepository.getRole(config.alerts_role_id, config.guild_id);
			if (role) {
				mentionRoleId = config.alerts_role_id.toString();
			} else {
				roleMissing = true;
			}
		}
	}
	const startedAt = status.startedAt ? new Date(status.startedAt) : null;
	const liveState: GuildStreamerLiveStateRow = {
		...state,
		state: 'live',
		session_started_at: startedAt && !Number.isNaN(startedAt.getTime()) ? startedAt : now,
		last_seen_live_at: now,
		last_seen_offline_at: null,
		alert_message_id: null,
		alerted: true,
	};
	// The state transition is written before publishing: a crash between the
	// two can lose this alert, but can never duplicate it.
	await deps.configRepository.upsertLiveState(liveState);
	const titlePart = status.title ? ` — ${sanitizeStreamTitle(status.title)}` : '';
	let content = `🔴 **${link.display_name} está en directo**${titlePart}\n${link.url}`;
	if (mentionRoleId !== null) {
		content += `\n<@&${mentionRoleId}>`;
	}
	const {message} = await deps.channelService.messages.send.sendMessage({
		user: systemUser,
		viewer: SYSTEM_THREAD_VIEWER,
		channelId: alertsChannelId,
		data: {content, flags: MessageFlags.SUPPRESS_EMBEDS},
		requestCache,
	});
	await deps.configRepository.upsertLiveState({...liveState, alert_message_id: message.id});
	if (roleMissing) {
		await markConfigNeedsReview(deps, config, 'alerts role no longer exists');
	}
	return true;
}

async function processLink(params: {
	deps: SweepDeps;
	config: GuildStreamerConfigRow;
	link: StreamerLinkUdt;
	systemUser: User;
	requestCache: RequestCache;
	result: SweepResult;
}): Promise<void> {
	const {deps, config, link, systemUser, requestCache, result} = params;
	const platform = StreamerPlatformSchema.parse(link.platform);
	const client = createPlatformClient(deps.instanceConfigRepository, platform);
	let status: StreamerLiveStatus;
	try {
		status = await client.getLiveStatus(link.platform_channel_id, link.platform_login);
	} catch (error) {
		if (error instanceof StreamerPlatformError) {
			Logger.debug(
				{guildId: config.guild_id.toString(), platform, kind: error.kind},
				'Streamer platform check skipped',
			);
		} else {
			Logger.warn({guildId: config.guild_id.toString(), platform, error}, 'Streamer platform check failed');
		}
		result.failed += 1;
		return;
	}
	const now = new Date();
	const state =
		(await deps.configRepository.getLiveState(config.guild_id, link.platform, link.platform_channel_id)) ??
		emptyLiveState(config, link);
	if (!status.live) {
		if (state.state === 'live') {
			await deps.configRepository.upsertLiveState({...state, state: 'offline', last_seen_offline_at: now});
		}
		return;
	}
	if (state.state === 'live') {
		await deps.configRepository.upsertLiveState({...state, last_seen_live_at: now});
		return;
	}
	const withinGrace =
		state.alerted &&
		state.last_seen_offline_at !== null &&
		now.getTime() - state.last_seen_offline_at.getTime() <= GRACE_WINDOW_MS;
	if (withinGrace) {
		// The stream dropped and came back inside the grace window: same
		// session, no second alert.
		await deps.configRepository.upsertLiveState({...state, state: 'live', last_seen_live_at: now});
		result.resumed += 1;
		return;
	}
	const published = await publishLiveAlert({deps, config, link, status, state, systemUser, requestCache, now});
	if (published) {
		result.alerts += 1;
	}
}

async function processConfig(params: {
	deps: SweepDeps;
	experiment: StreamerModeConfig;
	config: GuildStreamerConfigRow;
	systemUser: User;
	requestCache: RequestCache;
	result: SweepResult;
}): Promise<void> {
	const {deps, experiment, config, systemUser, requestCache, result} = params;
	if (!config.enabled || config.status !== 'active') return;
	if (!streamerModeGuildActive(experiment, config.guild_id.toString())) return;
	for (const link of config.links) {
		result.checked += 1;
		try {
			await processLink({deps, config, link, systemUser, requestCache, result});
		} catch (error) {
			Logger.error(
				{guildId: config.guild_id.toString(), platform: link.platform, error},
				'Unhandled error processing streamer link in live poll sweep',
			);
			result.failed += 1;
		}
	}
}

async function processStreamerLivePollSweepCore(deps: SweepDeps): Promise<SweepResult> {
	const result: SweepResult = {configs: 0, checked: 0, alerts: 0, resumed: 0, failed: 0};
	const experiment = await deps.instanceConfigRepository.getStreamerModeConfig();
	if (!experiment.enabled) {
		Logger.debug('Skipping streamer live poll sweep because the experiment is disabled');
		return result;
	}
	Logger.debug('Starting streamer live poll sweep');
	const systemUser = await deps.userRepository.findUniqueAssert(SYSTEM_USER_ID);
	const requestCache = createRequestCache();
	try {
		let pageState: string | null = null;
		do {
			const page = await deps.configRepository.listConfigsPage(PAGE_SIZE, pageState);
			pageState = page.pageState;
			for (const config of page.rows) {
				result.configs += 1;
				try {
					await processConfig({deps, experiment, config, systemUser, requestCache, result});
				} catch (error) {
					Logger.error(
						{error, guildId: config.guild_id},
						'Unhandled error processing streamer config in live poll sweep',
					);
					result.failed += 1;
				}
			}
		} while (pageState);
	} finally {
		requestCache.clear();
	}
	Logger.info(
		{
			configs: result.configs,
			checked: result.checked,
			alerts: result.alerts,
			resumed: result.resumed,
			failed: result.failed,
		},
		'Completed streamer live poll sweep',
	);
	return result;
}

const processStreamerLivePollSweep: WorkerTaskHandler = async (_payload, helpers) => {
	helpers.logger.debug('Processing streamer live poll sweep task');
	const {instanceConfigRepository, channelRepository, guildRepository, channelService, userRepository} =
		getWorkerDependencies();
	await processStreamerLivePollSweepCore({
		configRepository: new StreamerConfigRepository(),
		instanceConfigRepository,
		channelRepository,
		guildRepository,
		channelService,
		userRepository,
	});
};

export default processStreamerLivePollSweep;
