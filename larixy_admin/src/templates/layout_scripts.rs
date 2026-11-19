// SPDX-License-Identifier: AGPL-3.0-or-later

pub const THEME_INIT_SCRIPT: &str = r#"
(function () {
	var root = document.documentElement;
	var media = window.matchMedia('(prefers-color-scheme: dark)');
	function stored() {
		try {
			var value = localStorage.getItem('larixy-admin-theme');
			return value === 'light' || value === 'dark' ? value : null;
		} catch (e) {
			return null;
		}
	}
	function apply() { root.dataset.theme = stored() || (media.matches ? 'dark' : 'light'); }
	apply();
	media.addEventListener('change', apply);
})();
"#;

pub const HISTORY_CACHE_CLEAR_SCRIPT: &str =
    "try { localStorage.removeItem('htmx-history-cache'); } catch (e) {}";

pub const THEME_TOGGLE_SCRIPT: &str = r#"
(function () {
	if (window.__larixyAdminThemeToggle) return;
	window.__larixyAdminThemeToggle = true;
	document.addEventListener('click', function (event) {
		var button = event.target.closest && event.target.closest('[data-theme-toggle]');
		if (!button) return;
		var root = document.documentElement;
		var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
		root.dataset.theme = next;
		try { localStorage.setItem('larixy-admin-theme', next); } catch (e) {}
	});
})();
"#;

pub const SIDEBAR_ACTIVE_SCROLL_SCRIPT: &str = r#"
(function () {
	var sidebar = document.querySelector('[data-sidebar]');
	if (!sidebar) return;
	var scroller = sidebar.querySelector('[data-sidebar-nav]') || sidebar;
	var key = 'larixy-admin-sidebar-scroll';
	var restored = false;
	try {
		var saved = sessionStorage.getItem(key);
		if (saved !== null) {
			scroller.scrollTop = Number(saved) || 0;
			restored = true;
		}
	} catch (e) {}
	if (!restored) {
		var el = sidebar.querySelector('[data-active]');
		if (el) el.scrollIntoView({block: 'nearest'});
	}
	if (scroller.dataset.sidebarScrollBound === 'true') return;
	scroller.dataset.sidebarScrollBound = 'true';
	scroller.addEventListener('scroll', function () {
		try { sessionStorage.setItem(key, String(scroller.scrollTop)); } catch (e) {}
	}, {passive: true});
	sidebar.addEventListener('click', function () {
		try { sessionStorage.setItem(key, String(scroller.scrollTop)); } catch (e) {}
	}, true);
})();

"#;

pub const SIDEBAR_SCRIPT: &str = r#"
(function () {
	var sidebar = document.querySelector('[data-sidebar]');
	var overlay = document.querySelector('[data-sidebar-overlay]');
	var toggles = document.querySelectorAll('[data-sidebar-toggle]');
	var closes = document.querySelectorAll('[data-sidebar-close]');
	if (!sidebar || !overlay) return;
	var lastFocusedToggle = null;
	var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
	function isDesktop() { return window.innerWidth >= 1024; }
	function setExpanded(expanded) {
		toggles.forEach(function (btn) { btn.setAttribute('aria-expanded', expanded ? 'true' : 'false'); });
	}
	function open(triggeredBy) {
		if (isDesktop()) return;
		lastFocusedToggle = triggeredBy || document.activeElement;
		sidebar.classList.remove('-translate-x-full');
		sidebar.setAttribute('aria-hidden', 'false');
		overlay.classList.remove('opacity-0', 'pointer-events-none');
		overlay.classList.add('opacity-100');
		document.body.classList.add('drawer-open');
		setExpanded(true);
		var first = sidebar.querySelector(FOCUSABLE);
		if (first) first.focus();
	}
	function close() {
		if (isDesktop()) return;
		sidebar.classList.add('-translate-x-full');
		sidebar.setAttribute('aria-hidden', 'true');
		overlay.classList.add('opacity-0', 'pointer-events-none');
		overlay.classList.remove('opacity-100');
		document.body.classList.remove('drawer-open');
		setExpanded(false);
		if (lastFocusedToggle && typeof lastFocusedToggle.focus === 'function') {
			lastFocusedToggle.focus();
		}
	}
	function isOpen() {
		return !sidebar.classList.contains('-translate-x-full') && !isDesktop();
	}
	toggles.forEach(function (btn) {
		btn.addEventListener('click', function () {
			if (sidebar.classList.contains('-translate-x-full')) {
				open(btn);
			} else {
				close();
			}
		});
	});
	closes.forEach(function (btn) {
		btn.addEventListener('click', close);
	});
	overlay.addEventListener('click', close);
	document.addEventListener('keydown', function (event) {
		if (!isOpen()) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			return;
		}
		if (event.key === 'Tab') {
			var focusables = Array.prototype.filter.call(
				sidebar.querySelectorAll(FOCUSABLE),
				function (el) { return !el.hasAttribute('disabled') && el.offsetParent !== null; }
			);
			if (focusables.length === 0) return;
			var first = focusables[0];
			var last = focusables[focusables.length - 1];
			var active = document.activeElement;
			if (event.shiftKey && active === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && active === last) {
				event.preventDefault();
				first.focus();
			} else if (!sidebar.contains(active)) {
				event.preventDefault();
				first.focus();
			}
		}
	});
	function syncForDesktop() {
		if (isDesktop()) {
			overlay.classList.add('opacity-0', 'pointer-events-none');
			overlay.classList.remove('opacity-100');
			document.body.classList.remove('drawer-open');
			sidebar.classList.remove('-translate-x-full');
			sidebar.setAttribute('aria-hidden', 'false');
			setExpanded(false);
		} else {
			sidebar.classList.add('-translate-x-full');
			sidebar.setAttribute('aria-hidden', 'true');
			setExpanded(false);
		}
	}
	window.addEventListener('resize', syncForDesktop);
	syncForDesktop();
})();

"#;

pub const ADMIN_ACTION_FORM_SCRIPT: &str = r#"
(function () {
	if (window.__larixyAdminActionForms) return;
	window.__larixyAdminActionForms = true;

	function basePath() {
		return document.documentElement.getAttribute('data-base-path') || '';
	}

	function stripBase(pathname) {
		var base = basePath();
		if (base && pathname.indexOf(base + '/') === 0) return pathname.slice(base.length);
		if (base && pathname === base) return '/';
		return pathname;
	}

	function formUrl(form) {
		var raw = form.getAttribute('action') || window.location.href;
		try {
			return new URL(raw, window.location.href);
		} catch (error) {
			return null;
		}
	}

	function existingTarget(form) {
		return (form.getAttribute('hx-target') || form.getAttribute('data-hx-target') || '').trim();
	}

	function isResultForm(form, url) {
		if (form.dataset.adminResultForm === 'true' || form.dataset.adminAllowSwap === 'true') return true;
		if (form.dataset.adminToast === 'false') return true;
		if ((form.getAttribute('hx-boost') || '').toLowerCase() === 'false') return true;
		if (form.hasAttribute('target')) return true;
		var target = existingTarget(form);
		if (target && target !== '#flash-container' && target !== 'flash-container') return true;
		var enctype = (form.getAttribute('enctype') || '').toLowerCase();
		if (enctype === 'multipart/form-data') return true;
		if (!url || url.origin !== window.location.origin) return true;
		var path = stripBase(url.pathname);
		var action = url.searchParams.get('action') || '';
		if (path === '/gift-codes') return true;
		if (path === '/logout') return true;
		if (path === '/messages' && (
			action === 'search' ||
			action === 'browse' ||
			action === 'lookup' ||
			action === 'lookup-by-attachment'
		)) return true;
		return false;
	}

	function decorateForm(form) {
		if (!(form instanceof HTMLFormElement)) return;
		if (form.dataset.adminActionFormProcessed === 'true') return;
		var method = (form.getAttribute('method') || 'get').toLowerCase();
		if (method !== 'post') return;
		var url = formUrl(form);
		if (isResultForm(form, url)) return;
		var action = form.getAttribute('action') || window.location.pathname + window.location.search;
		form.setAttribute('hx-post', action);
		form.setAttribute('hx-target', '#flash-container');
		form.setAttribute('hx-swap', 'none');
		form.setAttribute('hx-push-url', 'false');
		form.dataset.adminActionFormProcessed = 'true';
		if (window.htmx && typeof window.htmx.process === 'function') {
			window.htmx.process(form);
		}
	}

	function decorate(root) {
		var scope = root && root.querySelectorAll ? root : document;
		if (scope instanceof HTMLFormElement) {
			decorateForm(scope);
			return;
		}
		Array.prototype.forEach.call(scope.querySelectorAll('form'), decorateForm);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () { decorate(document); });
	} else {
		decorate(document);
	}
	document.body.addEventListener('htmx:load', function (event) {
		decorate(event.detail && event.detail.elt ? event.detail.elt : event.target);
	});
})();

"#;

pub const HTMX_SCROLL_PRESERVER_SCRIPT: &str = r#"
(function () {
	if (window.__larixyAdminHtmxScrollPreserver) return;
	window.__larixyAdminHtmxScrollPreserver = true;
	var pendingKey = '__larixyAdminPendingHtmxScroll';
	var restoreTimer = 0;

	function adminScroller() {
		var main = document.getElementById('main-content');
		if (!main || !main.parentElement) return null;
		return main.parentElement;
	}

	function shouldPreserve(detail) {
		var cfg = detail && detail.requestConfig;
		if (!cfg) return false;
		var verb = String(cfg.verb || '').toLowerCase();
		return verb !== '' && verb !== 'get';
	}

	function snapshot() {
		var scroller = adminScroller();
		window[pendingKey] = {
			top: scroller ? scroller.scrollTop : null,
			left: scroller ? scroller.scrollLeft : null,
			windowX: window.scrollX || window.pageXOffset || 0,
			windowY: window.scrollY || window.pageYOffset || 0
		};
	}

	function restore() {
		var saved = window[pendingKey];
		if (!saved) return;
		var scroller = adminScroller();
		if (scroller && typeof saved.top === 'number') {
			scroller.scrollTop = saved.top;
			scroller.scrollLeft = saved.left || 0;
		}
		if (typeof window.scrollTo === 'function' && typeof saved.windowY === 'number') {
			window.scrollTo(saved.windowX || 0, saved.windowY || 0);
		}
	}

	function scheduleRestore(delay) {
		if (!window[pendingKey]) return;
		if (restoreTimer) window.clearTimeout(restoreTimer);
		restoreTimer = window.setTimeout(function () {
			var frames = 0;
			function tick() {
				restore();
				frames += 1;
				if (frames < 4 && typeof window.requestAnimationFrame === 'function') {
					window.requestAnimationFrame(tick);
				} else {
					window[pendingKey] = null;
				}
			}
			if (typeof window.requestAnimationFrame === 'function') {
				window.requestAnimationFrame(tick);
			} else {
				restore();
				window[pendingKey] = null;
			}
		}, delay);
	}

	document.addEventListener('htmx:beforeRequest', function (event) {
		if (shouldPreserve(event.detail)) snapshot();
	}, true);

	document.addEventListener('htmx:afterSettle', function (event) {
		if (shouldPreserve(event.detail)) scheduleRestore(0);
	}, true);

	document.addEventListener('htmx:afterRequest', function (event) {
		if (shouldPreserve(event.detail)) scheduleRestore(80);
	}, true);
})();

"#;

pub const HTMX_FLASH_SCRIPT: &str = r#"
(function () {
	if (window.__larixyAdminToastScript) return;
	window.__larixyAdminToastScript = true;

	var activeToast = null;
	var hideTimer = 0;

	function palette(level) {
		if (level === 'success') {
			return {background: '#ecfdf3', border: '#bbf7d0', color: '#166534'};
		}
		if (level === 'error') {
			return {background: '#fef2f2', border: '#fecaca', color: '#991b1b'};
		}
		return {background: '#eff6ff', border: '#bfdbfe', color: '#1e40af'};
	}

	function stack() {
		var el = document.getElementById('admin-toast-stack');
		if (el) return el;
		el = document.createElement('div');
		el.id = 'admin-toast-stack';
		el.setAttribute('aria-live', 'polite');
		el.setAttribute('aria-atomic', 'true');
		el.style.cssText = [
			'position:fixed',
			'top:16px',
			'left:50%',
			'transform:translateX(-50%)',
			'z-index:9999',
			'display:flex',
			'flex-direction:column',
			'align-items:center',
			'gap:8px',
			'width:min(calc(100vw - 24px), 520px)',
			'pointer-events:none'
		].join(';');
		document.body.appendChild(el);
		return el;
	}

	function showToast(level, message, options) {
		options = options || {};
		if (!message) message = level === 'error' ? 'Action failed.' : level === 'success' ? 'Done.' : 'Working...';
		if (hideTimer) {
			window.clearTimeout(hideTimer);
			hideTimer = 0;
		}
		if (activeToast && !activeToast.isConnected) activeToast = null;
		if (!activeToast) {
			activeToast = document.createElement('div');
			activeToast.setAttribute('role', 'status');
			activeToast.style.cssText = [
				'max-width:100%',
				'border:1px solid',
				'border-radius:8px',
				'box-shadow:0 12px 28px rgba(15, 23, 42, 0.16)',
				'font:500 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				'padding:10px 14px',
				'pointer-events:auto',
				'transition:opacity 120ms ease, transform 120ms ease',
				'white-space:normal'
			].join(';');
			stack().appendChild(activeToast);
		}
		var colors = palette(level);
		activeToast.textContent = message;
		activeToast.style.background = colors.background;
		activeToast.style.borderColor = colors.border;
		activeToast.style.color = colors.color;
		activeToast.style.opacity = '1';
		activeToast.style.transform = 'translateY(0)';
		if (!options.persist) {
			hideTimer = window.setTimeout(function () {
				if (!activeToast) return;
				activeToast.style.opacity = '0';
				activeToast.style.transform = 'translateY(-4px)';
				window.setTimeout(function () {
					if (activeToast) activeToast.remove();
					activeToast = null;
				}, 160);
			}, options.duration || 5000);
		}
	}

	function hideToast() {
		if (hideTimer) {
			window.clearTimeout(hideTimer);
			hideTimer = 0;
		}
		if (activeToast) activeToast.remove();
		activeToast = null;
	}

	function requestVerb(detail) {
		var cfg = detail && detail.requestConfig;
		return String((cfg && cfg.verb) || '').toLowerCase();
	}

	function isMutation(detail) {
		var verb = requestVerb(detail);
		return verb !== '' && verb !== 'get';
	}

	function targetIsFlashContainer(detail) {
		var target = detail && detail.target;
		return !!target && target.id === 'flash-container';
	}

	function markToastHandled(detail) {
		if (detail) detail.__larixyToastHandled = true;
		if (detail && detail.xhr) detail.xhr.__larixyToastHandled = true;
	}

	function toastWasHandled(detail) {
		return !!(detail && (detail.__larixyToastHandled || (detail.xhr && detail.xhr.__larixyToastHandled)));
	}

	function mutationElement(detail) {
		if (!detail) return null;
		return detail.elt || (detail.requestConfig && detail.requestConfig.elt) || null;
	}

	function mutationControls(detail) {
		var elt = mutationElement(detail);
		if (!elt || !elt.querySelectorAll) return [];
		var root = elt;
		if (elt.tagName && elt.tagName.toLowerCase() !== 'form' && elt.closest) {
			root = elt.closest('form') || elt;
		}
		var controls = [];
		if (root.matches && root.matches('button,input,select,textarea')) {
			controls.push(root);
		}
		if (root.querySelectorAll) {
			Array.prototype.forEach.call(root.querySelectorAll('button,input,select,textarea'), function (control) {
				controls.push(control);
			});
		}
		return controls;
	}

	function disableMutationControls(detail) {
		if (!isMutation(detail) || toastWasHandled(detail)) return;
		var disabled = [];
		mutationControls(detail).forEach(function (control) {
			if (control.disabled || control.dataset.larixyAdminRequestDisabled === 'true') return;
			control.disabled = true;
			control.dataset.larixyAdminRequestDisabled = 'true';
			disabled.push(control);
		});
		if (detail) detail.__larixyDisabledControls = disabled;
		if (detail && detail.xhr) detail.xhr.__larixyDisabledControls = disabled;
	}

	function restoreMutationControls(detail) {
		var controls = (detail && detail.__larixyDisabledControls) ||
			(detail && detail.xhr && detail.xhr.__larixyDisabledControls) ||
			[];
		controls.forEach(function (control) {
			if (control.dataset.larixyAdminRequestDisabled !== 'true') return;
			control.disabled = false;
			delete control.dataset.larixyAdminRequestDisabled;
		});
	}

	function responseUrlPath(xhr) {
		if (!xhr || !xhr.responseURL) return '';
		try {
			return new URL(xhr.responseURL, window.location.href).pathname;
		} catch (error) {
			return '';
		}
	}

	function isLoginResponse(xhr) {
		var base = document.documentElement.getAttribute('data-base-path') || '';
		return responseUrlPath(xhr) === base + '/login';
	}

	function parseFlashResponse(responseText, status) {
		var root = document.createElement('div');
		root.innerHTML = responseText || '';
		var flash = root.querySelector('#flash-container');
		var source = flash || root.firstElementChild || root;
		var text = (source.textContent || '').replace(/\s+/g, ' ').trim();
		var className = '';
		var element = source instanceof Element ? source : root.firstElementChild;
		var depth = 0;
		while (element && depth < 4) {
			className += ' ' + (element.getAttribute('class') || '');
			element = element.firstElementChild;
			depth += 1;
		}
		var level = 'success';
		if (className.indexOf('red-') >= 0) level = 'error';
		if (className.indexOf('green-') >= 0) level = 'success';
		if (className.indexOf('blue-') >= 0) level = 'info';
		if (status >= 400) level = 'error';
		return {
			level: level,
			message: text || (level === 'error' ? 'Action failed.' : 'Done.')
		};
	}

	function parseAdminToastHeader(xhr) {
		if (!xhr || typeof xhr.getResponseHeader !== 'function') return null;
		var raw = xhr.getResponseHeader('X-Larixy-Admin-Toast');
		if (!raw) return null;
		try {
			var parsed = JSON.parse(raw);
			return {
				level: parsed && parsed.level ? String(parsed.level) : 'info',
				message: parsed && parsed.message ? String(parsed.message) : '',
				field: parsed && parsed.field ? String(parsed.field) : '',
				fieldMessage: parsed && parsed.field_message ? String(parsed.field_message) : ''
			};
		} catch (error) {
			return null;
		}
	}

	function refreshAfterSuccess(detail, level) {
		if (level !== 'success') return;
		var elt = (detail && detail.requestConfig && detail.requestConfig.elt) || mutationElement(detail);
		var form = elt && elt.closest ? elt.closest('form') : null;
		var selector = form ? form.getAttribute('data-admin-refresh-on-success') : '';
		if (!selector || !document.querySelector(selector)) return;
		if (!window.htmx || typeof window.htmx.ajax !== 'function') return;
		window.htmx.ajax('GET', window.location.pathname + window.location.search, {
			target: selector,
			swap: 'outerHTML',
			select: selector
		});
	}

	function fieldErrorSlots(root) {
		return root && root.querySelectorAll ? root.querySelectorAll('[data-field-error]') : [];
	}

	function clearFieldErrors(detail) {
		var elt = mutationElement(detail);
		var form = elt && elt.closest ? elt.closest('form') : null;
		Array.prototype.forEach.call(fieldErrorSlots(form), function (slot) {
			slot.textContent = '';
			slot.hidden = true;
			var field = document.getElementById(slot.getAttribute('data-field-error'));
			if (field) field.removeAttribute('aria-invalid');
		});
	}

	function showFieldError(toast) {
		if (!toast || !toast.field || !toast.fieldMessage) return false;
		var field = document.getElementById(toast.field);
		var slot = Array.prototype.find.call(fieldErrorSlots(document), function (candidate) {
			return candidate.getAttribute('data-field-error') === toast.field;
		});
		if (!field || !slot) return false;
		slot.textContent = toast.fieldMessage;
		slot.hidden = false;
		field.setAttribute('aria-invalid', 'true');
		window.setTimeout(function () { field.focus(); }, 0);
		return true;
	}

	function showResult(toast) {
		if (showFieldError(toast) && !toast.message) {
			hideToast();
			return;
		}
		showToast(toast.level, toast.message || toast.fieldMessage);
	}

	document.body.addEventListener('showFlash', function (evt) {
		var d = evt.detail || {};
		showToast(d.level || 'info', d.message || '');
	});

	function clearFlashBanner() {
		var container = document.getElementById('flash-container');
		if (container) container.innerHTML = '';
	}

	document.addEventListener('htmx:beforeRequest', function (event) {
		if (!isMutation(event.detail)) return;
		clearFlashBanner();
		clearFieldErrors(event.detail);
		showToast('info', 'Working...', {persist: true});
	}, true);

	document.addEventListener('htmx:beforeSend', function (event) {
		disableMutationControls(event.detail);
	}, true);

	document.addEventListener('htmx:beforeSwap', function (event) {
		if (!isMutation(event.detail) || !targetIsFlashContainer(event.detail)) return;
		var xhr = event.detail.xhr;
		var parsed = isLoginResponse(xhr)
			? {level: 'error', message: 'Session expired. Sign in again.'}
			: parseAdminToastHeader(xhr) || parseFlashResponse(xhr ? xhr.responseText : '', xhr ? xhr.status : 200);
		event.detail.shouldSwap = false;
		event.detail.isError = false;
		markToastHandled(event.detail);
		showResult(parsed);
		refreshAfterSuccess(event.detail, parsed.level);
	}, true);

	document.addEventListener('htmx:afterRequest', function (event) {
		restoreMutationControls(event.detail);
		if (!isMutation(event.detail) || toastWasHandled(event.detail)) return;
		var xhr = event.detail.xhr;
		var serverToast = parseAdminToastHeader(xhr);
		if (serverToast) {
			showResult(serverToast);
			markToastHandled(event.detail);
			refreshAfterSuccess(event.detail, serverToast.level);
			return;
		}
		var failed = !event.detail.successful || (xhr && xhr.status >= 400) || isLoginResponse(xhr);
		showToast(failed ? 'error' : 'success', isLoginResponse(xhr) ? 'Session expired. Sign in again.' : failed ? 'Action failed.' : 'Done.');
		markToastHandled(event.detail);
	}, true);

	document.addEventListener('htmx:sendError', function (event) {
		if (requestVerb(event.detail) !== 'get') return;
		var path = event.detail.pathInfo && event.detail.pathInfo.finalRequestPath;
		if (path) window.location.assign(path);
	}, true);
})();
"#;

pub const COPY_TO_CLIPBOARD_SCRIPT: &str = r#"
window.__adminCopyToClipboard = function (text, btn, successLabel) {
	if (!navigator.clipboard || !btn) return;
	navigator.clipboard.writeText(text).then(function () {
		var original = btn.textContent;
		btn.textContent = successLabel || 'Copied!';
		setTimeout(function () { btn.textContent = original; }, 1500);
	});
};
"#;

pub const SH_LINK_REWRITE_SCRIPT: &str = r#"
(function () {
	if (window.location.search.indexOf('sh=1') === -1) return;
	function rewriteHref(el) {
		var href = el.getAttribute('href');
		if (!href || href.indexOf('sh=1') >= 0) return;
		if (href.charAt(0) === '#' || href.indexOf('javascript:') === 0 || href.indexOf('data:') === 0 || href.indexOf('mailto:') === 0) return;
		if (href.indexOf('://') >= 0) {
			try {
				var url = new URL(href);
				if (url.origin !== window.location.origin) return;
			} catch (e) {
				return;
			}
		}
		var sep = href.indexOf('?') >= 0 ? '&' : '?';
		el.setAttribute('href', href + sep + 'sh=1');
	}
	function rewriteAction(form) {
		var action = form.getAttribute('action');
		if (!action || action.indexOf('sh=1') >= 0) return;
		var sep = action.indexOf('?') >= 0 ? '&' : '?';
		form.setAttribute('action', action + sep + 'sh=1');
	}
	document.querySelectorAll('a[href]').forEach(rewriteHref);
	document.querySelectorAll('form[action]').forEach(rewriteAction);
	document.addEventListener('click', function (e) {
		var a = e.target.closest('a[href]');
		if (a) rewriteHref(a);
	}, true);
	document.addEventListener('submit', function (e) {
		var form = e.target.closest('form[action]');
		if (form) rewriteAction(form);
	}, true);
})();

"#;

pub const ENFORCEMENT_FIELDS_SCRIPT: &str = r#"
(function () {
	if (window.__larixyEnforcementFields) return;
	window.__larixyEnforcementFields = true;
	function codes(section, name) {
		var value = section.getAttribute(name);
		return value === null ? null : value.split(' ');
	}
	function syncReason(form, code) {
		form.querySelectorAll('[data-show-for-codes], [data-hide-for-codes]').forEach(function (section) {
			var showFor = codes(section, 'data-show-for-codes');
			var hideFor = codes(section, 'data-hide-for-codes');
			var shown = showFor ? showFor.indexOf(code) >= 0 : hideFor.indexOf(code) < 0;
			section.hidden = !shown;
			section.querySelectorAll('input, textarea, select').forEach(function (control) {
				control.disabled = !shown;
			});
		});
	}
	function syncChoice(form, name, value) {
		form.querySelectorAll('[data-show-for-' + name + ']').forEach(function (section) {
			var shown = codes(section, 'data-show-for-' + name).indexOf(value) >= 0;
			section.hidden = !shown;
			section.disabled = !shown;
		});
	}
	document.addEventListener('change', function (event) {
		var control = event.target;
		var form = control instanceof Element ? control.closest('form') : null;
		if (!form) return;
		if (control instanceof HTMLSelectElement && control.name === 'reason_code') {
			syncReason(form, control.value);
		} else if (control instanceof HTMLSelectElement && (control.name === 'resolution' || control.name === 'duration_hours')) {
			syncChoice(form, control.name, control.value);
		} else if (control instanceof HTMLInputElement && control.type === 'radio' && (control.name === 'basis' || control.name === 'limit' || control.name === 'source')) {
			syncChoice(form, control.name, control.value);
		}
	});
})();
"#;

pub const I18N_ES_SCRIPT: &str = r#"
(function () {
	if (window.__larixyI18nEs) return;
	window.__larixyI18nEs = true;

	var dict = {
		"Users": "Usuarios",
		"Guilds": "Servidores",
		"Applications": "Aplicaciones",
		"Moderation": "Moderación",
		"Reports": "Reportes",
		"Decisions": "Decisiones",
		"Explore review": "Explorar revisión",
		"Pending Registrations": "Registros Pendientes",
		"Pending registrations": "Registros pendientes",
		"Bulk Actions": "Acciones Masivas",
		"Message Tools": "Herramientas de Mensajes",
		"System DMs": "Mensajes Directos del Sistema",
		"Archives": "Archivos",
		"IP Bans": "Baneos de IP",
		"Email Bans": "Baneos de Correo",
		"Phrase Bans": "Baneos de Frases",
		"URL Blocklist": "Bloqueo de URLs",
		"URL Domain Blocklist": "Bloqueo de Dominios",
		"File SHA Blocklist": "Bloqueo de Archivos SHA",
		"Avatar Hash Blocklist": "Bloqueo de Hashes de Avatar",
		"Profile Substring Blocklist": "Bloqueo de Textos de Perfil",
		"Gateway": "Gateway",
		"Audit Logs": "Registros de Auditoría",
		"Audit Log": "Registro de Auditoría",
		"Jobs": "Trabajos",
		"Search Index": "Índice de Búsqueda",
		"Voice Regions": "Regiones de Voz",
		"Voice Servers": "Servidores de Voz",
		"Instance Config": "Configuración de Instancia",
		"Limit Config": "Configuración de Límites",
		"Badges": "Insignias",
		"Admin API Keys": "Claves API de Admin",
		"Gift Codes": "Códigos de Regalo",
		"Operators' Wall": "Muro de Operadores",
		"Operators' Wall Tools": "Herramientas de Operadores",
		"Operators Release List": "Lista de Versiones de Operadores",
		"Payment Disputes": "Disputas de Pago",
		"Lookup": "Búsqueda",
		"Content Tools": "Herramientas de Contenido",
		"User Bans": "Baneos de Usuarios",
		"Content Blocklists": "Listas de Bloqueo",
		"Observability": "Observabilidad",
		"Platform": "Plataforma",
		"Configuration": "Configuración",
		"Premium": "Premium",
		"Logout": "Cerrar sesión",
		"Log out": "Cerrar sesión",
		"Logged in as: ": "Conectado como: ",
		"Search": "Buscar",
		"Search users": "Buscar usuarios",
		"Search users...": "Buscar usuarios...",
		"Search guilds": "Buscar servidores",
		"Search guilds...": "Buscar servidores...",
		"Filter": "Filtrar",
		"Save": "Guardar",
		"Save changes": "Guardar cambios",
		"Save Changes": "Guardar cambios",
		"Cancel": "Cancelar",
		"Delete": "Eliminar",
		"Edit": "Editar",
		"Actions": "Acciones",
		"Action": "Acción",
		"Status": "Estado",
		"Created at": "Creado el",
		"Created At": "Creado el",
		"Created": "Creado",
		"Updated at": "Actualizado el",
		"Updated At": "Actualizado el",
		"Updated": "Actualizado",
		"Previous": "Anterior",
		"Next": "Siguiente",
		"← Previous": "← Anterior",
		"Next →": "Siguiente →",
		"Page": "Página",
		"of": "de",
		"Overview": "Visión general",
		"Settings": "Configuración",
		"Members": "Miembros",
		"Roles": "Roles",
		"Channels": "Canales",
		"Emojis": "Emojis",
		"Stickers": "Stickers",
		"Integrations": "Integraciones",
		"Account": "Cuenta",
		"Relationships": "Relaciones",
		"DM History": "Historial de MD",
		"Group DM": "MD Grupal",
		"Reason": "Razón",
		"Details": "Detalles",
		"Submit": "Enviar",
		"Confirm": "Confirmar",
		"Close": "Cerrar",
		"Username": "Nombre de usuario",
		"Email": "Correo electrónico",
		"User ID": "ID de usuario",
		"Guild ID": "ID de servidor",
		"Channel ID": "ID de canal",
		"Message ID": "ID de mensaje",
		"Target": "Objetivo",
		"Actor": "Autor",
		"Executor": "Ejecutor",
		"Enabled": "Habilitado",
		"Disabled": "Deshabilitado",
		"Active": "Activo",
		"Inactive": "Inactivo",
		"Pending": "Pendiente",
		"Completed": "Completado",
		"Success": "Éxito",
		"Failed": "Fallido",
		"Error": "Error",
		"Warning": "Advertencia",
		"None": "Ninguno",
		"Never": "Nunca",
		"Yes": "Sí",
		"No": "No",
		"All": "Todos",
		"Reset": "Restablecer",
		"Apply": "Aplicar",
		"Back": "Atrás",
		"Copy": "Copiar",
		"Copied!": "¡Copiado!",
		"Copied": "Copiado",
		"Download": "Descargar",
		"Upload": "Subir",
		"Create": "Crear",
		"New": "Nuevo",
		"Add": "Añadir",
		"Remove": "Quitar",
		"Revoke": "Revocar",
		"Ban": "Banear",
		"Unban": "Desbanear",
		"Kick": "Expulsar",
		"Mute": "Silenciar",
		"Unmute": "Desilenciar",
		"View": "Ver",
		"Inspect": "Inspeccionar",
		"Clear": "Limpiar",
		"Refresh": "Actualizar",
		"Generate": "Generar",
		"Send": "Enviar",
		"No results found": "No se encontraron resultados",
		"No records found": "No se encontraron registros",
		"No items to display": "No hay elementos para mostrar",
		"Sign in with": "Iniciar sesión con",
		"Skip to main content": "Saltar al contenido principal",
		"Open navigation menu": "Abrir menú de navegación",
		"Close sidebar": "Cerrar barra lateral",
		"Switch between light and dark theme": "Cambiar tema",
		"Are you sure?": "¿Estás seguro?",
		"This action cannot be undone.": "Esta acción no se puede deshacer.",
		"Joined": "Se unió",
		"Created Account": "Cuenta creada",
		"Features": "Características",
		"Voice Region": "Región de voz",
		"Owner": "Propietario",
		"Public": "Público",
		"Private": "Privado",
		"Discoverable": "Visible en Explorar",
		"NSFW": "NSFW",
		"Description": "Descripción",
		"Name": "Nombre",
		"Type": "Tipo",
		"Value": "Valor",
		"Expires": "Expira",
		"Expires At": "Expira el"
	};

	function translateNode(node) {
		if (!node) return;
		if (node.nodeType === 3) {
			var txt = node.nodeValue;
			var trimmed = txt.trim();
			if (trimmed && dict[trimmed]) {
				node.nodeValue = txt.replace(trimmed, dict[trimmed]);
			}
		} else if (node.nodeType === 1) {
			var tag = node.tagName.toLowerCase();
			if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'code' || tag === 'pre') return;

			if (node.hasAttribute('placeholder')) {
				var ph = node.getAttribute('placeholder').trim();
				if (dict[ph]) node.setAttribute('placeholder', dict[ph]);
			}
			if (node.hasAttribute('aria-label')) {
				var al = node.getAttribute('aria-label').trim();
				if (dict[al]) node.setAttribute('aria-label', dict[al]);
			}
			if (node.hasAttribute('title')) {
				var t = node.getAttribute('title').trim();
				if (dict[t]) node.setAttribute('title', dict[t]);
			}

			for (var child = node.firstChild; child; child = child.nextSibling) {
				translateNode(child);
			}
		}
	}

	function run() {
		if (document.body) translateNode(document.body);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run);
	} else {
		run();
	}

	document.addEventListener('htmx:afterSwap', function (e) {
		translateNode(e.detail.target || document.body);
	});
	document.addEventListener('htmx:afterSettle', function (e) {
		translateNode(e.detail.target || document.body);
	});

	if (window.MutationObserver && document.body) {
		var observer = new MutationObserver(function (mutations) {
			for (var i = 0; i < mutations.length; i++) {
				var m = mutations[i];
				for (var j = 0; j < m.addedNodes.length; j++) {
					translateNode(m.addedNodes[j]);
				}
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	}
})();
"#;
