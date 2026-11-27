// SPDX-License-Identifier: AGPL-3.0-or-later

import styles from '@app/features/guild/components/modals/AddGuildModal.module.css';
import {http} from '@app/features/platform/transport/RestTransport';
import {Button} from '@app/features/ui/button/Button';
import {Input} from '@app/features/ui/components/form/FormInput';
import type {
	StreamerLink,
	StreamerLinkValidateResponse,
	StreamerPlatform,
} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';
import {msg} from '@lingui/core/macro';
import {Trans, useLingui} from '@lingui/react/macro';
import {useCallback, useEffect, useRef, useState} from 'react';

const STREAMER_VALIDATE_LINK_PATH = '/streamer/validate-link';

const WHERE_DO_YOU_STREAM_DESCRIPTOR = msg({
	message: 'Where do you stream?',
	comment: 'Heading of the links step in the create-community flow when the streamer type is chosen.',
});
const CHECK_LINK_DESCRIPTOR = msg({
	message: 'Check',
	comment: 'Button that validates a streaming channel link in the create-community flow.',
});
const CHANNEL_FOUND_DESCRIPTOR = msg({
	message: 'Channel found: {channelName}',
	comment:
		'Confirmation under a streaming channel link after it validated. {channelName} is the resolved channel name on the platform.',
});
const CHANNEL_NOT_FOUND_DESCRIPTOR = msg({
	message: "We couldn't find that channel. Check the link and try again.",
	comment: 'Error under a streaming channel link when the platform could not resolve it.',
});
const YOUTUBE_LINK_LABEL_DESCRIPTOR = msg({
	message: 'YouTube channel link',
	comment: 'Label of the YouTube link input in the streamer step of the create-community flow.',
});
const TWITCH_LINK_LABEL_DESCRIPTOR = msg({
	message: 'Twitch channel link',
	comment: 'Label of the Twitch link input in the streamer step of the create-community flow.',
});
const KICK_LINK_LABEL_DESCRIPTOR = msg({
	message: 'Kick channel link',
	comment: 'Label of the Kick link input in the streamer step of the create-community flow.',
});

type LinkCheckState = 'idle' | 'checking' | 'valid' | 'invalid';

interface PlatformLinkState {
	url: string;
	check: LinkCheckState;
	link: StreamerLink | null;
}

const EMPTY_LINK_STATE: PlatformLinkState = {url: '', check: 'idle', link: null};

const PLATFORM_FIELDS: Array<{
	platform: StreamerPlatform;
	labelDescriptor: typeof YOUTUBE_LINK_LABEL_DESCRIPTOR;
	placeholder: string;
}> = [
	{platform: 'youtube', labelDescriptor: YOUTUBE_LINK_LABEL_DESCRIPTOR, placeholder: 'https://www.youtube.com/@yourchannel'},
	{platform: 'twitch', labelDescriptor: TWITCH_LINK_LABEL_DESCRIPTOR, placeholder: 'https://www.twitch.tv/yourchannel'},
	{platform: 'kick', labelDescriptor: KICK_LINK_LABEL_DESCRIPTOR, placeholder: 'https://kick.com/yourchannel'},
];

export function StreamerCreateFields({
	onLinksChange,
	dataFlx,
}: {
	onLinksChange: (links: Array<StreamerLink>) => void;
	dataFlx: string;
}) {
	const {i18n} = useLingui();
	const [states, setStates] = useState<Record<StreamerPlatform, PlatformLinkState>>({
		youtube: {...EMPTY_LINK_STATE},
		twitch: {...EMPTY_LINK_STATE},
		kick: {...EMPTY_LINK_STATE},
	});
	const reportedKeyRef = useRef('');
	useEffect(() => {
		const links = PLATFORM_FIELDS.map(({platform}) => states[platform].link).filter(
			(link): link is StreamerLink => link !== null,
		);
		const key = links.map((link) => `${link.platform}:${link.platform_channel_id}`).join('|');
		if (key !== reportedKeyRef.current) {
			reportedKeyRef.current = key;
			onLinksChange(links);
		}
	}, [states, onLinksChange]);
	const handleUrlChange = useCallback((platform: StreamerPlatform, url: string) => {
		setStates((prev) => ({...prev, [platform]: {url, check: 'idle', link: null}}));
	}, []);
	const handleCheck = useCallback(
		async (platform: StreamerPlatform) => {
			const url = states[platform].url.trim();
			if (!url) return;
			setStates((prev) => ({...prev, [platform]: {...prev[platform], check: 'checking'}}));
			try {
				const response = await http.post<StreamerLinkValidateResponse>(STREAMER_VALIDATE_LINK_PATH, {
					body: {url},
					mode: 'silent',
				});
				if (!response.ok) {
					throw new Error(`Streamer link validation failed with status ${response.status}`);
				}
				const body = response.body;
				const link: StreamerLink = {
					platform: body.platform,
					url: body.url,
					platform_channel_id: body.platform_channel_id,
					platform_login: body.platform_login,
					display_name: body.display_name,
				};
				setStates((prev) => {
					const next = {...prev};
					if (body.platform !== platform) {
						next[platform] = {...prev[platform], check: 'idle', link: null};
					}
					next[body.platform] = {url: body.url, check: 'valid', link};
					return next;
				});
			} catch {
				setStates((prev) => ({...prev, [platform]: {...prev[platform], check: 'invalid', link: null}}));
			}
		},
		[states],
	);
	return (
		<div className={styles.streamerSection} data-flx={`${dataFlx}.streamer-links-section`}>
			<div className={styles.streamerLabel} data-flx={`${dataFlx}.streamer-links-label`}>
				{i18n._(WHERE_DO_YOU_STREAM_DESCRIPTOR)}
			</div>
			<p className={styles.streamerDescription} data-flx={`${dataFlx}.streamer-links-description`}>
				<Trans>
					Add the channels where you stream. When you go live, Larixy announces it in this community
					automatically.
				</Trans>
			</p>
			{PLATFORM_FIELDS.map(({platform, labelDescriptor, placeholder}) => {
				const state = states[platform];
				return (
					<div key={platform} className={styles.streamerLinkRow} data-flx={`${dataFlx}.streamer-link.${platform}`}>
						<Input
							data-flx={`${dataFlx}.input.${platform}`}
							label={i18n._(labelDescriptor)}
							placeholder={placeholder}
							type="text"
							value={state.url}
							error={state.check === 'invalid' ? i18n._(CHANNEL_NOT_FOUND_DESCRIPTOR) : undefined}
							onChange={(event) => handleUrlChange(platform, event.target.value)}
						/>
						<div className={styles.streamerLinkActions} data-flx={`${dataFlx}.streamer-link-actions.${platform}`}>
							<Button
								variant="secondary"
								small={true}
								onClick={() => void handleCheck(platform)}
								submitting={state.check === 'checking'}
								disabled={!state.url.trim() || state.check === 'valid'}
								data-flx={`${dataFlx}.button.check.${platform}`}
							>
								{i18n._(CHECK_LINK_DESCRIPTOR)}
							</Button>
							{state.check === 'valid' && state.link && (
								<span className={styles.streamerLinkStatus} data-flx={`${dataFlx}.streamer-link-status.${platform}`}>
									{i18n._(CHANNEL_FOUND_DESCRIPTOR, {channelName: state.link.display_name})}
								</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
