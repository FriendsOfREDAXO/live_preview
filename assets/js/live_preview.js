/**
 * Live Preview – JavaScript
 * REDAXO AddOn – Panel in der nativen STRUCTURE_CONTENT_SIDEBAR (wie yrewrite)
 */
(function () {
    'use strict';

    var STORAGE_DEVICE      = 'rex_lp_device';
    var STORAGE_MODAL_DEVICE = 'rex_lp_modal_device';
    var refreshTimer         = null;
    var resizeTimer          = null;

    // Chrome-Padding der Device-Rahmen (aus CSS: padding top/right/bottom + left/right je Seite)
    var DEVICE_CHROME = {
        mobile : { padW: 28,  padH: 84  }, // padding-left+right=28 (14×2), top(52)+bottom(32)=84
        tablet : { padW: 60,  padH: 140 }  // padding-left+right=60 (30×2), top(60)+bottom(80)=140
    };

    // Resize-Status
    var resizeState = {
        active    : false,
        direction : null,
        startX    : 0,
        startY    : 0,
        startW    : 0,
        startH    : 0
    };
    var resizeHandlesBound    = false;
    var STORAGE_MODAL_PRESET  = 'rex_lp_modal_preset';

    // Float-Panel: LocalStorage-Keys
    var STORAGE_FLOAT_ACTIVE = 'rex_lp_float_active';
    var STORAGE_FLOAT_LEFT   = 'rex_lp_float_left';
    var STORAGE_FLOAT_TOP    = 'rex_lp_float_top';
    var STORAGE_FLOAT_WIDTH  = 'rex_lp_float_width';

    // Float-Drag-Zustand
    var floatDrag = {
        dragging    : false,
        active      : false,
        startX      : 0,
        startY      : 0,
        offsetX     : 0,
        offsetY     : 0,
        origParent  : null,
        origNextSib : null
    };

    var PRESET_MAP = {
        'desktop-full'      : { device: 'desktop-custom', w: null, h: null, label: 'Volle Breite' },
        'desktop-5k'        : { device: 'desktop-custom', w: 5120, h: 2880, label: '5K (5120)' },
        'desktop-4k'        : { device: 'desktop-custom', w: 3840, h: 2160, label: '4K UHD (3840)' },
        'desktop-1920'      : { device: 'desktop-custom', w: 1920, h: 1080, label: 'Full HD (1920)' },
        'desktop-1440'      : { device: 'desktop-custom', w: 1440, h: 900,  label: 'QHD (1440)' },
        'desktop-1280'      : { device: 'desktop-custom', w: 1280, h: 800,  label: 'HD (1280)' },
        'desktop-1024'      : { device: 'desktop-custom', w: 1024, h: 768,  label: 'XGA (1024)' },
        'ipad-mini'         : { device: 'tablet',  w: 768,  h: 1024, label: 'iPad mini' },
        'ipad-air'          : { device: 'tablet',  w: 820,  h: 1180, label: 'iPad Air' },
        'ipad-pro-11'       : { device: 'tablet',  w: 1024, h: 1366, label: 'iPad Pro 11\"' },
        'samsung-tab-s9'    : { device: 'tablet',  w: 712,  h: 1138, label: 'Samsung Tab S9' },
        'iphone-se'         : { device: 'mobile',  w: 375,  h: 667,  label: 'iPhone SE' },
        'iphone-15'         : { device: 'mobile',  w: 390,  h: 844,  label: 'iPhone 15' },
        'iphone-15-pro'     : { device: 'mobile',  w: 393,  h: 852,  label: 'iPhone 15 Pro' },
        'iphone-15-pro-max' : { device: 'mobile',  w: 430,  h: 932,  label: 'iPhone 15 Pro Max' },
        'samsung-s24'       : { device: 'mobile',  w: 360,  h: 780,  label: 'Samsung S24' },
        'pixel-8'           : { device: 'mobile',  w: 412,  h: 915,  label: 'Google Pixel 8' }
    };

    // -------------------------------------------------------------------------
    // Elemente
    // -------------------------------------------------------------------------

    function getPanel()   { return document.getElementById('rex-lp-panel'); }
    function getIframe()  { return document.getElementById('rex-lp-iframe'); }

    // -------------------------------------------------------------------------
    // Float-Panel – Drag-to-detach
    // -------------------------------------------------------------------------

    /**
     * Fügt den Drag-Handle (Grip-Icon) in die Toolbar ein.
     * Sicher mehrfach aufrufbar (idempotent).
     */
    function initDraggable() {
        var panel = getPanel();
        if (!panel) { return; }
        var toolbar = panel.querySelector('.rex-lp-toolbar');
        if (!toolbar || toolbar.querySelector('.rex-lp-drag-handle')) { return; }

        var handle = document.createElement('button');
        handle.type      = 'button';
        handle.className = 'rex-lp-drag-handle';
        handle.title     = 'Panel lösen und frei positionieren';
        handle.innerHTML = '<i class="fa fa-arrows" aria-hidden="true"></i>';
        toolbar.insertBefore(handle, toolbar.firstChild);

        // Einmaliger globaler mousedown-Listener (mehrfacher Aufruf wird durch Guard oben verhindert)
        document.addEventListener('mousedown', onFloatMouseDown);
    }

    function onFloatMouseDown(e) {
        if (e.button !== 0) { return; }
        var panel = getPanel();
        if (!panel) { return; }
        var panelEl = panel.closest('.panel');
        if (!panelEl) { return; }

        // Nur am Drag-Handle ablösen/verschieben (nicht am Titel, kläppt sonst zusammen)
        var fromHandle = e.target.closest('.rex-lp-drag-handle');
        if (!fromHandle) { return; }

        e.preventDefault();
        var rect = panelEl.getBoundingClientRect();
        floatDrag.dragging = true;
        floatDrag.startX   = e.clientX;
        floatDrag.startY   = e.clientY;
        floatDrag.offsetX  = e.clientX - rect.left;
        floatDrag.offsetY  = e.clientY - rect.top;

        if (!floatDrag.active) {
            floatDrag.origParent  = panelEl.parentElement;
            floatDrag.origNextSib = panelEl.nextSibling;
        }

        document.addEventListener('mousemove', onFloatMouseMove);
        document.addEventListener('mouseup',   onFloatMouseUp);
    }

    function onFloatMouseMove(e) {
        if (!floatDrag.dragging) { return; }
        var panel = getPanel();
        if (!panel) { return; }
        var panelEl = panel.closest('.panel');
        if (!panelEl) { return; }

        // Noch nicht floating: erst nach Schwellwert 20px ablösen
        if (!floatDrag.active) {
            var dx = Math.abs(e.clientX - floatDrag.startX);
            var dy = Math.abs(e.clientY - floatDrag.startY);
            if (dx < 20 && dy < 20) { return; }
            enterFloatMode(panelEl);
        }

        // Position dem Mauszeiger folgen lassen
        var left = Math.max(0, e.clientX - floatDrag.offsetX);
        var top  = Math.max(0, e.clientY - floatDrag.offsetY);
        panelEl.style.left = left + 'px';
        panelEl.style.top  = top  + 'px';
    }

    function onFloatMouseUp() {
        document.removeEventListener('mousemove', onFloatMouseMove);
        document.removeEventListener('mouseup',   onFloatMouseUp);
        if (!floatDrag.dragging) { return; }
        floatDrag.dragging = false;

        if (floatDrag.active) {
            var panel   = getPanel();
            var panelEl = panel && panel.closest('.panel');
            if (panelEl) {
                localStorage.setItem(STORAGE_FLOAT_ACTIVE, '1');
                localStorage.setItem(STORAGE_FLOAT_LEFT,   panelEl.style.left);
                localStorage.setItem(STORAGE_FLOAT_TOP,    panelEl.style.top);
                localStorage.setItem(STORAGE_FLOAT_WIDTH,  panelEl.offsetWidth + 'px');
            }
        }
    }

    /** Löst das Bootstrap-.panel aus der Sidebar und macht es fixed + frei positionierbar. */
    function enterFloatMode(panelEl) {
        floatDrag.active = true;
        var rect = panelEl.getBoundingClientRect();

        // Platzhalter in Sidebar
        var ph   = document.createElement('div');
        ph.id    = 'rex-lp-placeholder';
        floatDrag.origParent.insertBefore(ph, floatDrag.origNextSib);

        // Panel zu <body> verschieben
        document.body.appendChild(panelEl);
        panelEl.classList.add('rex-lp-floating');
        panelEl.style.width = rect.width + 'px';
        panelEl.style.left  = rect.left  + 'px';
        panelEl.style.top   = rect.top   + 'px';

        addFloatDockButton(panelEl);

        // Scale neu berechnen
        var device = localStorage.getItem(STORAGE_DEVICE) || 'desktop';
        setTimeout(function () { applyScale(device); }, 50);
    }

    /** Gibt das Panel zurück in die Sidebar an die ursprüngliche Stelle. */
    function exitFloatMode() {
        var panel = getPanel();
        if (!panel) { return; }
        var panelEl = panel.closest('.panel');
        if (!panelEl) { return; }

        var ph = document.getElementById('rex-lp-placeholder');
        if (ph && floatDrag.origParent) {
            floatDrag.origParent.insertBefore(panelEl, ph);
            ph.remove();
        } else if (floatDrag.origParent) {
            floatDrag.origParent.appendChild(panelEl);
        }

        panelEl.classList.remove('rex-lp-floating');
        panelEl.style.left  = '';
        panelEl.style.top   = '';
        panelEl.style.width = '';

        removeFloatDockButton(panelEl);

        floatDrag.active      = false;
        floatDrag.origParent  = null;
        floatDrag.origNextSib = null;

        localStorage.removeItem(STORAGE_FLOAT_ACTIVE);
        localStorage.removeItem(STORAGE_FLOAT_LEFT);
        localStorage.removeItem(STORAGE_FLOAT_TOP);
        localStorage.removeItem(STORAGE_FLOAT_WIDTH);

        var device = localStorage.getItem(STORAGE_DEVICE) || 'desktop';
        setTimeout(function () { applyScale(device); }, 50);
    }

    /** Stellt Float-Zustand aus localStorage wieder her (nach Seitenreload). */
    function restoreFloatState() {
        if (!localStorage.getItem(STORAGE_FLOAT_ACTIVE)) { return; }
        var panel = getPanel();
        if (!panel) { return; }
        var panelEl = panel.closest('.panel');
        if (!panelEl) { return; }

        floatDrag.origParent  = panelEl.parentElement;
        floatDrag.origNextSib = panelEl.nextSibling;
        floatDrag.active      = true;

        var ph = document.createElement('div');
        ph.id  = 'rex-lp-placeholder';
        floatDrag.origParent.insertBefore(ph, floatDrag.origNextSib);

        document.body.appendChild(panelEl);
        panelEl.classList.add('rex-lp-floating');
        panelEl.style.width = localStorage.getItem(STORAGE_FLOAT_WIDTH) || '380px';
        panelEl.style.left  = localStorage.getItem(STORAGE_FLOAT_LEFT)  || '20px';
        panelEl.style.top   = localStorage.getItem(STORAGE_FLOAT_TOP)   || '80px';

        addFloatDockButton(panelEl);
    }

    function addFloatDockButton(panelEl) {
        if (panelEl.querySelector('.rex-lp-dock-btn')) { return; }
        var heading = panelEl.querySelector('.panel-heading');
        if (!heading) { return; }

        var btn       = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'rex-lp-dock-btn';
        btn.title     = 'Zurück in die Sidebar';
        btn.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            exitFloatMode();
        });
        // Toggle ist tief verschachtelt (<h3><a>...<label>) – in dessen Parent einfügen
        var toggle = heading.querySelector('.rex-lp-header-toggle');
        if (toggle) {
            toggle.parentNode.insertBefore(btn, toggle);
        } else {
            heading.appendChild(btn);
        }
    }

    function removeFloatDockButton(panelEl) {
        var btn = panelEl.querySelector('.rex-lp-dock-btn');
        if (btn) {
            btn.remove();
        }
    }

    // -------------------------------------------------------------------------
    // Init
    // -------------------------------------------------------------------------

    function init() {
        var panel = getPanel();
        if (!panel) {
            return;
        }

        initDraggable();
        restoreFloatState();

        // Modal aus der Sidebar herauslösen und direkt in <body> hängen,
        // damit es nicht vom REDAXO-Sidebar-Opacity-Effekt (mouseleave) betroffen ist.
        var modal = document.getElementById('rex-lp-modal');
        if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        // Gespeichertes Gerät wiederherstellen
        var savedDevice = localStorage.getItem(STORAGE_DEVICE) || 'desktop';
        setDevice(savedDevice, true);

        bindEvents(panel);
        bindResizeHandles();

        // Neu skalieren wenn sich die Panel-Breite ändert
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                var device = (getPanel() && getPanel().dataset.livePreviewDevice) || 'desktop';
                applyScale(device);
                var modal = document.getElementById('rex-lp-modal');
                if (modal && modal.classList.contains('rex-lp-modal-open')) {
                    var curDevice = getModalCurrentDevice();
                    if (curDevice === 'desktop-custom') {
                        var mIframe = document.getElementById('rex-lp-modal-iframe');
                        var targetW = mIframe && mIframe.style.width ? parseFloat(mIframe.style.width) : 1280;
                        applyCustomDesktopScale(targetW);
                    } else {
                        applyModalScale(curDevice);
                    }
                }
            }, 100);
        });
    }

    // -------------------------------------------------------------------------
    // Gerätesimulation
    // -------------------------------------------------------------------------

    var DEVICE_WIDTHS = { desktop: 1280, tablet: 768, mobile: 375 };

    function setDevice(device, silent) {
        var panel = getPanel();
        if (!panel) { return; }

        panel.classList.remove('rex-lp-device-tablet', 'rex-lp-device-mobile');
        if (device === 'tablet' || device === 'mobile') {
            panel.classList.add('rex-lp-device-' + device);
        }
        panel.dataset.livePreviewDevice = device;

        panel.querySelectorAll('.rex-lp-device-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.device === device);
        });

        applyScale(device);

        if (!silent) {
            localStorage.setItem(STORAGE_DEVICE, device);
        }
    }

    function applyScale(device) {
        var panel  = getPanel();
        var iframe = getIframe();
        if (!panel || !iframe) { return; }

        var wrap        = panel.querySelector('.rex-lp-iframe-wrap');
        var targetWidth = DEVICE_WIDTHS[device] || 1280;
        var wrapWidth   = wrap ? wrap.offsetWidth : targetWidth;

        // Alle Geräte: iframe auf Zielbreite setzen, dann auf Panel-Breite skalieren
        var scale = Math.min(1, wrapWidth / targetWidth);
        iframe.style.width           = targetWidth + 'px';
        iframe.style.height          = Math.round(wrap.offsetHeight / scale) + 'px';
        iframe.style.transform       = 'scale(' + scale + ')';
        iframe.style.transformOrigin = 'top left';
    }

    // -------------------------------------------------------------------------
    // Expand / Collapse
    // -------------------------------------------------------------------------

    function toggleExpand() {
        var panel = getPanel();
        if (!panel) { return; }

        var expanded = panel.classList.toggle('rex-lp-expanded');
        var panelEl  = panel.closest('.panel');

        if (panelEl) {
            // Sticky-Positionierung beim eigenen Panel
            panelEl.classList.toggle('rex-lp-sticky', expanded);

            // Alle Geschwister-.panel-Elemente im selben Container aus-/einblenden
            var container = panelEl.parentElement;
            if (container) {
                Array.prototype.forEach.call(container.querySelectorAll('.panel'), function (sibling) {
                    if (sibling !== panelEl) {
                        sibling.style.display = expanded ? 'none' : '';
                    }
                });
            }
        }

        // Nach CSS-Transition (0.25s) neu skalieren, damit iframe-Höhe stimmt
        var device = panel.dataset.livePreviewDevice || localStorage.getItem(STORAGE_DEVICE) || 'desktop';
        setTimeout(function () { applyScale(device); }, 270);
    }

    // -------------------------------------------------------------------------
    // Aktualisieren
    // -------------------------------------------------------------------------

    function refreshIframe() {
        var iframe = getIframe();
        if (!iframe) { return; }
        try {
            iframe.contentWindow.location.reload();
        } catch (e) {
            // Cross-Origin-Fallback: src neu setzen
            var src = iframe.src;
            iframe.src = '';
            setTimeout(function () { iframe.src = src; }, 50);
        }
    }

    function scheduleRefresh(delay) {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshIframe, delay || 800);
    }

    // -------------------------------------------------------------------------
    // Modal
    // -------------------------------------------------------------------------

    /** Liefert das aktive Device des Modals ('desktop'|'desktop-custom'|'tablet'|'mobile') */
    function getModalCurrentDevice() {
        var modal = document.getElementById('rex-lp-modal');
        if (!modal) { return 'desktop'; }
        if (modal.classList.contains('rex-lp-device-mobile'))  { return 'mobile'; }
        if (modal.classList.contains('rex-lp-device-tablet'))  { return 'tablet'; }
        if (modal.classList.contains('rex-lp-desktop-custom')) { return 'desktop-custom'; }
        return 'desktop';
    }

    /** Aktualisiert die Pixel-Anzeige in der Modal-Toolbar UND die Chalk-Labels in der Bühne */
    function updateDimensionDisplay(screenW, screenH) {
        var el    = document.getElementById('rex-lp-modal-dimensions');
        var cw    = document.getElementById('rex-lp-chalk-w');
        var ch    = document.getElementById('rex-lp-chalk-h');
        if (!screenW) {
            if (el) { el.textContent = ''; }
            if (cw) { cw.textContent = ''; }
            if (ch) { ch.textContent = ''; }
            return;
        }
        var wTxt = Math.round(screenW) + '\u00a0px';
        var hTxt = Math.round(screenH) + '\u00a0px';
        if (el) { el.textContent = Math.round(screenW) + '\u00d7' + Math.round(screenH) + '\u00a0px'; }
        if (cw) { cw.textContent = wTxt; }
        if (ch) { ch.textContent = hTxt; }

        // Chalk-Labels relativ zum Stage positionieren (Elemente sind jetzt Stage-Kinder)
        var wrap  = document.getElementById('rex-lp-modal-frame-wrap');
        var stage = document.getElementById('rex-lp-modal-stage');
        if (wrap && stage && cw && ch) {
            var wRect = wrap.getBoundingClientRect();
            var sRect = stage.getBoundingClientRect();
            var st    = stage.scrollTop;
            var sl    = stage.scrollLeft;
            // Breiten-Label: unterhalb, horizontal zentriert
            cw.style.top  = Math.round(wRect.bottom - sRect.top  + st + 10) + 'px';
            cw.style.left = Math.round(wRect.left   - sRect.left + sl + wRect.width / 2) + 'px';
            // Höhen-Label: rechts neben dem Wrap, vertikal zentriert
            ch.style.top  = Math.round(wRect.top    - sRect.top  + st + wRect.height / 2) + 'px';
            ch.style.left = Math.round(wRect.right  - sRect.left + sl + 14) + 'px';
        }
    }

    /** Entfernt den Resize-Zustand vom frame-wrap */
    function resetModalResize() {
        var wrap    = document.getElementById('rex-lp-modal-frame-wrap');
        var mIframe = document.getElementById('rex-lp-modal-iframe');
        if (wrap) {
            wrap.classList.remove('rex-lp-resizing');
            wrap.style.width  = '';
            wrap.style.height = '';
        }
        if (mIframe) {
            mIframe.style.width           = '';
            mIframe.style.height          = '';
            mIframe.style.transform       = '';
            mIframe.style.transformOrigin = '';
        }
    }

    // -------------------------------------------------------------------------
    // Preset-Dropdown
    // -------------------------------------------------------------------------

    function togglePresetMenu(e) {
        if (e) { e.stopPropagation(); }
        var menu = document.getElementById('rex-lp-preset-menu');
        if (menu) { menu.classList.toggle('rex-lp-preset-menu-open'); }
    }

    function closePresetMenu() {
        var menu = document.getElementById('rex-lp-preset-menu');
        if (menu) { menu.classList.remove('rex-lp-preset-menu-open'); }
    }

    function resetPresetLabel() {
        var labelEl = document.getElementById('rex-lp-preset-label');
        if (labelEl) { labelEl.textContent = labelEl.dataset.default || 'Presets'; }
        document.querySelectorAll('.rex-lp-preset-btn').forEach(function (btn) {
            btn.classList.remove('active');
        });
        localStorage.removeItem(STORAGE_MODAL_PRESET);
    }

    /**
     * Simuliert einen bestimmten Viewport im desktop-custom Modus via transform:scale.
     * Der iframe bekommt targetW/targetH als echte Dimensionen und wird scale-to-fit
     * in die Stage eingepasst – der Rahmen ändert seine Proportionen je Preset.
     *
     * @param {number|null} targetW  Ziel-Viewport-Breite px (null = volle Breite)
     * @param {number|null} targetH  Ziel-Viewport-Höhe px  (null = 16:9-Fallback)
     */
    function applyCustomDesktopScale(targetW, targetH) {
        var mIframe = document.getElementById('rex-lp-modal-iframe');
        var wrap    = document.getElementById('rex-lp-modal-frame-wrap');
        var stage   = document.getElementById('rex-lp-modal-stage');
        if (!mIframe || !wrap || !stage) { return; }

        var availW = stage.offsetWidth  - 160;         // 80px links + rechts
        var availH = Math.max(200, stage.offsetHeight - 200); // 60px top + 140px bottom

        if (!targetW || targetW <= 0) {
            // Volle Breite: kein Scale, iframe füllt verfügbaren Bereich
            targetW = availW;
            targetH = availH;
        }
        if (!targetH || targetH <= 0) {
            targetH = Math.round(targetW * 9 / 16);
        }

        // Scale-to-fit: kleinster Faktor damit der komplette Viewport in availW × availH passt
        var scale    = Math.min(availW / targetW, availH / targetH);
        var displayW = Math.round(targetW * scale);
        var displayH = Math.round(targetH * scale);

        wrap.style.width  = displayW + 'px';
        wrap.style.height = displayH + 'px';
        wrap.classList.add('rex-lp-resizing');

        mIframe.style.width           = targetW + 'px';
        mIframe.style.height          = targetH + 'px';
        mIframe.style.transform       = 'scale(' + scale + ')';
        mIframe.style.transformOrigin = 'top left';

        // Monitor-Stand als separates Element positionieren (nicht ::after, da overflow:hidden)
        var stand = document.getElementById('rex-lp-monitor-stand');
        if (stand) {
            var wrapRect  = wrap.getBoundingClientRect();
            var stageRect = stage.getBoundingClientRect();
            stand.style.top       = Math.round(wrapRect.bottom - stageRect.top) + 'px';
            stand.style.left      = Math.round(wrapRect.left + wrapRect.width / 2 - stageRect.left) + 'px';
            stand.style.transform = 'translateX(-50%)';
        }

        updateDimensionDisplay(targetW, targetH);
    }

    function applyPreset(presetKey) {
        var preset = PRESET_MAP[presetKey];
        if (!preset) { return; }

        var modal = document.getElementById('rex-lp-modal');
        var wrap  = document.getElementById('rex-lp-modal-frame-wrap');
        if (!modal || !wrap) { return; }

        setModalDevice(preset.device, true);

        if (preset.device === 'desktop-custom') {
            // Viewport-Simulation: iframe auf Zielbreite/-höhe, via scale-to-fit einpassen
            applyCustomDesktopScale(preset.w || null, preset.h || null);
        } else {
            // Tablet / Mobile: direkte Dimensionen inkl. Device-Chrome
            var chrome = DEVICE_CHROME[preset.device] || { padW: 0, padH: 0 };
            wrap.style.width  = (preset.w + chrome.padW) + 'px';
            wrap.style.height = (preset.h + chrome.padH) + 'px';
            wrap.classList.add('rex-lp-resizing');
            updateDimensionDisplay(preset.w, preset.h);
        }

        document.querySelectorAll('.rex-lp-preset-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.preset === presetKey);
        });
        var labelEl = document.getElementById('rex-lp-preset-label');
        if (labelEl) { labelEl.textContent = preset.label; }

        localStorage.setItem(STORAGE_MODAL_PRESET, presetKey);
        closePresetMenu();
    }

    /** Tauscht Breite und Höhe des aktuellen Device-Frames (Portrait ↔ Landscape) */
    function rotateModal() {
        var wrap   = document.getElementById('rex-lp-modal-frame-wrap');
        var device = getModalCurrentDevice();
        if (!wrap || device === 'desktop') { return; }

        var chrome  = DEVICE_CHROME[device];
        var curW    = wrap.offsetWidth;
        var curH    = wrap.offsetHeight;
        var screenW = curW - chrome.padW;
        var screenH = curH - chrome.padH;

        // Dimensionen einfrieren + Resize-Klasse setzen
        wrap.style.width  = (screenH + chrome.padW) + 'px';
        wrap.style.height = (screenW + chrome.padH) + 'px';
        wrap.classList.add('rex-lp-resizing');
        updateDimensionDisplay(screenH, screenW);
    }

    function openModal() {
        var panel   = getPanel();
        var modal   = document.getElementById('rex-lp-modal');
        var mIframe = document.getElementById('rex-lp-modal-iframe');
        if (!modal || !mIframe || !panel) { return; }

        var src = panel.dataset.url || '';

        // Erst Modal einblenden, damit offsetWidth/Height korrekt sind
        modal.classList.add('rex-lp-modal-open');
        document.body.classList.add('rex-lp-modal-active');
        document.body.style.overflow = 'hidden';

        // Gerät setzen + skalieren + src laden – alles nach einem Render-Tick
        var savedDevice = localStorage.getItem(STORAGE_MODAL_DEVICE) || 'desktop';
        setTimeout(function () {
            var savedPreset = localStorage.getItem(STORAGE_MODAL_PRESET);
            if (savedPreset && PRESET_MAP[savedPreset]) {
                applyPreset(savedPreset);
            } else {
                setModalDevice(savedDevice, true);
            }
            mIframe.src = src;
        }, 0);
    }

    function closeModal() {
        var modal = document.getElementById('rex-lp-modal');
        if (!modal) { return; }
        modal.classList.remove('rex-lp-modal-open', 'rex-lp-desktop-custom');
        document.body.classList.remove('rex-lp-modal-active');
        document.body.style.overflow = '';
        resetModalResize();
        updateDimensionDisplay(0, 0);
        closePresetMenu();
    }

    function setModalDevice(device, silent) {
        var modal   = document.getElementById('rex-lp-modal');
        var stage   = document.getElementById('rex-lp-modal-stage');
        if (!modal) { return; }

        // Alle Device-Klassen entfernen
        modal.classList.remove('rex-lp-device-tablet', 'rex-lp-device-mobile', 'rex-lp-desktop-custom');
        if (device === 'tablet' || device === 'mobile') {
            modal.classList.add('rex-lp-device-' + device);
        } else if (device === 'desktop-custom') {
            modal.classList.add('rex-lp-desktop-custom');
        }

        modal.querySelectorAll('.rex-lp-modal-device-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.device === device);
        });

        // Reset zuerst, dann Modus anlegen
        resetModalResize();
        applyModalScale(device);

        // Pixel-Anzeige
        if (device === 'desktop-custom') {
            applyCustomDesktopScale(1280, 800);
        } else if (device === 'tablet' || device === 'mobile') {
            var chrome = DEVICE_CHROME[device];
            setTimeout(function () {
                var w = document.getElementById('rex-lp-modal-frame-wrap');
                if (w) {
                    updateDimensionDisplay(
                        w.offsetWidth  - chrome.padW,
                        w.offsetHeight - chrome.padH
                    );
                }
            }, 20);
        } else {
            updateDimensionDisplay(0, 0);
        }

        if (!silent) {
            localStorage.setItem(STORAGE_MODAL_DEVICE, device);
        }
    }

    function applyModalScale(device) {
        var mIframe = document.getElementById('rex-lp-modal-iframe');
        var wrap    = document.getElementById('rex-lp-modal-frame-wrap');
        var stage   = document.getElementById('rex-lp-modal-stage');
        if (!mIframe || !wrap || !stage) { return; }

        if (device === 'desktop') {
            // Vollbild: CSS übernimmt width:100% / height:100% – kein inline style nötig
        } else if (device === 'desktop-custom') {
            // Viewport-Simulation via transform:scale – wird von applyCustomDesktopScale gesetzt
        } else {
            // Tablet/Mobile: CSS übernimmt den Device-Rahmen
            wrap.style.width              = '';
            wrap.style.height             = '';
            mIframe.style.width           = '';
            mIframe.style.height          = '';
            mIframe.style.transform       = '';
            mIframe.style.transformOrigin = '';
        }
    }

    function refreshModalIframe() {
        var mIframe = document.getElementById('rex-lp-modal-iframe');
        if (!mIframe) { return; }
        try {
            mIframe.contentWindow.location.reload();
        } catch (e) {
            var src = mIframe.src;
            mIframe.src = '';
            setTimeout(function () { mIframe.src = src; }, 50);
        }
    }

    // -------------------------------------------------------------------------
    // Resize Handles (Modal – Tablet/Mobile)
    // -------------------------------------------------------------------------

    function bindResizeHandles() {
        if (resizeHandlesBound) { return; }
        resizeHandlesBound = true;

        document.addEventListener('mousedown', function (e) {
            var handle = e.target.closest('.rex-lp-rh[data-dir]');
            if (!handle) { return; }
            var wrap = document.getElementById('rex-lp-modal-frame-wrap');
            if (!wrap) { return; }

            e.preventDefault();
            e.stopPropagation();

            resizeState.startW = wrap.offsetWidth;
            resizeState.startH = wrap.offsetHeight;

            // Im desktop-custom Modus: startW = simulierter Viewport (iframe-Breite)
            var currentDevice = getModalCurrentDevice();
            if (currentDevice === 'desktop-custom') {
                var mIframeStart = document.getElementById('rex-lp-modal-iframe');
                resizeState.startW = mIframeStart && mIframeStart.style.width
                    ? parseFloat(mIframeStart.style.width)
                    : wrap.offsetWidth;
            }

            wrap.style.width   = wrap.offsetWidth + 'px';
            wrap.style.height  = wrap.offsetHeight + 'px';
            wrap.classList.add('rex-lp-resizing');

            resizeState.active    = true;
            resizeState.direction = handle.dataset.dir;
            resizeState.startX    = e.clientX;
            resizeState.startY    = e.clientY;

            var stage = document.getElementById('rex-lp-modal-stage');
            if (stage) { stage.classList.add('rex-lp-stage-resizing'); }
        });

        document.addEventListener('mousemove', function (e) {
            if (!resizeState.active) { return; }
            var wrap = document.getElementById('rex-lp-modal-frame-wrap');
            if (!wrap) { return; }

            var dx  = e.clientX - resizeState.startX;
            var dy  = e.clientY - resizeState.startY;
            var dir = resizeState.direction;

            // desktop-custom: Viewport-Breite (iframe) anpassen, Scale neu berechnen
            var device = getModalCurrentDevice();
            if (device === 'desktop-custom') {
                if (dir === 'e' || dir === 'se') {
                    var newTargetW = Math.max(320, resizeState.startW + dx);
                    // Aktuelles Aspektverhältnis beibehalten
                    var iframeEl   = document.getElementById('rex-lp-modal-iframe');
                    var currentH   = iframeEl && iframeEl.style.height
                        ? parseFloat(iframeEl.style.height)
                        : Math.round(newTargetW * 9 / 16);
                    applyCustomDesktopScale(newTargetW, currentH);
                    // Label live updaten
                    var labelEl = document.getElementById('rex-lp-preset-label');
                    if (labelEl) { labelEl.textContent = Math.round(newTargetW) + '\u00a0px'; }
                }
                return;
            }

            var newW = resizeState.startW;
            var newH = resizeState.startH;

            if (dir === 'e' || dir === 'se') { newW = Math.max(280, resizeState.startW + dx); }
            if (dir === 's' || dir === 'se') { newH = Math.max(300, resizeState.startH + dy); }

            wrap.style.width  = newW + 'px';
            wrap.style.height = newH + 'px';

            var chrome = DEVICE_CHROME[device] || { padW: 0, padH: 0 };
            updateDimensionDisplay(newW - chrome.padW, newH - chrome.padH);
        });

        document.addEventListener('mouseup', function () {
            if (!resizeState.active) { return; }
            resizeState.active = false;
            var stage = document.getElementById('rex-lp-modal-stage');
            if (stage) { stage.classList.remove('rex-lp-stage-resizing'); }
        });
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    function bindEvents(panel) {
        // Klick-Delegation
        document.addEventListener('click', function (e) {
            var refreshBtn      = e.target.closest('#rex-lp-refresh');
            var expandBtn       = e.target.closest('#rex-lp-expand');
            var deviceBtn       = e.target.closest('.rex-lp-device-btn');
            var modalOpenBtn    = e.target.closest('#rex-lp-modal-open');
            var modalCloseBtn   = e.target.closest('#rex-lp-modal-close');
            var modalRefreshBtn = e.target.closest('#rex-lp-modal-refresh');
            var modalDeviceBtn  = e.target.closest('.rex-lp-modal-device-btn');
            var modalRotateBtn  = e.target.closest('#rex-lp-modal-rotate');
            var presetToggleBtn = e.target.closest('#rex-lp-preset-toggle');
            var presetBtn       = e.target.closest('.rex-lp-preset-btn');

            if (refreshBtn) {
                e.preventDefault();
                refreshIframe();
            } else if (expandBtn) {
                e.preventDefault();
                toggleExpand();
            } else if (deviceBtn && deviceBtn.closest('#rex-lp-panel')) {
                e.preventDefault();
                setDevice(deviceBtn.dataset.device);
            } else if (modalOpenBtn) {
                e.preventDefault();
                openModal();
            } else if (modalCloseBtn) {
                e.preventDefault();
                closeModal();
            } else if (modalRefreshBtn) {
                e.preventDefault();
                refreshModalIframe();
            } else if (modalDeviceBtn) {
                e.preventDefault();
                resetPresetLabel();
                setModalDevice(modalDeviceBtn.dataset.device);
            } else if (modalRotateBtn) {
                e.preventDefault();
                rotateModal();
            } else if (presetToggleBtn) {
                e.preventDefault();
                togglePresetMenu(e);
            } else if (presetBtn) {
                e.preventDefault();
                applyPreset(presetBtn.dataset.preset);
            }
        });

        // Klick auf den Backdrop schließt das Modal / schließt Preset-Menü
        document.addEventListener('click', function (e) {
            var modal = document.getElementById('rex-lp-modal');
            if (modal && modal.classList.contains('rex-lp-modal-open') && e.target === modal) {
                closeModal();
                return;
            }
            var presetWrap = document.getElementById('rex-lp-preset-wrap');
            if (presetWrap && !presetWrap.contains(e.target)) {
                closePresetMenu();
            }
        });

        // ESC schließt das Modal
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { closeModal(); }
        });

        // pjax:end: REDAXO hat neu navigiert (Artikel/Version wechsel, Slice speichern).
        // Sidebar liegt AUSSERHALB des PJAX-Containers → data-url ist veraltet.
        // Daher: neue article_id + clang aus der aktuellen URL lesen,
        // API aufrufen, iframe.src auf die korrekte Frontend-URL setzen.
        $(document).on('pjax:end', function () {
            var iframe  = getIframe();
            var panel   = getPanel();
            if (!iframe || !panel) { return; }

            var search    = window.location.search;
            var params    = new window.URLSearchParams(search);
            var articleId = params.get('article_id');
            var clang     = params.get('clang') || '1';
            var apiUrl    = (window.rex && window.rex.livePreviewApiUrl) ? window.rex.livePreviewApiUrl : null;

            if (!articleId || !apiUrl) { return; }

            $.getJSON(apiUrl, { article_id: articleId, clang: clang })
                .done(function (data) {
                    if (data && data.url) {
                        iframe.src = data.url;

                        // Modal-iframe ebenfalls aktualisieren wenn offen
                        var modal   = document.getElementById('rex-lp-modal');
                        var mIframe = document.getElementById('rex-lp-modal-iframe');
                        if (modal && modal.classList.contains('rex-lp-modal-open') && mIframe) {
                            mIframe.src = data.url;
                        }
                    }
                });

            // Device-Skalierung neu berechnen (PJAX kann Layout-Breite ändern)
            var device = localStorage.getItem(STORAGE_DEVICE) || 'desktop';
            setDevice(device, true);
            setTimeout(function () { applyScale(device); }, 200);
        });

        // XHR-Intercept: Slice-Saves per AJAX (nicht PJAX) → iframe neu laden
        // Nur für rex-api-call (PJAX-Navigationen werden via pjax:end behandelt)
        var origOpen = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function (method, url) {
            this.addEventListener('load', function () {
                var urlStr = String(url || '');
                if (urlStr.indexOf('rex-api-call') !== -1) {
                    scheduleRefresh(800);
                }
            });
            return origOpen.apply(this, arguments);
        };
    }

    // -------------------------------------------------------------------------
    // Panel Enable/Disable Toggle (per-User-Präferenz via API)
    // -------------------------------------------------------------------------

    document.addEventListener('click', function (e) {
        // Verhindert, dass der Panel-Header (Bootstrap-Collapse) durch den Toggle-Klick getriggert wird
        if (e.target.closest('.rex-lp-header-toggle')) {
            e.stopPropagation();
        }
    }, true); // capture phase

    document.addEventListener('change', function (e) {
        var toggle = e.target.closest('.rex-lp-enable-toggle');
        if (!toggle) { return; }
        var enabled = toggle.checked;

        // iframe sofort laden (data-src → src) oder entladen (src → about:blank)
        var panel = document.getElementById('rex-lp-panel');
        if (panel) {
            var iframe = panel.querySelector('#rex-lp-iframe');
            if (iframe) {
                if (enabled) {
                    // Kein Reload nötig: data-src ist immer aktuell
                    iframe.src = iframe.dataset.src || '';
                } else {
                    iframe.src = 'about:blank';
                }
            }
        }

        // Bootstrap-Panel kollabieren / aufklappen
        var section = toggle.closest('.panel');
        if (section) {
            var collapseEl = section.querySelector('.panel-collapse');
            if (collapseEl) {
                $(collapseEl).collapse(enabled ? 'show' : 'hide');
            }
        }

        // Präferenz asynchron speichern (kein Reload nötig)
        fetch(toggle.dataset.url + '&enabled=' + (enabled ? 1 : 0));
    });

    // -------------------------------------------------------------------------
    // Start – jQuery ist im REDAXO-Backend immer verfügbar
    // -------------------------------------------------------------------------

    $(function () { init(); });

}());
