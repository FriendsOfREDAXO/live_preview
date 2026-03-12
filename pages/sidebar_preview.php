<?php
/**
 * Live-Vorschau – Panel-Inhalt
 *
 * Verfügbare Variablen:
 * @var string $livePreviewUrl
 * @var int    $livePreviewArticleId
 * @var int    $livePreviewClang
 */
?>
<div id="rex-lp-panel" data-url="<?= rex_escape($livePreviewUrl) ?>">

    <div class="rex-lp-toolbar">

        <div class="rex-lp-devices btn-group btn-group-xs" role="group">
            <button type="button" class="btn btn-default rex-lp-device-btn active" data-device="desktop" title="<?= rex_i18n::msg('live_preview_device_desktop') ?>">
                <i class="rex-icon fa-desktop"></i>
            </button>
            <button type="button" class="btn btn-default rex-lp-device-btn" data-device="tablet" title="<?= rex_i18n::msg('live_preview_device_tablet') ?>">
                <i class="rex-icon fa-tablet"></i>
            </button>
            <button type="button" class="btn btn-default rex-lp-device-btn" data-device="mobile" title="<?= rex_i18n::msg('live_preview_device_mobile') ?>">
                <i class="rex-icon fa-mobile"></i>
            </button>
        </div>

        <div class="rex-lp-actions btn-group btn-group-xs" role="group">
            <button type="button" class="btn btn-default" id="rex-lp-modal-open" title="<?= rex_i18n::msg('live_preview_modal') ?>">
                <i class="rex-icon fa-arrows-alt"></i>
            </button>
            <button type="button" class="btn btn-default" id="rex-lp-expand" title="<?= rex_i18n::msg('live_preview_expand') ?>">
                <i class="rex-icon fa-expand"></i>
            </button>
            <button type="button" class="btn btn-default" id="rex-lp-refresh" title="<?= rex_i18n::msg('live_preview_refresh') ?>">
                <i class="rex-icon fa-refresh"></i>
            </button>
            <a href="<?= rex_escape($livePreviewUrl) ?>" target="_blank" class="btn btn-default" title="<?= rex_i18n::msg('live_preview_open_frontend') ?>">
                <i class="rex-icon fa-external-link"></i>
            </a>
        </div>

    </div>

    <div class="rex-lp-iframe-wrap">
        <iframe
            id="rex-lp-iframe"
            src="<?= rex_escape($livePreviewUrl) ?>"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        ></iframe>
    </div>

</div>

<!-- Live-Vorschau Modal -->
<div id="rex-lp-modal" role="dialog" aria-modal="true" aria-label="<?= rex_i18n::msg('live_preview_modal') ?>">
    <div id="rex-lp-modal-inner">

        <div id="rex-lp-modal-toolbar">
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-default rex-lp-modal-device-btn active" data-device="desktop" title="<?= rex_i18n::msg('live_preview_device_desktop') ?>">
                    <i class="rex-icon fa-desktop"></i> <?= rex_i18n::msg('live_preview_device_desktop') ?>
                </button>
                <button type="button" class="btn btn-default rex-lp-modal-device-btn" data-device="desktop-custom" title="Desktop (benutzerdefinierte Breite)">
                    <i class="rex-icon fa-arrows-h"></i>
                </button>
                <button type="button" class="btn btn-default rex-lp-modal-device-btn" data-device="tablet" title="<?= rex_i18n::msg('live_preview_device_tablet') ?>">
                    <i class="rex-icon fa-tablet"></i> <?= rex_i18n::msg('live_preview_device_tablet') ?>
                </button>
                <button type="button" class="btn btn-default rex-lp-modal-device-btn" data-device="mobile" title="<?= rex_i18n::msg('live_preview_device_mobile') ?>">
                    <i class="rex-icon fa-mobile"></i> <?= rex_i18n::msg('live_preview_device_mobile') ?>
                </button>
            </div>

            <div class="rex-lp-preset-wrap" id="rex-lp-preset-wrap">
                <button type="button" class="btn btn-default btn-sm rex-lp-preset-toggle" id="rex-lp-preset-toggle">
                    <i class="rex-icon fa-list"></i> <span id="rex-lp-preset-label" data-default="<?= rex_escape(rex_i18n::msg('live_preview_presets')) ?>"><?= rex_i18n::msg('live_preview_presets') ?></span> <span class="caret"></span>
                </button>
                <ul class="rex-lp-preset-menu" id="rex-lp-preset-menu">
                    <li class="rex-lp-preset-group"><?= rex_i18n::msg('live_preview_device_desktop') ?></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-full">Volle Breite <small>100%</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-5k">5K <small>5120px</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-4k">4K UHD <small>3840px</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-1920">Full HD <small>1920px</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-1440">QHD <small>1440px</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-1280">HD <small>1280px</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="desktop-1024">XGA <small>1024px</small></a></li>
                    <li class="rex-lp-preset-divider"></li>
                    <li class="rex-lp-preset-group"><?= rex_i18n::msg('live_preview_device_tablet') ?></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="ipad-mini">iPad mini <small>768×1024</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="ipad-air">iPad Air <small>820×1180</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="ipad-pro-11">iPad Pro 11" <small>1024×1366</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="samsung-tab-s9">Samsung Tab S9 <small>712×1138</small></a></li>
                    <li class="rex-lp-preset-divider"></li>
                    <li class="rex-lp-preset-group"><?= rex_i18n::msg('live_preview_device_mobile') ?></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="iphone-se">iPhone SE <small>375×667</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="iphone-15">iPhone 15 <small>390×844</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="iphone-15-pro">iPhone 15 Pro <small>393×852</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="iphone-15-pro-max">iPhone 15 Pro Max <small>430×932</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="samsung-s24">Samsung S24 <small>360×780</small></a></li>
                    <li><a href="#" class="rex-lp-preset-btn" data-preset="pixel-8">Google Pixel 8 <small>412×915</small></a></li>
                </ul>
            </div>

            <button type="button" class="btn btn-default btn-sm" id="rex-lp-modal-refresh" title="<?= rex_i18n::msg('live_preview_refresh') ?>">
                <i class="rex-icon fa-refresh"></i>
            </button>

            <span id="rex-lp-modal-dimensions"></span>

            <button type="button" class="btn btn-default btn-sm" id="rex-lp-modal-rotate" title="<?= rex_i18n::msg('live_preview_modal_rotate') ?>">
                <i class="rex-icon fa-repeat"></i>
            </button>

            <button type="button" class="btn btn-danger btn-sm" id="rex-lp-modal-close">
                <i class="rex-icon fa-times"></i> <?= rex_i18n::msg('live_preview_modal_close') ?>
            </button>
        </div>

        <div id="rex-lp-modal-stage">
            <div id="rex-lp-modal-frame-wrap">
                <iframe
                    id="rex-lp-modal-iframe"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                ></iframe>
                <div class="rex-lp-rh rex-lp-rh-e"  data-dir="e"></div>
                <div class="rex-lp-rh rex-lp-rh-s"  data-dir="s"></div>
                <div class="rex-lp-rh rex-lp-rh-se" data-dir="se"></div>
            </div>
            <span class="rex-lp-chalk rex-lp-chalk-w" id="rex-lp-chalk-w"></span>
            <span class="rex-lp-chalk rex-lp-chalk-h" id="rex-lp-chalk-h"></span>
            <div id="rex-lp-monitor-stand"></div>
        </div>

    </div>
</div>
