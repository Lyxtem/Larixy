# SPDX-License-Identifier: AGPL-3.0-or-later
ARG BUILD_VERSION

FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS base

WORKDIR /usr/src/app

RUN npm install -g pnpm@11.27.0

FROM base AS deploy

RUN apt-get update && apt-get install -y --no-install-recommends \
		build-essential \
		gcc \
		libssl-dev \
		pkg-config \
		openssl \
		python3 && \
	rm -rf /var/lib/apt/lists/*

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter larixy_api run build
RUN pnpm deploy --legacy --filter=larixy_api --prod --config.allow-unused-patches=true /out && \
	rm -rf /out/pkgs /out/dist /out/node_modules/.pnpm/@pkgs+email@*/node_modules/@pkgs/email/src/operator_pass_certificate/fonts && \
	find /out/node_modules -type f \( -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts' -o -name '*.js.map' -o -name '*.mjs.map' -o -name '*.cjs.map' -o -name '*.ts.map' \) -delete

FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072

ARG BUILD_VERSION
ARG SOURCE_SHA
ARG SOURCE_DATE

LABEL org.opencontainers.image.title="larixy-api"
LABEL org.opencontainers.image.description="Larixy HTTP API and background workers"
LABEL org.opencontainers.image.licenses="AGPL-3.0-or-later"
LABEL org.opencontainers.image.vendor="Larixy"
LABEL org.opencontainers.image.url="https://larixy.xyz"
LABEL org.opencontainers.image.documentation="https://docs.larixy.xyz"
LABEL org.opencontainers.image.source="https://github.com/larixyapp/larixy"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.revision="${SOURCE_SHA}"
LABEL org.opencontainers.image.created="${SOURCE_DATE}"
LABEL app.larixy.build-version="${BUILD_VERSION}"

WORKDIR /usr/src/app/larixy_api

RUN apt-get update && apt-get install -y --no-install-recommends \
		ca-certificates && \
	rm -rf /var/lib/apt/lists/*

COPY --from=deploy --chown=65532:65532 /out ./
COPY --from=deploy --chown=65532:65532 /usr/src/app/larixy_api/dist ./dist
COPY --from=deploy --chown=65532:65532 /usr/src/app/larixy_api/bin ./bin
COPY --from=deploy --chown=65532:65532 /usr/src/app/tsconfigs /usr/src/app/tsconfigs

RUN mkdir -p /run/larixy && \
	chmod 700 /run/larixy && \
	chown 65532:65532 /usr/src/app /usr/src/app/larixy_api /run/larixy

ENV HOME=/usr/src/app
ENV NODE_ENV=production
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV BUILD_VERSION=${BUILD_VERSION}

USER 65532:65532

EXPOSE 8080

CMD ["node", "dist/AppEntrypoint.js"]
