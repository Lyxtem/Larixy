// SPDX-License-Identifier: AGPL-3.0-or-later

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type RehypePlugin, unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import type { Root, RootContent } from 'hast';
import { jetBrainsMonoFont, notoSansFont, radioCanadaBigFont } from './src/fonts/Fonts';
import { docsBaseDomain, docsListenHost, docsListenPort, docsPublicEndpoint } from './src/server/DocsConfig';
import { resolveViteDevWebSocket } from './src/server/ViteDevWebSocket';
import { larixyDarkCodeTheme, larixyLightCodeTheme } from './src/styles/CodeTheme';
import { rehypeTableColumnWidths } from './src/table/RehypeTableColumns.ts';

const docsEndpoint = new URL(docsPublicEndpoint());
const staticDirectory = fileURLToPath(new URL('../larixy_static/', import.meta.url));

const resolveDocsBasePath = (endpoint: URL): string => {
	if (endpoint.pathname === '/') {
		return '';
	}
	if (endpoint.pathname.endsWith('/')) {
		return endpoint.pathname.slice(0, -1);
	}
	return endpoint.pathname;
};

const resolveDocsWebSocketPath = (basePath: string): string => {
	if (basePath.length === 0) {
		return '/@vite-hmr';
	}
	return `${basePath}/@vite-hmr`;
};

const isRootRelativeHref = (href: unknown): href is string => {
	if (typeof href !== 'string') {
		return false;
	}
	if (!href.startsWith('/')) {
		return false;
	}
	return !href.startsWith('//');
};

const prefixRootRelativeLinks = (node: Root | RootContent, prefix: string): void => {
	if (node.type === 'element' && node.tagName === 'a') {
		const href = node.properties.href;
		if (isRootRelativeHref(href)) {
			node.properties.href = `${prefix}${href}`;
		}
	}
	if (node.type !== 'root' && node.type !== 'element') {
		return;
	}
	for (const child of node.children) {
		prefixRootRelativeLinks(child, prefix);
	}
};

const rehypeRootRelativeLinkPrefix =
	(prefix: string): RehypePlugin =>
		() =>
			(tree) => {
				if (prefix.length === 0) {
					return;
				}
				prefixRootRelativeLinks(tree, prefix);
			};

const basePath = resolveDocsBasePath(docsEndpoint);

export default defineConfig({
	adapter: node({ mode: 'middleware' }),
	base: docsEndpoint.pathname,
	devToolbar: {
		enabled: false,
	},
	fonts: [radioCanadaBigFont, notoSansFont, jetBrainsMonoFont],
	integrations: [
		starlight({
			components: {
				Head: './src/components/Head.astro',
				Header: './src/components/Header.astro',
				Sidebar: './src/components/Sidebar.astro',
				TableOfContents: './src/components/TableOfContents.astro',
				ThemeProvider: './src/components/ThemeProvider.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
			customCss: [
				'./src/fonts/font-stack.css',
				'./src/styles/tokens.css',
				'./src/styles/layout.css',
				'./src/styles/content.css',
				'./src/styles/route-header.css',
			],
			description: 'Larixy external API and protocol reference.',
			expressiveCode: {
				styleOverrides: {
					borderColor: 'var(--larixy-code-border)',
					borderRadius: 'var(--larixy-radius-lg)',
					borderWidth: '1px',
					codeBackground: 'var(--larixy-code-bg)',
					codeFontFamily: 'var(--__sl-font-mono)',
					codeFontSize: 'var(--larixy-code-block-font-size)',
					codeForeground: 'var(--larixy-code-fg)',
					codeLineHeight: '1.6',
					codePaddingBlock: '0.875rem',
					codePaddingInline: '1.125rem',
					codeSelectionBackground: 'var(--larixy-code-selection-bg)',
					focusBorder: 'var(--larixy-link)',
					frames: {
						editorActiveTabBackground: 'var(--larixy-code-bg)',
						editorActiveTabBorderColor: 'var(--larixy-code-border)',
						editorActiveTabForeground: 'var(--larixy-content-heading)',
						editorActiveTabIndicatorBottomColor: 'transparent',
						editorActiveTabIndicatorHeight: '2px',
						editorActiveTabIndicatorTopColor: 'var(--larixy-brand)',
						editorBackground: 'var(--larixy-code-bg)',
						editorTabBarBackground: 'var(--larixy-code-chrome-bg)',
						editorTabBarBorderBottomColor: 'var(--larixy-code-border)',
						editorTabBorderRadius: '0',
						editorTabsMarginInlineStart: '0',
						frameBoxShadowCssValue: 'none',
						inlineButtonBackground: 'var(--larixy-text-primary)',
						inlineButtonBackgroundActiveOpacity: '0.2',
						inlineButtonBackgroundHoverOrFocusOpacity: '0.12',
						inlineButtonBackgroundIdleOpacity: '0',
						inlineButtonBorder: 'var(--larixy-code-border)',
						inlineButtonForeground: 'var(--larixy-text-tertiary)',
						shadowColor: 'transparent',
						terminalBackground: 'var(--larixy-code-bg)',
						terminalTitlebarBackground: 'var(--larixy-code-chrome-bg)',
						terminalTitlebarBorderBottomColor: 'var(--larixy-code-border)',
						terminalTitlebarDotsForeground: 'var(--larixy-code-dots)',
						terminalTitlebarDotsOpacity: '1',
						terminalTitlebarForeground: 'var(--larixy-text-tertiary)',
						tooltipSuccessBackground: 'var(--larixy-accent-success)',
						tooltipSuccessForeground: 'var(--larixy-on-brand)',
					},
					scrollbarThumbColor: 'var(--larixy-scrollbar-thumb)',
					scrollbarThumbHoverColor: 'var(--larixy-scrollbar-thumb)',
					uiFontFamily: 'var(--__sl-font)',
					uiFontSize: 'var(--sl-text-xs)',
					uiFontWeight: '500',
					uiPaddingBlock: '0.3125rem',
					uiPaddingInline: '0.75rem',
				},
				themes: [larixyDarkCodeTheme, larixyLightCodeTheme],
			},
			favicon: '/favicon-32x32.png',
			logo: {
				replacesTitle: true,
				src: path.join(staticDirectory, 'marketing/branding/logo-color.svg'),
			},
			sidebar: [
				{
					label: 'Reference',
					items: [{ label: 'Introduction', link: '/' }, 'authentication', 'snowflakes'],
				},
				{
					label: 'Topics',
					items: [
						'http-api/errors',
						'topics/rate-limits',
						'topics/announcement-channels',
						'http-api/permissions',
						'topics/captcha',
						'topics/uploads',
						'topics/locales',
						'http-api/deployment-availability',
					],
				},
				{
					label: 'HTTP API',
					items: [
						{ label: 'Overview', link: '/http-api/' },
						'http-api/instance',
						'http-api/authentication',
						'http-api/gateway',
						'http-api/oauth2',
						'http-api/applications',
						'http-api/connections',
					],
				},
				{
					label: 'Users',
					items: [
						'http-api/users',
						'http-api/users/current-user',
						'http-api/users/settings',
						'http-api/users/email-and-password',
						'http-api/users/mfa',
						'http-api/users/relationships',
						'http-api/users/notes',
						'http-api/users/private-channels',
						'http-api/users/push-notifications',
						'http-api/users/content',
						'http-api/users/gifts',
					],
				},
				{
					label: 'Messaging',
					items: [
						'http-api/channels',
						'http-api/messages',
						'http-api/threads',
						'http-api/thread-members',
						'http-api/forums',
						'http-api/read-states',
						'http-api/memes',
						'http-api/gifs',
						'http-api/webhooks',
					],
				},
				{
					label: 'Guilds',
					items: [
						'http-api/guilds',
						'http-api/guild-channels',
						'http-api/guild-members',
						'http-api/guild-member-search',
						'http-api/guild-moderation',
						'http-api/guild-emojis',
						'http-api/guild-stickers',
						'http-api/expressions',
						'http-api/guild-audit-logs',
					],
				},
				{
					label: 'Discovery and content',
					items: ['http-api/discovery', 'http-api/invites', 'http-api/search', 'http-api/unfurl'],
				},
				{
					label: 'Commerce',
					items: ['http-api/billing', 'http-api/premium', 'http-api/gifts'],
				},
				{
					label: 'Client surfaces',
					items: ['http-api/experiments', 'http-api/themes'],
				},
				{
					label: 'Safety',
					items: ['http-api/reports'],
				},
				{
					label: 'Gateway',
					items: [
						'gateway/overview',
						'gateway/commands',
						'gateway/events',
						'gateway/event-filtering',
						'gateway/threads',
						'gateway/limits-and-rate-limits',
						'gateway/opcodes-and-close-codes',
					],
				},
				{
					label: 'Downloads',
					items: ['downloads/overview', 'downloads/desktop'],
				},
				{
					label: 'Media proxy',
					items: [
						'media-proxy/overview',
						'media-proxy/routes',
						'media-proxy/transformations',
						'media-proxy/upload-relay',
						'media-proxy/responses-and-limits',
					],
				},
				{
					label: 'Voice',
					items: [
						'voice',
						'http-api/calls',
						'http-api/peer-to-peer-voice',
						'http-api/streams',
						'http-api/entrance-sounds',
					],
				},
			],
			social: [
				{
					href: 'https://github.com/Lyxtem/larixy',
					icon: 'github',
					label: 'GitHub',
				},
			],
			tableOfContents: { maxHeadingLevel: 2, minHeadingLevel: 2 },
			title: 'Larixy API',
		}),
		mdx(),
	],
	markdown: {
		smartypants: false,
		processor: unified({
			rehypePlugins: [rehypeRootRelativeLinkPrefix(basePath), rehypeTableColumnWidths()],
		}),
	},
	output: 'server',
	redirects: {
		'/admin-api': '/http-api/',
		'/admin-api/[...path]': '/http-api/',
		'/operator': '/http-api/',
		'/operator/[...path]': '/http-api/',
		'/api-reference': '/http-api/',
		'/api-reference/[...path]': '/http-api/',
		'/http-api/donations': '/http-api/billing/',
		'/http-api/in-app-purchases': '/http-api/premium/',
		'/http-api/operator-pass': '/http-api/premium/',
		'/http-api/operator-pass-waitlist': '/http-api/premium/',
	},
	publicDir: path.join(staticDirectory, 'web'),
	site: docsEndpoint.origin,
	server: {
		allowedHosts: [docsBaseDomain()],
		host: docsListenHost(),
		port: docsListenPort(),
	},
	vite: {
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
			},
		},
		server: {
			fs: {
				deny: [
					'.env',
					'.env.*',
					'*.{crt,pem,key,p12,pfx,cer,der}',
					'.npmrc',
					'.yarnrc.yml',
					'**/.git/**',
					'**/.larixy/**',
					'**/.devcontainer/**',
					'**/.ssh/**',
					'**/.aws/**',
					'**/.envrc',
					'**/*.{toml,yaml,yml}',
					'**/*.{sqlite,sqlite3,db}',
				],
			},
			ws: resolveViteDevWebSocket({ endpoint: docsEndpoint, path: resolveDocsWebSocketPath(basePath) }),
		},
	},
});
