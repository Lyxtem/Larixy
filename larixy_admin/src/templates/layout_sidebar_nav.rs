// SPDX-License-Identifier: AGPL-3.0-or-later

use crate::acl;

pub struct NavItem {
    pub title: &'static str,
    pub path: &'static str,
    pub active_key: &'static str,
    pub required_acls: &'static [&'static str],
    pub hosted_only: bool,
}

pub const PENDING_REGISTRATIONS_KEY: &str = "pending-registrations";

pub struct NavSection {
    pub title: &'static str,
    pub items: &'static [NavItem],
}

macro_rules! item {
    ($t:expr, $p:expr, $k:expr, [ $($a:expr),+ $(,)? ]) => {
        NavItem { title: $t, path: $p, active_key: $k, required_acls: &[$($a),+], hosted_only: false }
    };
    ($t:expr, $p:expr, $k:expr, [ $($a:expr),+ $(,)? ], hosted) => {
        NavItem { title: $t, path: $p, active_key: $k, required_acls: &[$($a),+], hosted_only: true }
    };
}

pub const NAV_SECTIONS: &[NavSection] = &[
    NavSection {
        title: "Búsqueda",
        items: &[
            item!("Usuarios", "/users", "users", [acl::USER_LOOKUP]),
            item!("Servidores", "/guilds", "guilds", [acl::GUILD_LOOKUP]),
            item!(
                "Aplicaciones",
                "/applications",
                "applications",
                [acl::APPLICATION_LOOKUP, acl::APPLICATION_LIST_BY_OWNER]
            ),
        ],
    },
    NavSection {
        title: "Moderación",
        items: &[
            item!("Reportes", "/reports", "reports", [acl::REPORT_VIEW]),
            item!(
                "Decisiones",
                "/decisions",
                "decisions",
                [acl::ENFORCEMENT_VIEW]
            ),
            item!(
                "Explorar revisión",
                "/discovery",
                "discovery",
                [acl::DISCOVERY_REVIEW]
            ),
            item!(
                "Registros Pendientes",
                "/pending-registrations",
                PENDING_REGISTRATIONS_KEY,
                [acl::REGISTRATION_REVIEW]
            ),
            item!(
                "Acciones Masivas",
                "/bulk-actions",
                "bulk-actions",
                [
                    acl::BULK_UPDATE_USER_FLAGS,
                    acl::BULK_UPDATE_GUILD_FEATURES,
                    acl::BULK_ADD_GUILD_MEMBERS,
                    acl::BULK_DELETE_USERS,
                    acl::BULK_DELETE_USER_MESSAGES,
                ]
            ),
        ],
    },
    NavSection {
        title: "Herramientas de Contenido",
        items: &[
            item!(
                "Herramientas de Mensajes",
                "/messages",
                "message-tools",
                [
                    acl::MESSAGE_LOOKUP,
                    acl::MESSAGE_DELETE,
                    acl::MESSAGE_SHRED,
                    acl::MESSAGE_DELETE_ALL,
                ]
            ),
            item!(
                "Mensajes Directos del Sistema",
                "/system-dms",
                "system-dms",
                [acl::SYSTEM_DM_SEND]
            ),
            item!(
                "Archivos",
                "/archives",
                "archives",
                [
                    acl::ARCHIVE_VIEW_ALL,
                    acl::ARCHIVE_TRIGGER_USER,
                    acl::ARCHIVE_TRIGGER_GUILD,
                ]
            ),
        ],
    },
    NavSection {
        title: "Baneos de Usuarios",
        items: &[
            item!(
                "Baneos de IP",
                "/ip-bans",
                "ip-bans",
                [acl::BAN_IP_CHECK, acl::BAN_IP_ADD, acl::BAN_IP_REMOVE]
            ),
            item!(
                "Baneos de Correo",
                "/email-bans",
                "email-bans",
                [
                    acl::BAN_EMAIL_CHECK,
                    acl::BAN_EMAIL_ADD,
                    acl::BAN_EMAIL_REMOVE
                ]
            ),
            item!(
                "Baneos de Frases",
                "/phrase-bans",
                "phrase-bans",
                [
                    acl::BAN_PHRASE_CHECK,
                    acl::BAN_PHRASE_ADD,
                    acl::BAN_PHRASE_REMOVE
                ]
            ),
        ],
    },
    NavSection {
        title: "Listas de Bloqueo",
        items: &[
            item!(
                "Bloqueo de URLs",
                "/url-bans",
                "url-bans",
                [acl::BAN_URL_CHECK, acl::BAN_URL_ADD, acl::BAN_URL_REMOVE]
            ),
            item!(
                "Bloqueo de Dominios",
                "/url-domain-bans",
                "url-domain-bans",
                [
                    acl::BAN_URL_DOMAIN_CHECK,
                    acl::BAN_URL_DOMAIN_ADD,
                    acl::BAN_URL_DOMAIN_REMOVE
                ]
            ),
            item!(
                "Bloqueo de Archivos SHA",
                "/file-sha-bans",
                "file-sha-bans",
                [
                    acl::BAN_FILE_SHA_CHECK,
                    acl::BAN_FILE_SHA_ADD,
                    acl::BAN_FILE_SHA_REMOVE
                ]
            ),
            item!(
                "Bloqueo de Hashes de Avatar",
                "/avatar-hash-bans",
                "avatar-hash-bans",
                [
                    acl::BAN_AVATAR_HASH_CHECK,
                    acl::BAN_AVATAR_HASH_ADD,
                    acl::BAN_AVATAR_HASH_REMOVE
                ]
            ),
            item!(
                "Bloqueo de Textos de Perfil",
                "/profile-substring-bans",
                "profile-substring-bans",
                [
                    acl::BAN_PROFILE_SUBSTRING_CHECK,
                    acl::BAN_PROFILE_SUBSTRING_ADD,
                    acl::BAN_PROFILE_SUBSTRING_REMOVE
                ]
            ),
        ],
    },
    NavSection {
        title: "Observabilidad",
        items: &[
            item!(
                "Gateway",
                "/gateway",
                "gateway",
                [acl::GATEWAY_MEMORY_STATS, acl::GATEWAY_RELOAD_ALL]
            ),
            item!(
                "Registros de Auditoría",
                "/audit-logs",
                "audit-logs",
                [acl::AUDIT_LOG_VIEW]
            ),
            item!("Trabajos", "/jobs", "jobs", [acl::JOBS_VIEW]),
        ],
    },
    NavSection {
        title: "Plataforma",
        items: &[
            item!(
                "Índice de Búsqueda",
                "/search-index",
                "search-index",
                [acl::GUILD_LOOKUP]
            ),
            item!(
                "Regiones de Voz",
                "/voice-regions",
                "voice-regions",
                [acl::VOICE_REGION_LIST]
            ),
            item!(
                "Servidores de Voz",
                "/voice-servers",
                "voice-servers",
                [acl::VOICE_SERVER_LIST]
            ),
        ],
    },
    NavSection {
        title: "Configuración",
        items: &[
            item!(
                "Configuración de Instancia",
                "/instance-config",
                "instance-config",
                [acl::INSTANCE_CONFIG_VIEW, acl::INSTANCE_CONFIG_UPDATE]
            ),
            item!(
                "Configuración de Límites",
                "/limit-config",
                "limit-config",
                [
                    acl::INSTANCE_LIMIT_CONFIG_VIEW,
                    acl::INSTANCE_LIMIT_CONFIG_UPDATE
                ]
            ),
            item!("Insignias", "/badges", "badges", [acl::BADGE_LIST]),
            item!(
                "Claves API de Admin",
                "/admin-api-keys",
                "admin-api-keys",
                [acl::ADMIN_API_KEY_MANAGE]
            ),
        ],
    },
    NavSection {
        title: "Premium",
        items: &[
            item!(
                "Códigos de Regalo",
                "/gift-codes",
                "gift-codes",
                [acl::GIFT_CODES_GENERATE]
            ),
            item!(
                "Muro de Operadores",
                "/operator-pass-wall",
                "operator-pass-wall",
                [acl::USER_LOOKUP],
                hosted
            ),
            item!(
                "Herramientas de Operadores",
                "/operator-pass-wall/tools",
                "operator-pass-wall-tools",
                [acl::USER_LOOKUP],
                hosted
            ),
            item!(
                "Lista de Versiones de Operadores",
                "/operator-pass-releases",
                "operator-pass-releases",
                [acl::USER_LOOKUP],
                hosted
            ),
            item!(
                "Disputas de Pago",
                "/payment-disputes",
                "payment-disputes",
                [acl::USER_LOOKUP]
            ),
        ],
    },
];
