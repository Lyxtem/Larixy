// SPDX-License-Identifier: AGPL-3.0-or-later

import {generateKeyPairSync} from 'node:crypto';
import {existsSync} from 'node:fs';
import type {UserID} from '@app/api/BrandedTypes';
import {buildAPIConfigFromMaster, initializeConfig} from '@app/api/Config';
import {setInjectedMessageResponseDataService} from '@app/api/channel/services/message/MessageResponseDataService';
import type {APIConfig} from '@app/api/config/APIConfig';
import {
	resetCassandraQueryExecutorForTesting,
	setCassandraQueryExecutorForTesting,
	shutdownCassandraQueryExecutorForTesting,
} from '@app/api/database/CassandraQueryExecution';
import type {
	AppAttestAgeAccepted,
	AppAttestChallengeIssued,
	AppAttestOutcome,
	IUsersServiceClient,
	PlayIntegrityOutcome,
} from '@app/api/infrastructure/UsersServiceClient';
import {setInjectedUsersServiceClient} from '@app/api/infrastructure/UsersServiceClient';
import {initializeLogger} from '@app/api/Logger';
import {setInjectedKVProvider, setInjectedSnowflakeService} from '@app/api/middleware/ServiceRegistry';
import {getInstanceConfigRepository, getUserRepository} from '@app/api/middleware/ServiceSingletons';
import {drainSearchTasks, enableSearchTaskTracking} from '@app/api/search/SearchTaskTracker';
import {InMemoryCassandraQueryExecutor} from '@app/api/test/InMemoryCassandraQueryExecutor';
import {MockSnowflakeService} from '@app/api/test/mocks/MockSnowflakeService';
import {NoopLogger} from '@app/api/test/mocks/NoopLogger';
import {RepositoryBackedMessageResponseDataService} from '@app/api/test/mocks/RepositoryBackedMessageResponseDataService';
import {server} from '@app/api/test/msw/server';
import {mapUserToPartialResponse} from '@app/api/user/UserMappers';
import {loadConfig} from '@larixy/config/src/ConfigLoader';
import type {UserPartialResponse} from '@larixy/schema/src/domains/user/UserResponseSchemas';
import {MockKVProvider} from '@pkgs/kv_client/src/testing/MockKVProvider';
import {afterAll, afterEach, beforeAll} from 'vitest';

function defaultNatsUrl(): string {
	return `nats://${existsSync('/.dockerenv') ? 'nats' : '127.0.0.1'}:4222`;
}

function setDefaultTestEnv(): void {
	// API tests use a non-self-hosted baseline; self-hosted scenarios override the loaded config explicitly.
	process.env.LARIXY_SELF_HOSTED = 'false';

	const natsUrl = defaultNatsUrl();
	const defaults: Record<string, string> = {
		LARIXY_ENV: 'test',
		LARIXY_BASE_DOMAIN: 'localhost',
		LARIXY_PUBLIC_SCHEME: 'http',
		LARIXY_PUBLIC_PORT: '8088',
		LARIXY_TRUST_CLIENT_IP_HEADER: 'true',
		LARIXY_CLIENT_IP_HEADER_NAME: 'x-forwarded-for',
		LARIXY_CASSANDRA_HOSTS: '127.0.0.1',
		LARIXY_CASSANDRA_PORT: '9042',
		LARIXY_CASSANDRA_KEYSPACE: 'larixy_test',
		LARIXY_CASSANDRA_LOCAL_DC: 'datacenter1',
		LARIXY_CASSANDRA_USERNAME: 'cassandra',
		LARIXY_CASSANDRA_PASSWORD: 'cassandra',
		LARIXY_KV_URL: 'redis://127.0.0.1:6379/0',
		LARIXY_NATS_URL: natsUrl,
		LARIXY_NATS_CORE_URL: natsUrl,
		LARIXY_NATS_JETSTREAM_URL: natsUrl,
		LARIXY_INTERNAL_MEDIA_PROXY_ENDPOINT: 'http://127.0.0.1:8088/media',
		LARIXY_S3_ENDPOINT: 'http://127.0.0.1:3900',
		LARIXY_S3_REGION: 'local',
		LARIXY_S3_ACCESS_KEY_ID: 'test',
		LARIXY_S3_SECRET_ACCESS_KEY: 'test',
		LARIXY_API_PRESIGNED_ATTACHMENT_UPLOADS_ENABLED: 'false',
		LARIXY_MEDIA_PROXY_SECRET_KEY: 'test-media-secret',
		LARIXY_MEDIA_PROXY_ATTACHMENT_URL_SECRETS_BASE64: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=',
		LARIXY_ADMIN_SECRET_KEY_BASE: 'test-admin-secret',
		LARIXY_ADMIN_OAUTH_CLIENT_SECRET: 'test-admin-oauth-secret',
		LARIXY_ADMIN_SSO_ISSUER: 'https://1.1.1.1/admin-sso',
		LARIXY_ADMIN_SSO_CLIENT_ID: 'admin-sso-test-client',
		LARIXY_GATEWAY_RPC_AUTH_TOKEN: 'test-gateway-rpc-token',
		LARIXY_SUDO_MODE_SECRET: 'test-sudo-secret',
		LARIXY_CONNECTION_INITIATION_SECRET: 'test-connection-secret',
		LARIXY_VAPID_PUBLIC_KEY: 'BB76bTFIuoqmxJtTfZX0yGTn1f_qu9H03B_nkj8OyExJFkN7Y-HBZZzShnHZoEhXKc5ZRy3jFu7OkBbnaQG-4aw',
		LARIXY_VAPID_PRIVATE_KEY: 'Xgi-3P8J-I3Q6U1HlCcXMuc_tKLGAM9nIfznX3Hz68o',
		LARIXY_VAPID_EMAIL: 'test@example.com',
		LARIXY_PASSKEY_RP_NAME: 'Larixy Test',
		LARIXY_PASSKEY_RP_ID: 'localhost',
		LARIXY_PASSKEY_ADDITIONAL_ALLOWED_ORIGINS: 'http://localhost',
		LARIXY_EMAIL_ENABLED: 'true',
		LARIXY_EMAIL_PROVIDER: 'smtp',
		LARIXY_EMAIL_FROM_EMAIL: 'noreply@example.com',
		LARIXY_EMAIL_SMTP_HOST: 'localhost',
		LARIXY_EMAIL_SMTP_PORT: '1025',
		LARIXY_EMAIL_SMTP_USERNAME: 'test',
		LARIXY_EMAIL_SMTP_PASSWORD: 'test',
		LARIXY_EMAIL_SMTP_TLS_MODE: 'none',
		LARIXY_LIVEKIT_ENABLED: 'false',
		LARIXY_STRIPE_ENABLED: 'true',
		LARIXY_SEARCH_ENGINE: 'elasticsearch',
		LARIXY_SEARCH_URL: 'http://127.0.0.1:9200',
		LARIXY_SEARCH_API_KEY: 'test',
		LARIXY_DISCOVERY_ENABLED: 'true',
		LARIXY_RELAX_REGISTRATION_RATE_LIMITS: 'true',
		LARIXY_DISABLE_RATE_LIMITS: 'true',
		LARIXY_TEST_MODE_ENABLED: 'true',
	};
	for (const [key, value] of Object.entries(defaults)) {
		process.env[key] ??= value;
	}
}

class RepositoryBackedUsersServiceClient implements IUsersServiceClient {
	async getUserPartialResponses(userIds: Array<UserID>): Promise<Map<UserID, UserPartialResponse>> {
		const userRepository = getUserRepository();
		const result = new Map<UserID, UserPartialResponse>();
		for (const userId of userIds) {
			const user = await userRepository.findUnique(userId);
			if (user) {
				result.set(userId, mapUserToPartialResponse(user));
			}
		}
		return result;
	}

	async invalidateUserCache(_userId: UserID): Promise<void> {}

	async appAttestCreateChallenge(): Promise<AppAttestOutcome<AppAttestChallengeIssued>> {
		return {ok: false, code: 'not_configured'};
	}

	async appAttestRegisterKey(): Promise<AppAttestOutcome<true>> {
		return {ok: false, code: 'not_configured'};
	}

	async appAttestSubmitAge(): Promise<AppAttestOutcome<AppAttestAgeAccepted>> {
		return {ok: false, code: 'not_configured'};
	}

	async playIntegrityCreateChallenge(): Promise<PlayIntegrityOutcome<AppAttestChallengeIssued>> {
		return {ok: false, code: 'not_configured'};
	}

	async playIntegritySubmitAge(): Promise<PlayIntegrityOutcome<AppAttestAgeAccepted>> {
		return {ok: false, code: 'not_configured'};
	}
}

setDefaultTestEnv();
process.env.LARIXY_MEDIA_PROXY_UPLOAD_RELAY_SECRET_BASE64 ??= 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=';

function generateTestPrivateKeyPem(type: 'ec' | 'rsa'): string {
	const {privateKey} =
		type === 'ec'
			? generateKeyPairSync('ec', {namedCurve: 'prime256v1'})
			: generateKeyPairSync('rsa', {modulusLength: 2048});
	return privateKey.export({format: 'pem', type: 'pkcs8'}).toString();
}

const master = await loadConfig();
const apiConfig = buildAPIConfigFromMaster(master);
const testApiConfig: APIConfig = {
	...apiConfig,
	auth: {
		...apiConfig.auth,
		passkeys: {
			...apiConfig.auth.passkeys,
			rpId: 'localhost',
			allowedOrigins: ['http://localhost'],
		},
	},
	voice: {
		...apiConfig.voice,
		enabled: false,
	},
	stripe: {
		...apiConfig.stripe,
		enabled: true,
		secretKey: 'sk_test_larixy',
		webhookSecret: 'whsec_test_larixy',
	},
	appStore: {
		...apiConfig.appStore,
		enabled: true,
		issuerId: '57246542-96fe-1a63-e053-0824d011072a',
		keyId: 'LARIXYTEST',
		privateKey: generateTestPrivateKeyPem('ec'),
		privateKeyPath: undefined,
		apps: [{bundleId: 'com.larixy', appAppleId: 1234567890}],
		products: {
			'com.larixy.plutonium.monthly': 'monthly',
			'com.larixy.plutonium.yearly': 'yearly',
			'com.larixy.gift.1month': 'gift_1_month',
			'com.larixy.gift.1year': 'gift_1_year',
		},
	},
	googlePlay: {
		...apiConfig.googlePlay,
		enabled: true,
		packages: ['com.larixy'],
		clientEmail: 'play-billing@larixy-test.iam.gserviceaccount.com',
		privateKey: generateTestPrivateKeyPem('rsa'),
		privateKeyPath: undefined,
		serviceAccountJsonPath: undefined,
		tokenUri: 'https://oauth2.googleapis.com/token',
		products: {
			'plutonium:monthly': 'monthly',
			'plutonium:yearly': 'yearly',
			gift_1_month: 'gift_1_month',
			gift_1_year: 'gift_1_year',
		},
		pushAudience: 'https://api.larixy.test/webhooks/google-play',
		pushServiceAccountEmail: 'rtdn@larixy-test.iam.gserviceaccount.com',
	},
	storeBilling: {
		sandboxUserIds: [],
		sandboxEntitlesAll: false,
		sandboxSubscriptions: false,
	},
};
testApiConfig.dev.relaxRegistrationRateLimits = true;
testApiConfig.dev.disableRateLimits = true;
testApiConfig.dev.testModeEnabled = true;

initializeConfig(testApiConfig);

const bootstrapLogger = new NoopLogger();

initializeLogger(bootstrapLogger);

setCassandraQueryExecutorForTesting(new InMemoryCassandraQueryExecutor());

setInjectedKVProvider(new MockKVProvider());
setInjectedSnowflakeService(new MockSnowflakeService({startTimestampMs: Date.now()}));
setInjectedUsersServiceClient(new RepositoryBackedUsersServiceClient());
setInjectedMessageResponseDataService(new RepositoryBackedMessageResponseDataService());

enableSearchTaskTracking();

beforeAll(async () => {
	server.listen({
		onUnhandledRequest: 'error',
	});
});

afterEach(async () => {
	await drainSearchTasks();
	resetCassandraQueryExecutorForTesting();
	getInstanceConfigRepository().clearCacheForTesting();
	server.resetHandlers();
});

afterAll(async () => {
	server.close();
	await shutdownCassandraQueryExecutorForTesting();
});
