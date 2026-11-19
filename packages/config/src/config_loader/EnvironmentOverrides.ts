// SPDX-License-Identifier: AGPL-3.0-or-later

import {readFileSync} from 'node:fs';
import {type ConfigObject, isConfigObject} from '@larixy/config/src/config_loader/ConfigObject';

type ConfigPathKey = string | number;
type ConfigContainer = ConfigObject | Array<unknown>;

type EnvValueParser = (raw: string) => unknown;

interface NamedEnvOverride {
	path: Array<ConfigPathKey>;
	parse?: EnvValueParser;
}

const NAMED_LARIXY_ENV_OVERRIDES: Record<string, NamedEnvOverride> = {
	LARIXY_ENV: {path: ['env']},
	LARIXY_BASE_DOMAIN: {path: ['domain', 'base_domain']},
	LARIXY_PUBLIC_ORIGIN: {path: ['domain', 'public_origin']},
	LARIXY_PUBLIC_SCHEME: {path: ['domain', 'public_scheme']},
	LARIXY_PUBLIC_PORT: {path: ['domain', 'public_port'], parse: parseInteger},
	LARIXY_STATIC_CDN_DOMAIN: {path: ['domain', 'static_cdn_domain']},
	LARIXY_INVITE_DOMAIN: {path: ['domain', 'invite_domain']},
	LARIXY_GIFT_DOMAIN: {path: ['domain', 'gift_domain']},
	LARIXY_API_ENDPOINT: {path: ['endpoint_overrides', 'api']},
	LARIXY_API_CLIENT_ENDPOINT: {path: ['endpoint_overrides', 'api_client']},
	LARIXY_APP_ENDPOINT: {path: ['endpoint_overrides', 'app']},
	LARIXY_GATEWAY_ENDPOINT: {path: ['endpoint_overrides', 'gateway']},
	LARIXY_MEDIA_ENDPOINT: {path: ['endpoint_overrides', 'media']},
	LARIXY_STATIC_CDN_ENDPOINT: {path: ['endpoint_overrides', 'static_cdn']},
	LARIXY_ADMIN_ENDPOINT: {path: ['endpoint_overrides', 'admin']},
	LARIXY_MARKETING_ENDPOINT: {path: ['endpoint_overrides', 'marketing']},
	LARIXY_INVITE_ENDPOINT: {path: ['endpoint_overrides', 'invite']},
	LARIXY_GIFT_ENDPOINT: {path: ['endpoint_overrides', 'gift']},
	LARIXY_TRUST_CLIENT_IP_HEADER: {path: ['proxy', 'trust_client_ip_header'], parse: parseBoolean},
	LARIXY_CLIENT_IP_HEADER_NAME: {path: ['proxy', 'client_ip_header']},
	LARIXY_CASSANDRA_HOSTS: {path: ['database', 'cassandra', 'hosts'], parse: parseCsv},
	LARIXY_CASSANDRA_PORT: {path: ['database', 'cassandra', 'port'], parse: parseInteger},
	LARIXY_CASSANDRA_KEYSPACE: {path: ['database', 'cassandra', 'keyspace']},
	LARIXY_CASSANDRA_LOCAL_DC: {path: ['database', 'cassandra', 'local_dc']},
	LARIXY_CASSANDRA_CONSISTENCY: {path: ['database', 'cassandra', 'consistency']},
	LARIXY_CASSANDRA_SERIAL_CONSISTENCY: {path: ['database', 'cassandra', 'serial_consistency']},
	LARIXY_CASSANDRA_USERNAME: {path: ['database', 'cassandra', 'username']},
	LARIXY_CASSANDRA_PASSWORD: {path: ['database', 'cassandra', 'password']},
	LARIXY_POSTGRES_URL: {path: ['database', 'postgres', 'url']},
	LARIXY_POSTGRES_HOST: {path: ['database', 'postgres', 'host']},
	LARIXY_POSTGRES_PORT: {path: ['database', 'postgres', 'port'], parse: parseInteger},
	LARIXY_POSTGRES_DATABASE: {path: ['database', 'postgres', 'database']},
	LARIXY_POSTGRES_USERNAME: {path: ['database', 'postgres', 'username']},
	LARIXY_POSTGRES_PASSWORD: {path: ['database', 'postgres', 'password']},
	LARIXY_POSTGRES_SSL: {path: ['database', 'postgres', 'ssl'], parse: parseBoolean},
	LARIXY_POSTGRES_SSL_CA: {path: ['database', 'postgres', 'ssl_ca']},
	LARIXY_POSTGRES_MAX_CONNECTIONS: {path: ['database', 'postgres', 'max_connections'], parse: parseInteger},
	LARIXY_POSTGRES_KV_TABLE: {path: ['database', 'postgres', 'kv_table']},
	LARIXY_POSTGRES_PREPARED_STATEMENTS: {path: ['database', 'postgres', 'prepared_statements'], parse: parseBoolean},
	LARIXY_DATABASE_BACKEND: {path: ['database', 'backend']},
	LARIXY_KV_URL: {path: ['internal', 'kv']},
	LARIXY_KV_MODE: {path: ['internal', 'kv_mode']},
	LARIXY_KV_POSTGRES_MAX_CONNECTIONS: {path: ['internal', 'kv_postgres', 'max_connections'], parse: parseInteger},
	LARIXY_KV_POSTGRES_MAX_BYTES: {path: ['internal', 'kv_postgres', 'max_bytes'], parse: parseInteger},
	LARIXY_STORAGE_BACKEND: {path: ['storage', 'backend']},
	LARIXY_STORAGE_ROOT: {path: ['storage', 'root']},
	LARIXY_STORAGE_UPLOADS_TTL: {path: ['storage', 'uploads_ttl']},
	LARIXY_STORAGE_READ_ONLY: {path: ['storage', 'read_only'], parse: parseBoolean},
	LARIXY_INTERNAL_MEDIA_PROXY_ENDPOINT: {path: ['internal', 'media_proxy']},
	LARIXY_S3_ENDPOINT: {path: ['s3', 'endpoint']},
	LARIXY_S3_PUBLIC_ENDPOINT: {path: ['s3', 'presigned_url_base']},
	LARIXY_S3_FORCE_PATH_STYLE: {path: ['s3', 'force_path_style'], parse: parseBoolean},
	LARIXY_S3_REGION: {path: ['s3', 'region']},
	LARIXY_S3_ACCESS_KEY_ID: {path: ['s3', 'access_key_id']},
	LARIXY_S3_SECRET_ACCESS_KEY: {path: ['s3', 'secret_access_key']},
	LARIXY_S3_BUCKET_CDN: {path: ['s3', 'buckets', 'cdn']},
	LARIXY_S3_BUCKET_UPLOADS: {path: ['s3', 'buckets', 'uploads']},
	LARIXY_S3_BUCKET_REPORTS: {path: ['s3', 'buckets', 'reports']},
	LARIXY_S3_BUCKET_HARVESTS: {path: ['s3', 'buckets', 'harvests']},
	LARIXY_NATS_URL: {path: ['services', 'nats', 'core_url']},
	LARIXY_NATS_JETSTREAM_URL: {path: ['services', 'nats', 'jetstream_url']},
	LARIXY_NATS_AUTH_TOKEN: {path: ['services', 'nats', 'auth_token']},
	LARIXY_API_PORT: {path: ['services', 'api', 'port'], parse: parseInteger},
	LARIXY_API_HOST: {path: ['services', 'api', 'host']},
	LARIXY_API_HEADERS_TIMEOUT_MS: {path: ['services', 'api', 'headers_timeout_ms'], parse: parseInteger},
	LARIXY_API_REQUEST_TIMEOUT_MS: {path: ['services', 'api', 'request_timeout_ms'], parse: parseInteger},
	LARIXY_API_MAX_INFLIGHT_REQUESTS: {path: ['services', 'api', 'max_inflight_requests'], parse: parseInteger},
	LARIXY_API_MAX_CONCURRENT_FORM_UPLOADS: {
		path: ['services', 'api', 'max_concurrent_form_uploads'],
		parse: parseInteger,
	},
	LARIXY_API_AUTOMATED_MESSAGE_DELETION_DELAY_DAYS: {
		path: ['services', 'api', 'automated_message_deletion_delay_days'],
		parse: parseInteger,
	},
	LARIXY_API_IP_BAN_EXEMPT_IPS: {path: ['services', 'api', 'ip_ban_exempt_ips'], parse: parseCsv},
	LARIXY_API_DONATION_PROXY_KEY: {path: ['services', 'api', 'donation_proxy_key']},
	LARIXY_API_TRUSTED_CALLERS: {path: ['services', 'api', 'trusted_callers'], parse: parseJsonArray},
	LARIXY_API_PRESIGNED_ATTACHMENT_UPLOADS_ENABLED: {
		path: ['services', 'api', 'presigned_attachment_uploads_enabled'],
		parse: parseBoolean,
	},
	LARIXY_API_PRESIGNED_HARVEST_DOWNLOADS_ENABLED: {
		path: ['services', 'api', 'presigned_harvest_downloads_enabled'],
		parse: parseBoolean,
	},
	LARIXY_API_WORKER_MODE: {path: ['services', 'api', 'worker', 'mode']},
	LARIXY_API_WORKER_LANE: {path: ['services', 'api', 'worker', 'lane']},
	LARIXY_API_WORKER_TASK: {path: ['services', 'api', 'worker', 'task']},
	LARIXY_API_WORKER_ENABLE_CRON_SCHEDULER: {
		path: ['services', 'api', 'worker', 'enable_cron_scheduler'],
		parse: parseBoolean,
	},
	LARIXY_API_WORKER_METRICS_PORT: {path: ['services', 'api', 'worker', 'metrics_port'], parse: parseInteger},
	LARIXY_API_EMBEDDED_WORKER: {path: ['services', 'api', 'worker', 'embedded'], parse: parseBoolean},
	LARIXY_API_WORKER_LANE_CONCURRENCY_OVERRIDES: {
		path: ['services', 'api', 'worker', 'lane_concurrency_overrides'],
		parse: parseJsonObject,
	},
	LARIXY_API_STORAGE_CHANGE_FEED_ENABLED: {
		path: ['services', 'api', 'storage_change_feed', 'enabled'],
		parse: parseBoolean,
	},
	LARIXY_API_STORAGE_CHANGE_FEED_STREAM: {path: ['services', 'api', 'storage_change_feed', 'stream']},
	LARIXY_API_STORAGE_CHANGE_FEED_SKIP_BUCKETS: {
		path: ['services', 'api', 'storage_change_feed', 'skip_buckets'],
		parse: parseBucketList,
	},
	LARIXY_API_UNFURL_IGNORED_HOSTS: {path: ['services', 'api', 'unfurl_ignored_hosts'], parse: parseCsv},
	LARIXY_APP_ORIGIN_ALIASES: {path: ['services', 'api', 'app_origin_aliases'], parse: parseCsv},
	LARIXY_API_DISCOVERY_PUBLIC_ENDPOINT: {path: ['services', 'api', 'discovery_public_endpoint']},
	LARIXY_API_DISCOVERY_TRANSPORT_ENDPOINT: {path: ['services', 'api', 'discovery_transport_endpoint']},
	LARIXY_MEDIA_PROXY_SECRET_KEY: {path: ['services', 'media_proxy', 'secret_key']},
	LARIXY_MEDIA_PROXY_UPLOAD_RELAY_ENDPOINT: {path: ['services', 'media_proxy', 'upload_relay', 'endpoint']},
	LARIXY_MEDIA_PROXY_UPLOAD_RELAY_SECRET_BASE64: {path: ['services', 'media_proxy', 'upload_relay', 'secret_base64']},
	LARIXY_MEDIA_PROXY_UPLOAD_RELAY_MAX_BODY_BYTES: {
		path: ['services', 'media_proxy', 'upload_relay', 'max_body_bytes'],
		parse: parseInteger,
	},
	LARIXY_MEDIA_PROXY_UPLOAD_RELAY_TOKEN_TTL_SECS: {
		path: ['services', 'media_proxy', 'upload_relay', 'token_ttl_secs'],
		parse: parseInteger,
	},
	LARIXY_MEDIA_PROXY_UPLOAD_RELAY_KEEP_DIRECT_COUNTRIES: {
		path: ['services', 'media_proxy', 'upload_relay', 'keep_direct_countries'],
		parse: parseCsv,
	},
	LARIXY_MEDIA_PROXY_ATTACHMENT_URL_SECRETS_BASE64: {
		path: ['services', 'media_proxy', 'attachment_urls', 'secrets_base64'],
		parse: parseCsv,
	},
	LARIXY_ADMIN_SECRET_KEY_BASE: {path: ['services', 'admin', 'secret_key_base']},
	LARIXY_ADMIN_OAUTH_CLIENT_SECRET: {path: ['services', 'admin', 'oauth_client_secret']},
	LARIXY_ADMIN_SSO_ISSUER: {path: ['services', 'admin', 'sso', 'issuer']},
	LARIXY_ADMIN_SSO_CLIENT_ID: {path: ['services', 'admin', 'sso', 'client_id']},
	LARIXY_GATEWAY_RPC_AUTH_TOKEN: {path: ['services', 'gateway', 'rpc_auth_token']},
	LARIXY_SUDO_MODE_SECRET: {path: ['auth', 'sudo_mode_secret']},
	LARIXY_CONNECTION_INITIATION_SECRET: {path: ['auth', 'connection_initiation_secret']},
	LARIXY_PROFILE_PSEUDONYM_SECRET: {path: ['auth', 'profile_pseudonym_secret']},
	LARIXY_SSO_ALLOW_PRIVATE_ADDRESSES: {path: ['auth', 'sso_allow_private_addresses'], parse: parseBoolean},
	LARIXY_VAPID_PUBLIC_KEY: {path: ['auth', 'vapid', 'public_key']},
	LARIXY_VAPID_PRIVATE_KEY: {path: ['auth', 'vapid', 'private_key']},
	LARIXY_VAPID_EMAIL: {path: ['auth', 'vapid', 'email']},
	LARIXY_PASSKEY_RP_NAME: {path: ['auth', 'passkeys', 'rp_name']},
	LARIXY_PASSKEY_RP_ID: {path: ['auth', 'passkeys', 'rp_id']},
	LARIXY_PASSKEY_ADDITIONAL_ALLOWED_ORIGINS: {
		path: ['auth', 'passkeys', 'additional_allowed_origins'],
		parse: parsePasskeyOrigins,
	},
	LARIXY_AUTH_BLUESKY_ENABLED: {path: ['auth', 'bluesky', 'enabled'], parse: parseBoolean},
	LARIXY_AUTH_BLUESKY_CLIENT_NAME: {path: ['auth', 'bluesky', 'client_name']},
	LARIXY_AUTH_BLUESKY_CLIENT_URI: {path: ['auth', 'bluesky', 'client_uri']},
	LARIXY_AUTH_BLUESKY_LOGO_URI: {path: ['auth', 'bluesky', 'logo_uri']},
	LARIXY_AUTH_BLUESKY_TOS_URI: {path: ['auth', 'bluesky', 'tos_uri']},
	LARIXY_AUTH_BLUESKY_POLICY_URI: {path: ['auth', 'bluesky', 'policy_uri']},
	LARIXY_AUTH_BLUESKY_KEYS: {path: ['auth', 'bluesky', 'keys'], parse: parseJsonArray},
	LARIXY_EMAIL_ENABLED: {path: ['integrations', 'email', 'enabled'], parse: parseBoolean},
	LARIXY_EMAIL_PROVIDER: {path: ['integrations', 'email', 'provider']},
	LARIXY_EMAIL_DELIVERY: {path: ['integrations', 'email', 'delivery']},
	LARIXY_EMAIL_FROM_EMAIL: {path: ['integrations', 'email', 'from_email']},
	LARIXY_EMAIL_FROM_NAME: {path: ['integrations', 'email', 'from_name']},
	LARIXY_EMAIL_REPLY_TO_EMAIL: {path: ['integrations', 'email', 'reply_to_email']},
	LARIXY_EMAIL_SUPPORT_ALERT_EMAIL: {path: ['integrations', 'email', 'support_alert_email']},
	LARIXY_EMAIL_APP_BASE_URL: {path: ['integrations', 'email', 'app_base_url']},
	LARIXY_EMAIL_WEBHOOK_SECRET: {path: ['integrations', 'email', 'webhook_secret']},
	LARIXY_EMAIL_SMTP_HOST: {path: ['integrations', 'email', 'smtp', 'host']},
	LARIXY_EMAIL_SMTP_PORT: {path: ['integrations', 'email', 'smtp', 'port'], parse: parseInteger},
	LARIXY_EMAIL_SMTP_USERNAME: {path: ['integrations', 'email', 'smtp', 'username']},
	LARIXY_EMAIL_SMTP_PASSWORD: {path: ['integrations', 'email', 'smtp', 'password']},
	LARIXY_EMAIL_SMTP_TLS_MODE: {path: ['integrations', 'email', 'smtp', 'tls_mode'], parse: parseSmtpTlsMode},
	LARIXY_EMAIL_SMTP_SECURE: {path: ['integrations', 'email', 'smtp', 'secure'], parse: parseBoolean},
	LARIXY_EMAIL_FALLBACK_DOMAINS: {path: ['integrations', 'email', 'fallback', 'domains'], parse: parseCsv},
	LARIXY_EMAIL_FALLBACK_SMTP_HOST: {path: ['integrations', 'email', 'fallback', 'smtp', 'host']},
	LARIXY_EMAIL_FALLBACK_SMTP_PORT: {path: ['integrations', 'email', 'fallback', 'smtp', 'port'], parse: parseInteger},
	LARIXY_EMAIL_FALLBACK_SMTP_USERNAME: {path: ['integrations', 'email', 'fallback', 'smtp', 'username']},
	LARIXY_EMAIL_FALLBACK_SMTP_PASSWORD: {path: ['integrations', 'email', 'fallback', 'smtp', 'password']},
	LARIXY_EMAIL_FALLBACK_SMTP_TLS_MODE: {
		path: ['integrations', 'email', 'fallback', 'smtp', 'tls_mode'],
		parse: parseSmtpTlsMode,
	},
	LARIXY_EMAIL_FALLBACK_SMTP_HEADERS: {
		path: ['integrations', 'email', 'fallback', 'smtp', 'headers'],
		parse: parseJsonObject,
	},
	LARIXY_LIVEKIT_ENABLED: {path: ['integrations', 'voice', 'enabled'], parse: parseBoolean},
	LARIXY_LIVEKIT_API_KEY: {path: ['integrations', 'voice', 'api_key']},
	LARIXY_LIVEKIT_API_SECRET: {path: ['integrations', 'voice', 'api_secret']},
	LARIXY_LIVEKIT_URL: {path: ['integrations', 'voice', 'url']},
	LARIXY_LIVEKIT_INTERNAL_URL: {path: ['integrations', 'voice', 'internal_url']},
	LARIXY_LIVEKIT_BUNDLED: {path: ['integrations', 'voice', 'bundled'], parse: parseBoolean},
	LARIXY_LIVEKIT_DEFAULT_REGION: {path: ['integrations', 'voice', 'default_region'], parse: parseJsonObject},
	LARIXY_VOICE_P2P_STUN_URLS: {path: ['integrations', 'voice', 'p2p_stun_urls'], parse: parseCsv},
	LARIXY_LIVEKIT_TURN_SERVERS: {path: ['integrations', 'voice', 'turn_servers'], parse: parseTurnServers},
	LARIXY_VOICE_JOIN_ALLOW_PRIVATE_ENDPOINTS: {
		path: ['integrations', 'voice', 'join_allow_private_endpoints'],
		parse: parseBoolean,
	},
	LARIXY_VOICE_HEALTH_INTERVAL_MS: {path: ['integrations', 'voice', 'health_interval_ms'], parse: parseInteger},
	LARIXY_VOICE_PARTICIPANT_SWEEP_ENABLED: {
		path: ['integrations', 'voice', 'participant_sweep_enabled'],
		parse: parseBoolean,
	},
	LARIXY_VOICE_PARTICIPANT_SWEEP_DRY_RUN: {
		path: ['integrations', 'voice', 'participant_sweep_dry_run'],
		parse: parseBoolean,
	},
	LARIXY_SEARCH_ENGINE: {path: ['integrations', 'search', 'engine']},
	LARIXY_SEARCH_URL: {path: ['integrations', 'search', 'url']},
	LARIXY_SEARCH_API_KEY: {path: ['integrations', 'search', 'api_key']},
	LARIXY_SEARCH_USERNAME: {path: ['integrations', 'search', 'username']},
	LARIXY_SEARCH_PASSWORD: {path: ['integrations', 'search', 'password']},
	LARIXY_SEARCH_TLS_REJECT_UNAUTHORIZED: {
		path: ['integrations', 'search', 'tls_reject_unauthorized'],
		parse: parseBoolean,
	},
	LARIXY_STRIPE_ENABLED: {path: ['integrations', 'stripe', 'enabled'], parse: parseBoolean},
	LARIXY_STRIPE_SECRET_KEY: {path: ['integrations', 'stripe', 'secret_key']},
	LARIXY_STRIPE_WEBHOOK_SECRET: {path: ['integrations', 'stripe', 'webhook_secret']},
	LARIXY_STRIPE_PRICES: {path: ['integrations', 'stripe', 'prices'], parse: parseJsonObject},
	LARIXY_STRIPE_LEGACY_PRICES: {path: ['integrations', 'stripe', 'legacy_prices'], parse: parseJsonObject},
	LARIXY_STRIPE_PRICE_MONTHLY_USD: {path: ['integrations', 'stripe', 'prices', 'monthly_usd']},
	LARIXY_STRIPE_PRICE_MONTHLY_EUR: {path: ['integrations', 'stripe', 'prices', 'monthly_eur']},
	LARIXY_STRIPE_PRICE_MONTHLY_BRL: {path: ['integrations', 'stripe', 'prices', 'monthly_brl']},
	LARIXY_STRIPE_PRICE_MONTHLY_DKK: {path: ['integrations', 'stripe', 'prices', 'monthly_dkk']},
	LARIXY_STRIPE_PRICE_MONTHLY_INR: {path: ['integrations', 'stripe', 'prices', 'monthly_inr']},
	LARIXY_STRIPE_PRICE_MONTHLY_ISK: {path: ['integrations', 'stripe', 'prices', 'monthly_isk']},
	LARIXY_STRIPE_PRICE_MONTHLY_NOK: {path: ['integrations', 'stripe', 'prices', 'monthly_nok']},
	LARIXY_STRIPE_PRICE_MONTHLY_PLN: {path: ['integrations', 'stripe', 'prices', 'monthly_pln']},
	LARIXY_STRIPE_PRICE_MONTHLY_SEK: {path: ['integrations', 'stripe', 'prices', 'monthly_sek']},
	LARIXY_STRIPE_PRICE_MONTHLY_TRY: {path: ['integrations', 'stripe', 'prices', 'monthly_try']},
	LARIXY_STRIPE_PRICE_YEARLY_USD: {path: ['integrations', 'stripe', 'prices', 'yearly_usd']},
	LARIXY_STRIPE_PRICE_YEARLY_EUR: {path: ['integrations', 'stripe', 'prices', 'yearly_eur']},
	LARIXY_STRIPE_PRICE_YEARLY_BRL: {path: ['integrations', 'stripe', 'prices', 'yearly_brl']},
	LARIXY_STRIPE_PRICE_YEARLY_DKK: {path: ['integrations', 'stripe', 'prices', 'yearly_dkk']},
	LARIXY_STRIPE_PRICE_YEARLY_INR: {path: ['integrations', 'stripe', 'prices', 'yearly_inr']},
	LARIXY_STRIPE_PRICE_YEARLY_ISK: {path: ['integrations', 'stripe', 'prices', 'yearly_isk']},
	LARIXY_STRIPE_PRICE_YEARLY_NOK: {path: ['integrations', 'stripe', 'prices', 'yearly_nok']},
	LARIXY_STRIPE_PRICE_YEARLY_PLN: {path: ['integrations', 'stripe', 'prices', 'yearly_pln']},
	LARIXY_STRIPE_PRICE_YEARLY_SEK: {path: ['integrations', 'stripe', 'prices', 'yearly_sek']},
	LARIXY_STRIPE_PRICE_YEARLY_TRY: {path: ['integrations', 'stripe', 'prices', 'yearly_try']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_USD: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_usd']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_EUR: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_eur']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_SEK: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_sek']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_SEK: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_sek']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_DKK: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_dkk']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_DKK: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_dkk']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_NOK: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_nok']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_NOK: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_nok']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_ISK: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_isk']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_ISK: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_isk']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_BRL: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_brl']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_INR: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_inr']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_PLN: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_pln']},
	LARIXY_STRIPE_PRICE_GIFT_1_MONTH_TRY: {path: ['integrations', 'stripe', 'prices', 'gift_1_month_try']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_USD: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_usd']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_EUR: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_eur']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_BRL: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_brl']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_INR: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_inr']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_PLN: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_pln']},
	LARIXY_STRIPE_PRICE_GIFT_1_YEAR_TRY: {path: ['integrations', 'stripe', 'prices', 'gift_1_year_try']},
	LARIXY_CLAMAV_ENABLED: {path: ['integrations', 'clamav', 'enabled'], parse: parseBoolean},
	LARIXY_CLAMAV_HOST: {path: ['integrations', 'clamav', 'host']},
	LARIXY_CLAMAV_PORT: {path: ['integrations', 'clamav', 'port'], parse: parseInteger},
	LARIXY_CLAMAV_FAIL_OPEN: {path: ['integrations', 'clamav', 'fail_open'], parse: parseBoolean},
	LARIXY_KLIPY_API_KEY: {path: ['integrations', 'klipy', 'api_key']},
	LARIXY_YOUTUBE_API_KEY: {path: ['integrations', 'youtube', 'api_key']},
	LARIXY_CACHE_PURGE_ADAPTER: {path: ['integrations', 'cache_purge', 'adapter']},
	LARIXY_CACHE_PURGE_HTTP_ENDPOINT: {path: ['integrations', 'cache_purge', 'http', 'endpoint']},
	LARIXY_CACHE_PURGE_HTTP_TOKEN: {path: ['integrations', 'cache_purge', 'http', 'token']},
	LARIXY_CACHE_PURGE_HTTP_TIMEOUT_MS: {
		path: ['integrations', 'cache_purge', 'http', 'timeout_ms'],
		parse: parseInteger,
	},
	LARIXY_CACHE_PURGE_CONTROLLER_ENDPOINT: {path: ['integrations', 'cache_purge', 'controller', 'endpoint']},
	LARIXY_CACHE_PURGE_CONTROLLER_TOKEN: {path: ['integrations', 'cache_purge', 'controller', 'token']},
	LARIXY_CACHE_PURGE_CONTROLLER_TIMEOUT_MS: {
		path: ['integrations', 'cache_purge', 'controller', 'timeout_ms'],
		parse: parseInteger,
	},
	LARIXY_BLOCKLIST_FEEDS_ENABLED: {path: ['integrations', 'blocklist_feeds', 'enabled'], parse: parseBoolean},
	LARIXY_BREACHED_PASSWORD_CHECK_ENABLED: {
		path: ['integrations', 'breached_password_check', 'enabled'],
		parse: parseBoolean,
	},
	LARIXY_APP_STORE_ENABLED: {path: ['integrations', 'app_store', 'enabled'], parse: parseBoolean},
	LARIXY_APP_STORE_ISSUER_ID: {path: ['integrations', 'app_store', 'issuer_id']},
	LARIXY_APP_STORE_KEY_ID: {path: ['integrations', 'app_store', 'key_id']},
	LARIXY_APP_STORE_PRIVATE_KEY: {path: ['integrations', 'app_store', 'private_key']},
	LARIXY_APP_STORE_PRIVATE_KEY_PATH: {path: ['integrations', 'app_store', 'private_key_path']},
	LARIXY_APP_STORE_APPS: {path: ['integrations', 'app_store', 'apps'], parse: parseJsonArray},
	LARIXY_APP_STORE_PRODUCTS: {path: ['integrations', 'app_store', 'products'], parse: parseJsonObject},
	LARIXY_GOOGLE_PLAY_ENABLED: {path: ['integrations', 'google_play', 'enabled'], parse: parseBoolean},
	LARIXY_GOOGLE_PLAY_PACKAGES: {path: ['integrations', 'google_play', 'packages'], parse: parseCsv},
	LARIXY_GOOGLE_PLAY_CLIENT_EMAIL: {path: ['integrations', 'google_play', 'client_email']},
	LARIXY_GOOGLE_PLAY_PRIVATE_KEY: {path: ['integrations', 'google_play', 'private_key']},
	LARIXY_GOOGLE_PLAY_PRIVATE_KEY_PATH: {path: ['integrations', 'google_play', 'private_key_path']},
	LARIXY_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH: {path: ['integrations', 'google_play', 'service_account_json_path']},
	LARIXY_GOOGLE_PLAY_TOKEN_URI: {path: ['integrations', 'google_play', 'token_uri']},
	LARIXY_GOOGLE_PLAY_PRODUCTS: {path: ['integrations', 'google_play', 'products'], parse: parseJsonObject},
	LARIXY_GOOGLE_PLAY_PUSH_AUDIENCE: {path: ['integrations', 'google_play', 'push_audience']},
	LARIXY_GOOGLE_PLAY_PUSH_SERVICE_ACCOUNT_EMAIL: {
		path: ['integrations', 'google_play', 'push_service_account_email'],
	},
	LARIXY_GOOGLE_PLAY_SELF_SERVICE_REFUNDS: {
		path: ['integrations', 'google_play', 'self_service_refunds'],
		parse: parseBoolean,
	},
	LARIXY_STORE_BILLING_SANDBOX_USER_IDS: {path: ['integrations', 'store_billing', 'sandbox_user_ids'], parse: parseCsv},
	LARIXY_STORE_BILLING_SANDBOX_ENTITLES_ALL: {
		path: ['integrations', 'store_billing', 'sandbox_entitles_all'],
		parse: parseBoolean,
	},
	LARIXY_STORE_BILLING_SANDBOX_SUBSCRIPTIONS: {
		path: ['integrations', 'store_billing', 'sandbox_subscriptions'],
		parse: parseBoolean,
	},
	LARIXY_SELF_HOSTED: {path: ['instance', 'self_hosted'], parse: parseBoolean},
	LARIXY_AUTO_JOIN_INVITE_CODE: {path: ['instance', 'auto_join_invite_code']},
	LARIXY_VISIONARIES_GUILD_ID: {path: ['instance', 'visionaries_guild_id']},
	LARIXY_VISIONARIES_GUILD_VISIONARY_ROLE_ID: {path: ['instance', 'visionaries_guild_visionary_role_id']},
	LARIXY_LABS_GUILD_ID: {path: ['operator_pass', 'labs_guild_id']},
	LARIXY_LABS_OPERATOR_ROLE_ID: {path: ['operator_pass', 'labs_operator_role_id']},
	LARIXY_LABS_VISIONARY_ROLE_ID: {path: ['operator_pass', 'labs_visionary_role_id']},
	LARIXY_LABS_OPERATORS_CHANNEL_ID: {path: ['operator_pass', 'labs_operators_channel_id']},
	LARIXY_PAYMENT_DISPUTE_CLOSURE_EFFECTIVE_AT: {path: ['payment_disputes', 'closure_effective_at']},
	LARIXY_OPERATOR_PASS_PRICE_RISES_AT: {path: ['operator_pass', 'price_rises_at']},
	LARIXY_OPERATOR_PASS_GRACE_MINUTES: {path: ['operator_pass', 'grace_minutes'], parse: parseInteger},
	LARIXY_OPERATOR_PASS_NOW: {path: ['operator_pass', 'now_override']},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_USD: {
		path: ['operator_pass', 'standard_prices_minor', 'usd'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_EUR: {
		path: ['operator_pass', 'standard_prices_minor', 'eur'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_BRL: {
		path: ['operator_pass', 'standard_prices_minor', 'brl'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_DKK: {
		path: ['operator_pass', 'standard_prices_minor', 'dkk'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_INR: {
		path: ['operator_pass', 'standard_prices_minor', 'inr'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_NOK: {
		path: ['operator_pass', 'standard_prices_minor', 'nok'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_PLN: {
		path: ['operator_pass', 'standard_prices_minor', 'pln'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_SEK: {
		path: ['operator_pass', 'standard_prices_minor', 'sek'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_STANDARD_PRICE_TRY: {
		path: ['operator_pass', 'standard_prices_minor', 'try'],
		parse: parseInteger,
	},
	LARIXY_OPERATOR_PASS_RELEASE_LISTS: {path: ['operator_pass', 'release_lists']},
	LARIXY_OPERATOR_PASS_WITHDRAWAL_COUNTRIES: {path: ['operator_pass', 'withdrawal_countries']},
	LARIXY_OPERATOR_PASS_WALL_TIERS: {path: ['operator_pass', 'wall_tiers']},
	LARIXY_OPERATOR_PASS_MAX_QUANTITY: {path: ['operator_pass', 'max_quantity'], parse: parseInteger},
	LARIXY_OPERATOR_PASS_PRICE_BRL_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'brl'],
		parse: parseBoolean,
	},
	LARIXY_OPERATOR_PASS_PRICE_DKK_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'dkk'],
		parse: parseBoolean,
	},
	LARIXY_OPERATOR_PASS_PRICE_INR_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'inr'],
		parse: parseBoolean,
	},
	LARIXY_OPERATOR_PASS_PRICE_NOK_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'nok'],
		parse: parseBoolean,
	},
	LARIXY_OPERATOR_PASS_PRICE_PLN_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'pln'],
		parse: parseBoolean,
	},
	LARIXY_OPERATOR_PASS_PRICE_SEK_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'sek'],
		parse: parseBoolean,
	},
	LARIXY_OPERATOR_PASS_PRICE_TRY_ENABLED: {
		path: ['operator_pass', 'localized_prices_enabled', 'try'],
		parse: parseBoolean,
	},
	LARIXY_APP_PRODUCT_NAME: {path: ['instance', 'branding', 'product_name']},
	LARIXY_APP_ICON_URL: {path: ['instance', 'branding', 'icon_url']},
	LARIXY_APP_SYMBOL_URL: {path: ['instance', 'branding', 'symbol_url']},
	LARIXY_APP_LOGO_URL: {path: ['instance', 'branding', 'logo_url']},
	LARIXY_APP_WORDMARK_URL: {path: ['instance', 'branding', 'wordmark_url']},
	LARIXY_APP_FAVICON_URL: {path: ['instance', 'branding', 'favicon_url']},
	LARIXY_APP_FAVICON_DARK_URL: {path: ['instance', 'branding', 'favicon_dark_url']},
	LARIXY_APP_SIGN_IN_BACKDROP_URL: {path: ['instance', 'branding', 'sign_in_backdrop_url']},
	LARIXY_APP_THEME_COLOR: {path: ['instance', 'branding', 'theme_color']},
	LARIXY_APP_STATUS_PAGE_URL: {path: ['instance', 'branding', 'status_page_url']},
	LARIXY_APP_STATUS_PAGE_INCIDENT_HISTORY_URL: {path: ['instance', 'branding', 'status_page_incident_history_url']},
	LARIXY_INSTANCE_SETUP_CONFIGURED: {path: ['instance', 'setup', 'configured'], parse: parseBoolean},
	LARIXY_SETUP_TOKEN: {path: ['instance', 'setup', 'token']},
	LARIXY_ACCOUNT_IDENTITY: {path: ['instance', 'account_identity'], parse: parseAccountIdentity},
	LARIXY_TAG_STYLE: {path: ['instance', 'tag_style'], parse: parseTagStyle},
	LARIXY_AGE_POLICY_ENABLED: {path: ['instance', 'age_policy', 'enabled'], parse: parseBoolean},
	LARIXY_AGE_POLICY_RESTRICTED_REGIONS: {path: ['instance', 'age_policy', 'restricted_regions'], parse: parseCsv},
	LARIXY_DISCOVERY_ENABLED: {path: ['discovery', 'enabled'], parse: parseBoolean},
	LARIXY_DISCOVERY_MIN_MEMBER_COUNT: {path: ['discovery', 'min_member_count'], parse: parseInteger},
	LARIXY_DELETION_GRACE_PERIOD_HOURS: {path: ['deletion_grace_period_hours'], parse: parseInteger},
	LARIXY_REPORT_RETENTION_DAYS: {path: ['report_retention', 'days'], parse: parseInteger},
	LARIXY_REPORT_RETENTION_DRY_RUN: {path: ['report_retention', 'dry_run'], parse: parseBoolean},
	LARIXY_RELAX_REGISTRATION_RATE_LIMITS: {path: ['dev', 'relax_registration_rate_limits'], parse: parseBoolean},
	LARIXY_DISABLE_RATE_LIMITS: {path: ['dev', 'disable_rate_limits'], parse: parseBoolean},
	LARIXY_TEST_MODE_ENABLED: {path: ['dev', 'test_mode_enabled'], parse: parseBoolean},
	LARIXY_TEST_HARNESS_TOKEN: {path: ['dev', 'test_harness_token']},
	LARIXY_VALIDATE_RESPONSES: {path: ['dev', 'validate_responses'], parse: parseBoolean},
	LARIXY_GEOIP_DB_PATH: {path: ['geoip', 'maxmind_db_path']},
};

function isContainer(value: unknown): value is ConfigContainer {
	return isConfigObject(value) || Array.isArray(value);
}

function createChildContainer(nextKey: ConfigPathKey | undefined): ConfigContainer {
	return typeof nextKey === 'number' ? [] : {};
}

function getChildValue(target: ConfigContainer, key: ConfigPathKey): unknown {
	return Object.hasOwn(target, key) ? Reflect.get(target, key) : undefined;
}

function setChildValue(target: ConfigContainer, key: ConfigPathKey, value: unknown): void {
	if (key === '__proto__') {
		Object.defineProperty(target, key, {value, writable: true, enumerable: true, configurable: true});
		return;
	}
	if (Array.isArray(target) && typeof key === 'number') {
		target[key] = value;
		return;
	}
	(target as ConfigObject)[String(key)] = value;
}

function parseBoolean(raw: string): boolean {
	switch (raw.trim().toLowerCase()) {
		case 'true':
			return true;
		case 'false':
			return false;
		default:
			throw new Error('must be true or false');
	}
}

function parseAccountIdentity(raw: string): string {
	const value = raw.trim().toLowerCase();
	if (value === 'email' || value === 'username') return value;
	throw new Error('must be email or username');
}

function parseTagStyle(raw: string): string {
	const value = raw.trim().toLowerCase();
	if (value === 'none' || value === 'random') return value;
	throw new Error('must be none or random');
}

function parseSmtpTlsMode(raw: string): string {
	const value = raw.trim().toLowerCase();
	if (value === 'implicit' || value === 'starttls' || value === 'opportunistic' || value === 'none') return value;
	throw new Error('must be implicit, starttls, opportunistic or none');
}

function parseJson(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		throw new Error('must be valid JSON');
	}
}

function parseJsonObject(raw: string): ConfigObject {
	const value = parseJson(raw);
	if (isConfigObject(value)) return value;
	throw new Error('must be a JSON object');
}

function parseJsonArray(raw: string): Array<unknown> {
	const value = parseJson(raw);
	if (Array.isArray(value)) return value;
	throw new Error('must be a JSON array');
}

const TURN_SERVER_FIELDS = new Set(['host', 'port', 'protocol', 'username', 'credential', 'secret', 'ttl']);

function optionalString(entry: ConfigObject, key: string, n: number): string | undefined {
	const value = entry[key];
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || value === '') throw new Error(`entry ${n} must have a text ${key}`);
	return value;
}

function parseTurnServers(raw: string): Array<ConfigObject> {
	if (raw.trim() === '') return [];
	return parseJsonArray(raw).map((entry, index) => {
		const n = index + 1;
		if (!isConfigObject(entry)) throw new Error(`entry ${n} must be a JSON object`);
		for (const key of Object.keys(entry)) {
			if (!TURN_SERVER_FIELDS.has(key)) throw new Error(`entry ${n} has the unknown field ${key}`);
		}
		const {host, port, protocol, ttl} = entry;
		if (typeof host !== 'string' || host === '' || /[:/\s[\]]/.test(host)) {
			throw new Error(`entry ${n} must have a host that is a hostname or an IPv4 address`);
		}
		if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
			throw new Error(`entry ${n} must have a port from 1 to 65535`);
		}
		if (protocol !== 'udp' && protocol !== 'tcp' && protocol !== 'tls') {
			throw new Error(`entry ${n} must have the protocol udp, tcp or tls`);
		}
		const username = optionalString(entry, 'username', n);
		const credential = optionalString(entry, 'credential', n);
		const secret = optionalString(entry, 'secret', n);
		if (secret !== undefined && (username !== undefined || credential !== undefined)) {
			throw new Error(`entry ${n} must have a secret, or a username and credential, and not both`);
		}
		if ((username === undefined) !== (credential === undefined)) {
			throw new Error(`entry ${n} must have both a username and a credential`);
		}
		if (ttl !== undefined && (secret === undefined || typeof ttl !== 'number' || !Number.isInteger(ttl) || ttl < 1)) {
			throw new Error(`entry ${n} may have a ttl only with a secret, as a whole number of seconds`);
		}
		return entry;
	});
}

function parseInteger(raw: string): number {
	const trimmed = raw.trim();
	if (!/^-?\d+$/.test(trimmed)) {
		throw new Error(`must be an integer, got ${JSON.stringify(raw)}`);
	}
	const value = Number(trimmed);
	if (!Number.isSafeInteger(value)) throw new Error('must be a safe integer');
	return value;
}

function parseCsv(raw: string): Array<string> {
	return raw
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

function parseBucketList(raw: string): Array<string> {
	return raw.trim().toLowerCase() === 'none' ? [] : parseCsv(raw);
}

function parsePasskeyOrigins(raw: string): Array<string> {
	if (/\p{Cc}/u.test(raw)) {
		throw new Error('must not contain control characters');
	}
	return parseCsv(raw);
}

function setNestedValue(target: ConfigContainer, keys: Array<ConfigPathKey>, value: unknown): void {
	if (keys.length === 0) {
		return;
	}
	const [first, ...rest] = keys;
	if (rest.length === 0) {
		setChildValue(target, first, value);
		return;
	}
	const current = getChildValue(target, first);
	let child: ConfigContainer;
	if (isContainer(current)) {
		child = current;
	} else {
		child = createChildContainer(rest[0]);
		setChildValue(target, first, child);
	}
	setNestedValue(child, rest, value);
}

const NAMED_LARIXY_ENV_ALIASES: Record<string, string | undefined> = {
	LARIXY_INTERNAL_MEDIA_PROXY_ENDPOINT: 'LARIXY_MEDIA_PROXY_ENDPOINT',
	LARIXY_NATS_URL: 'LARIXY_NATS_CORE_URL',
	LARIXY_STORAGE_UPLOADS_TTL: 'LARIXY_SEAWEEDFS_UPLOADS_TTL',
};

function nonBlank(value: string | undefined): string | undefined {
	return value === undefined || value.trim().length === 0 ? undefined : value;
}

export function readEnvValue(env: NodeJS.ProcessEnv, name: string): string | undefined {
	const value = nonBlank(env[name]);
	const filePath = nonBlank(env[`${name}_FILE`]);
	if (filePath === undefined) {
		return value;
	}
	if (value !== undefined) {
		throw new Error(`${name} and ${name}_FILE are both set, set only one`);
	}
	let contents: string;
	try {
		contents = new TextDecoder('utf-8', {fatal: true}).decode(readFileSync(filePath));
	} catch (error) {
		const reason = error instanceof Error && 'code' in error ? String(error.code) : 'unreadable';
		throw new Error(`${name}_FILE could not read ${filePath} (${reason})`);
	}
	return nonBlank(contents.replace(/\r?\n$/, ''));
}

export function buildNamedLarixyEnvOverrides(env: NodeJS.ProcessEnv): ConfigObject {
	const overrides: ConfigObject = {};
	for (const [envKey, mapping] of Object.entries(NAMED_LARIXY_ENV_OVERRIDES)) {
		const alias = NAMED_LARIXY_ENV_ALIASES[envKey];
		const raw = readEnvValue(env, envKey) ?? (alias === undefined ? undefined : readEnvValue(env, alias));
		if (raw === undefined) {
			continue;
		}
		let parsed: unknown;
		try {
			parsed = mapping.parse ? mapping.parse(raw) : raw;
		} catch (error) {
			throw new Error(`${envKey} ${error instanceof Error ? error.message : String(error)}`);
		}
		setNestedValue(overrides, mapping.path, parsed);
	}
	return overrides;
}
