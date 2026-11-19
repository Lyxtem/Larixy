DIST_DIR ?= $(CURDIR)/dist
TOOLCHAIN ?= $(DIST_DIR)/toolchain
NATIVE ?= $(DIST_DIR)/native
PROFILE ?= release
ONLY ?=
INTO ?=
IMAGE ?= larixy:dev
SOURCE ?=
DIST ?=

.PHONY: toolchain native-deps dist image clean-build

toolchain:
	tools/dist/toolchain.sh '$(TOOLCHAIN)'

native-deps:
	@if [ "$$(id -u)" = 0 ]; then echo "run make native-deps as a normal user, install-native-deps.sh registers its prefix system-wide when run as root" >&2; exit 1; fi
	larixy_media_proxy/tools/install-native-deps.sh '$(NATIVE)'

dist:
	LARIXY_TOOLCHAIN='$(TOOLCHAIN)' LARIXY_NATIVE_PREFIX='$(NATIVE)' PROFILE='$(PROFILE)' \
		tools/dist/build.sh $(if $(ONLY),--only '$(ONLY)') $(if $(INTO),--into '$(INTO)') '$(DIST_DIR)'

image:
	docker build -f packaging/monolith/Dockerfile -t '$(IMAGE)' --build-arg PROFILE='$(PROFILE)' \
		$(if $(SOURCE),--build-arg SOURCE='$(SOURCE)') \
		$(if $(filter fromdist,$(SOURCE)),--build-context dist='$(DIST_DIR)') \
		$(if $(DIST),--build-arg DIST='$(DIST)') \
		$(if $(BUILD_VERSION),--build-arg BUILD_VERSION='$(BUILD_VERSION)') \
		$(if $(CARGO_BUILD_JOBS),--build-arg CARGO_BUILD_JOBS='$(CARGO_BUILD_JOBS)') \
		.

clean-build:
	find '$(CURDIR)' \( -path '$(CURDIR)/.git' -o -path '$(DIST_DIR)' -o -path '$(TOOLCHAIN)' -o -path '$(NATIVE)' \) -prune \
		-o \( -name target -o -name node_modules \) -type d -prune -exec rm -rf {} +
	rm -rf larixy_gateway/_build larixy_gateway/priv larixy_app/dist larixy_api/dist
	if [ -n "$${PNPM_STORE_DIR:-}" ]; then rm -rf "$$PNPM_STORE_DIR"; fi
