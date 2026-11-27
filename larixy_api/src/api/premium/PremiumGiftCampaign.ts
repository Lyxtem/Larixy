// SPDX-License-Identifier: AGPL-3.0-or-later

import {Config} from '@app/api/Config';
import {SYSTEM_USER_ID} from '@app/api/constants/Core';
import type {InstanceConfigRepository} from '@app/api/instance/InstanceConfigRepository';
import {Logger} from '@app/api/Logger';
import {createGiftCodeRow, generateUniqueGiftCode} from '@app/api/models/GiftCode';
import type {User} from '@app/api/models/User';
import type {UserRepository} from '@app/api/user/repositories/UserRepository';
import {checkIsPremium} from '@app/api/user/UserHelpers';
import {UserChannelService} from '@app/api/user/services/UserChannelService';
import {trySendSystemDm, type SystemDmDeps} from '@app/api/user/services/SystemDmMessage';
import type {WorkerDependencies} from '@app/api/worker/WorkerDependencies';
import {UserFlags} from '@larixy/constants/src/UserConstants';

/** How much Premium each campaign gift grants. */
const PREMIUM_GIFT_CAMPAIGN_DURATION_MONTHS = 3;

/**
 * ==========================================================================
 *  DM COPY — edit the campaign message here.
 *  This is the ONLY place the gift DM text lives. The gift link is appended
 *  on its own line at the end: the app detects gift links in message content
 *  and renders the native gift card with its redeem button.
 * ==========================================================================
 */
export const PREMIUM_GIFT_CAMPAIGN_DM_COPY = `🎁 **¡Tienes un regalo!**

Queremos darte las gracias por formar parte de Larixy con **3 meses de Premium gratis**.

Para reclamarlo, abre el enlace de regalo que va al final de este mensaje y pulsa «Canjear». El enlace es personal y solo funciona con tu cuenta; puedes usarlo cuando quieras, sin prisa. Y si para cuando lo uses ya tienes Premium, no pasa nada: los 3 meses se suman igual a tu tiempo.

Sin tarjeta y sin compromiso: cuando acabe el regalo, tu cuenta sigue como siempre, salvo que tú decidas otra cosa.

¡Que lo disfrutes!
— El equipo de Larixy`;

const INELIGIBLE_FLAGS = UserFlags.DELETED | UserFlags.SELF_DELETED | UserFlags.DISABLED;

/** Builds the system DM dependencies from a worker process's dependencies. */
export function buildWorkerSystemDmDeps(deps: WorkerDependencies): SystemDmDeps {
	return {
		channelService: deps.channelService,
		userChannelService: new UserChannelService(
			deps.userRepository,
			deps.channelService,
			deps.channelRepository,
			deps.gatewayService,
			deps.snowflakeService,
			deps.userPermissionUtils,
			deps.limitConfigService,
		),
		userCacheService: deps.userCacheService,
	};
}

export interface PremiumGiftCampaignDeps {
	userRepository: UserRepository;
	instanceConfigRepository: Pick<InstanceConfigRepository, 'getPremiumGiftCampaignConfig'>;
	systemDm: SystemDmDeps;
}

export type PremiumGiftCampaignOutcome =
	| 'disabled'
	| 'ineligible'
	| 'already_sent'
	| 'sent'
	| 'dm_failed';

function buildPremiumGiftLink(code: string): string {
	return `${Config.endpoints.gift.replace(/\/+$/u, '')}/${code}`;
}

function isPremiumGiftCampaignEligible(user: User): boolean {
	if (user.id === SYSTEM_USER_ID || user.isBot || user.isSystem) {
		return false;
	}
	if ((user.flags & INELIGIBLE_FLAGS) !== 0n) {
		return false;
	}
	return !checkIsPremium(user);
}

/**
 * Ensures the account has been sent its one campaign gift DM. Idempotent:
 * the campaign ledger row is created together with the gift code before the
 * DM is attempted, and sent_at is only stamped after a successful send, so a
 * failed send is retried (with the same code) by a later run while a sent
 * gift is never sent twice.
 */
export async function ensurePremiumGiftDm(
	deps: PremiumGiftCampaignDeps,
	user: User,
): Promise<PremiumGiftCampaignOutcome> {
	const config = await deps.instanceConfigRepository.getPremiumGiftCampaignConfig();
	if (!config.enabled) {
		return 'disabled';
	}
	if (!isPremiumGiftCampaignEligible(user)) {
		return 'ineligible';
	}
	let entry = await deps.userRepository.findPremiumGiftCampaignEntryByUser(user.id);
	if (entry?.claimed_at) {
		return 'already_sent';
	}
	if (!entry) {
		const code = await generateUniqueGiftCode((candidate) => deps.userRepository.findGiftCode(candidate));
		await deps.userRepository.createGiftCode(
			createGiftCodeRow({
				code,
				durationType: 'months',
				durationQuantity: PREMIUM_GIFT_CAMPAIGN_DURATION_MONTHS,
				createdByUserId: SYSTEM_USER_ID,
				createdAt: new Date(),
			}),
		);
		entry = {
			user_id: user.id,
			code,
			sent_at: null,
			claimed_at: null,
			created_at: new Date(),
		};
		await deps.userRepository.createPremiumGiftCampaignEntry(entry);
	}
	if (entry.sent_at) {
		return 'already_sent';
	}
	const content = `${PREMIUM_GIFT_CAMPAIGN_DM_COPY}\n\n${buildPremiumGiftLink(entry.code)}`;
	const sent = await trySendSystemDm(deps.systemDm, deps.userRepository, user.id, content);
	if (!sent) {
		Logger.warn({userId: user.id.toString()}, 'Premium gift campaign DM could not be delivered; will retry');
		return 'dm_failed';
	}
	await deps.userRepository.markPremiumGiftCampaignSent(user.id);
	return 'sent';
}
