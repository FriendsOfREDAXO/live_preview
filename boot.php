<?php

/** @var rex_addon $this */

if (!rex::isBackend() || !rex::getUser()) {
    return;
}

// CSS & JS nur im Backend laden
rex_view::addCssFile($this->getAssetsUrl('css/live_preview.css'));
rex_view::addJsFile($this->getAssetsUrl('js/live_preview.js'));

// Namespaced API-Klassen registrieren (seit REDAXO 5.17 unterstützt)
rex_api_function::register('live_preview_url', \FriendsOfREDAXO\LivePreview\LivePreviewUrlApi::class);
rex_api_function::register('live_preview_toggle', \FriendsOfREDAXO\LivePreview\LivePreviewToggleApi::class);

// API-URL für JS bereitstellen
rex_view::setJsProperty('livePreviewApiUrl', rex_url::backendController(['rex-api-call' => 'live_preview_url']));

// Sidebar-Panel im Struktur-Content-Bereich
rex_extension::register('STRUCTURE_CONTENT_SIDEBAR', static function (rex_extension_point $ep) {
    $params     = $ep->getParams();
    $subject    = $ep->getSubject();
    $articleId  = (int) ($params['article_id'] ?? 0);
    $clang      = (int) ($params['clang'] ?? rex_clang::getCurrentId());

    if ($articleId <= 0) {
        return $subject;
    }

    // Version ermitteln – exakt wie das structure/version-Plugin:
    // Wenn das Version-Plugin verfügbar ist, Session-Wert lesen;
    // rex_set_version im Request hat Vorrang (gleiche Logik wie STRUCTURE_CONTENT_HEADER).
    // Ohne Version-Plugin immer Live (0) zeigen.
    $version = 0; // LIVE als sicherer Default

    $versionPlugin = rex_addon::get('structure')->getPlugin('version');
    if ($versionPlugin->isAvailable() && class_exists('rex_article_revision')) {
        // STRUCTURE_CONTENT_HEADER hat zu diesem Zeitpunkt (Zeile 442 in content.php)
        // bereits die Session aktualisiert – wir lesen den frischen Wert.
        $version = rex_article_revision::getSessionArticleRevision($articleId);

        // Falls rex_set_version im aktuellen Request steckt, direkt auswerten
        // (defensiv, falls HEADER noch nicht gefeuert hat)
        $newVersion = rex_request('rex_set_version', 'int', -1);
        if (rex_article_revision::LIVE === $newVersion) {
            $version = rex_article_revision::LIVE;
        } elseif (rex_article_revision::WORK === $newVersion) {
            $version = rex_article_revision::WORK;
        }
    }

    // Frontend-URL mit korrekter Version ermitteln
    $url = rex_getUrl($articleId, $clang, $version > 0 ? ['rex_version' => $version] : [], '&');
    if ('' === $url) {
        return $subject;
    }

    // Panel-Inhalt aus Include holen (gibt HTML-String zurück)
    // User-Präferenz für das Panel lesen (Default: aktiviert)
    $userId             = rex::getUser()->getId();
    $livePreviewEnabled = (bool) rex_addon::get('live_preview')->getConfig('live_preview_enabled_' . $userId, true);
    $toggleUrl          = rex_url::backendController(['rex-api-call' => 'live_preview_toggle']);
    $toggleChecked      = $livePreviewEnabled ? ' checked="checked"' : '';

    // Panel-Inhalt immer rendern (iframe ist immer im DOM, src nur wenn aktiviert)
    $panel = (static function () use ($url, $articleId, $clang, $livePreviewEnabled): string {
        $livePreviewUrl       = $url;
        $livePreviewArticleId = $articleId;
        $livePreviewClang     = $clang;
        ob_start();
        include rex_path::addon('live_preview', 'pages/sidebar_preview.php');
        return (string) ob_get_clean();
    })();

    $panelTitle = '<i class="rex-icon fa-eye"></i> ' . rex_i18n::msg('live_preview_title')
        . '<label class="rex-lp-header-toggle rex-lp-toggle-pill" onclick="event.stopPropagation()" title="' . rex_escape(rex_i18n::msg('live_preview_toggle_title')) . '">'
        . '<input type="checkbox" class="rex-lp-enable-toggle"' . $toggleChecked . ' data-url="' . rex_escape($toggleUrl) . '">'
        . '<span class="rex-lp-toggle-slider"></span>'
        . '</label>';

    // REDAXO-Standard-Panel (wie yrewrite)
    $fragment = new rex_fragment();
    $fragment->setVar('title', $panelTitle, false);
    $fragment->setVar('body', $panel, false);
    $fragment->setVar('collapse', true);
    $fragment->setVar('collapsed', !$livePreviewEnabled);
    $content = $fragment->parse('core/page/section.php');

    return $subject . $content;
});
