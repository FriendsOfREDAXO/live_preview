<?php

namespace FriendsOfREDAXO\LivePreview;

use rex;
use rex_addon;
use rex_article_revision;
use rex_backend_login;
use rex_clang;
use rex_response;

/**
 * Live Preview – API-Endpunkt
 *
 * Liefert die Frontend-URL für einen Artikel inkl. aktuellem rex_version-Status.
 * Aufruf: index.php?rex-api-call=live_preview_url&article_id=X&clang=Y
 *
 * @package FriendsOfREDAXO\LivePreview
 */
class LivePreviewUrlApi extends \rex_api_function
{
    /** Darf auch per GET aufgerufen werden */
    protected $published = true;

    public function execute(): \rex_api_result
    {
        rex_response::cleanOutputBuffers();

        // Nur für valide eingeloggte Backend-Nutzer
        $user = rex_backend_login::createUser();
        if (!$user instanceof \rex_user) {
            rex_response::setStatus(rex_response::HTTP_UNAUTHORIZED);
            rex_response::sendJson(['error' => 'Unauthorized']);
            exit;
        }

        $articleId = rex_request('article_id', 'int', 0);
        $clang     = rex_request('clang', 'int', rex_clang::getCurrentId());

        if ($articleId <= 0) {
            rex_response::setStatus(rex_response::HTTP_BAD_REQUEST);
            rex_response::sendJson(['error' => 'Invalid article_id']);
            exit;
        }

        $article = \rex_article::get($articleId, $clang);
        if (!$article instanceof \rex_article) {
            rex_response::setStatus(rex_response::HTTP_NOT_FOUND);
            rex_response::sendJson(['error' => 'Article not found']);
            exit;
        }

        if (!$user->getComplexPerm('clang')->hasPerm($clang)
            || !$user->getComplexPerm('structure')->hasCategoryPerm($article->getCategoryId())) {
            rex_response::setStatus(rex_response::HTTP_FORBIDDEN);
            rex_response::sendJson(['error' => 'Forbidden']);
            exit;
        }

        // Version aus Session lesen (gleiche Logik wie STRUCTURE_CONTENT_HEADER)
        $version = 0;
        $versionPlugin = rex_addon::get('structure')->getPlugin('version');
        if ($versionPlugin->isAvailable() && class_exists('rex_article_revision')) {
            $version = rex_article_revision::getSessionArticleRevision($articleId);
        }

        $url = rex_getUrl($articleId, $clang, $version > 0 ? ['rex_version' => $version] : [], '&');

        rex_response::sendJson([
            'url'       => $url,
            'version'   => $version,
            'articleId' => $articleId,
            'clang'     => $clang,
        ]);
        exit;
    }
}
