import * as Modal from '@app/features/app/components/dialogs/Modal';
import {useFormSubmit} from '@app/features/app/hooks/useFormSubmit';
import ExperimentAssignments from '@app/features/experiment/state/ExperimentAssignments';
import * as GuildCommands from '@app/features/guild/commands/GuildCommands';
import styles from '@app/features/guild/components/modals/AddGuildModal.module.css';
import {
	renderGuildCreateAccountGate,
	renderGuildCreateFields,
	useGuildCreateIconField,
} from '@app/features/guild/components/modals/add_guild_modal/GuildCreateShared';
import {StreamerCreateFields} from '@app/features/guild/components/modals/add_guild_modal/StreamerCreateFields';
import {
	CREATE_COMMUNITY_FORM_DESCRIPTOR,
	type GuildCreateFormInputs,
	handleGuildCreationError,
	ModalFooterContext,
} from '@app/features/guild/components/modals/add_guild_modal/shared';
import {CREATE_COMMUNITY_DESCRIPTOR} from '@app/features/i18n/utils/CommonMessageDescriptors';
import * as NavigationCommands from '@app/features/navigation/commands/NavigationCommands';
import {Button} from '@app/features/ui/button/Button';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {Form} from '@app/features/ui/components/form/Form';
import type {StreamerLink} from '@larixy/schema/src/domains/guild/GuildStreamerSchemas';
import {msg} from '@lingui/core/macro';
import {Trans, useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';
import {useCallback, useContext, useEffect, useId, useState} from 'react';
import {useForm} from 'react-hook-form';

const IMAGE_COULDN_T_BE_USED_DESCRIPTOR = msg({
	message: "Image couldn't be used",
	comment: 'Error modal title shown when a create-community icon upload cannot be accepted or processed.',
});
const CHANGE_ICON_DESCRIPTOR = msg({
	message: 'Change icon',
	comment:
		'Title of the modal where the user picks a create-community icon source. Keep it concise. Keep the tone plain and specific.',
});

const ICON_FIELD_MESSAGES = {
	imageCouldNotBeUsed: IMAGE_COULDN_T_BE_USED_DESCRIPTOR,
	changeIcon: CHANGE_ICON_DESCRIPTOR,
};

const WHAT_KIND_OF_COMMUNITY_DESCRIPTOR = msg({
	message: 'What kind of community is this?',
	comment:
		'Question above the community type options in the create-community flow. Only shown to accounts in the streamer mode experiment.',
});
const FRIENDS_TYPE_DESCRIPTOR = msg({
	message: 'Friends',
	comment: 'Community type option in the create-community flow: a community for a group of friends.',
});
const COMMUNITY_TYPE_DESCRIPTOR = msg({
	message: 'Community',
	comment: 'Community type option in the create-community flow: a general community.',
});
const STREAMER_TYPE_DESCRIPTOR = msg({
	message: 'Streamer',
	comment:
		'Community type option in the create-community flow: a community for a streamer, created with live alerts set up.',
});

type GuildCreateKind = 'friends' | 'community' | 'streamer';

const GUILD_CREATE_KIND_OPTIONS: Array<{value: GuildCreateKind; descriptor: typeof FRIENDS_TYPE_DESCRIPTOR}> = [
	{value: 'friends', descriptor: FRIENDS_TYPE_DESCRIPTOR},
	{value: 'community', descriptor: COMMUNITY_TYPE_DESCRIPTOR},
	{value: 'streamer', descriptor: STREAMER_TYPE_DESCRIPTOR},
];

export const GuildCreateForm = observer(() => {
	const {i18n} = useLingui();
	const form = useForm<GuildCreateFormInputs>({defaultValues: {name: ''}});
	const modalFooterContext = useContext(ModalFooterContext);
	const formId = useId();
	const streamerAvailable = ExperimentAssignments.response.assignments.streamer_mode?.enabled === true;
	const [kind, setKind] = useState<GuildCreateKind>('community');
	const [streamerLinks, setStreamerLinks] = useState<Array<StreamerLink>>([]);
	const nameValue = form.watch('name');
	const iconField = useGuildCreateIconField({
		form: form,
		nameValue,
		dataFlx: 'guild.add-guild-modal.guild-create-form',
		cropModalDataFlx: 'guild.add-guild-modal.handle-icon-upload.asset-crop-modal',
		clearIconErrors: true,
		messages: ICON_FIELD_MESSAGES,
	});
	const onSubmit = useCallback(
		async (data: GuildCreateFormInputs) => {
			try {
				const guild = await GuildCommands.create({
					icon: data.icon,
					name: data.name,
					...(kind === 'streamer' ? {streamer: {links: streamerLinks}} : {}),
				});
				ModalCommands.pop();
				NavigationCommands.selectChannel(guild.id, guild.system_channel_id || undefined);
			} catch (error) {
				handleGuildCreationError(error);
			}
		},
		[kind, streamerLinks],
	);
	const {handleSubmit, isSubmitting} = useFormSubmit({form, onSubmit, defaultErrorField: 'name'});
	useEffect(() => {
		const isNameEmpty = !nameValue?.trim();
		const isCreateDisabled = isNameEmpty || (kind === 'streamer' && streamerLinks.length === 0);
		modalFooterContext?.setFooterContent(
			<>
				<Button
					onClick={modalFooterContext.onBack}
					variant="secondary"
					data-flx="guild.add-guild-modal.guild-create-form.button.back"
				>
					<Trans>Back</Trans>
				</Button>
				<Button
					onClick={handleSubmit}
					submitting={isSubmitting}
					disabled={isCreateDisabled}
					data-flx="guild.add-guild-modal.guild-create-form.button.submit"
				>
					{i18n._(CREATE_COMMUNITY_DESCRIPTOR)}
				</Button>
			</>,
		);
		return () => modalFooterContext?.setFooterContent(null);
	}, [handleSubmit, isSubmitting, modalFooterContext, nameValue, kind, streamerLinks]);
	const accountGate = renderGuildCreateAccountGate('guild.add-guild-modal.guild-create-form');
	if (accountGate) {
		return accountGate;
	}
	return (
		<div className={styles.formContainer} data-flx="guild.add-guild-modal.guild-create-form.form-container--3">
			<Modal.Description data-flx="guild.add-guild-modal.guild-create-form.modal-description">
				<Trans>Create a community for you and your friends to chat.</Trans>
			</Modal.Description>
			{streamerAvailable && (
				<div
					className={styles.streamerSection}
					data-flx="guild.add-guild-modal.guild-create-form.streamer-kind-section"
				>
					<div
						className={styles.streamerLabel}
						data-flx="guild.add-guild-modal.guild-create-form.streamer-kind-label"
					>
						{i18n._(WHAT_KIND_OF_COMMUNITY_DESCRIPTOR)}
					</div>
					<div
						className={styles.streamerTypeOptions}
						data-flx="guild.add-guild-modal.guild-create-form.streamer-kind-options"
					>
						{GUILD_CREATE_KIND_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								className={
									kind === option.value
										? `${styles.streamerTypeOption} ${styles.streamerTypeOptionSelected}`
										: styles.streamerTypeOption
								}
								onClick={() => setKind(option.value)}
								data-flx={`guild.add-guild-modal.guild-create-form.streamer-kind.${option.value}`}
							>
								{i18n._(option.descriptor)}
							</button>
						))}
					</div>
				</div>
			)}
			<Form
				form={form}
				onSubmit={handleSubmit}
				id={formId}
				aria-label={i18n._(CREATE_COMMUNITY_FORM_DESCRIPTOR)}
				data-flx="guild.add-guild-modal.guild-create-form.form.submit"
			>
				{renderGuildCreateFields({
					...iconField,
					i18n,
					form: form,
					dataFlx: 'guild.add-guild-modal.guild-create-form',
					iconSectionDataFlx: 'guild.add-guild-modal.guild-create-form.icon-section',
					nameInputDataFlx: 'guild.add-guild-modal.guild-create-form.input.text',
					showIconError: true,
				})}
			</Form>
			{streamerAvailable && kind === 'streamer' && (
				<StreamerCreateFields
					onLinksChange={setStreamerLinks}
					dataFlx="guild.add-guild-modal.guild-create-form"
				/>
			)}
		</div>
	);
});
