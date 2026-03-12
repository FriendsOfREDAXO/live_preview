<?php

namespace FriendsOfREDAXO\LivePreview;

/**
 * Live Preview – Toggle-API
 *
 * Speichert die aktiviert/deaktiviert-Präferenz eines Nutzers.
 * Aufruf: index.php?rex-api-call=live_preview_toggle&enabled=0|1
 *
 * @package FriendsOfREDAXO\LivePreview
 */
class LivePreviewToggleApi extends \rex_api_function
{
    /** Darf per GET aufgerufen werden */
    protected $published = true;

    public function execute(): \rex_api_result
    {
        \rex_response::cleanOutputBuffers();

        if (!\rex_backend_login::hasSession()) {
            \rex_response::setStatus(\rex_response::HTTP_UNAUTHORIZED);
            \rex_response::sendJson(['error' => 'Unauthorized']);
            exit;
        }

        $userId  = \rex::getUser()->getId();
        $enabled = (bool) \rex_request('enabled', 'int', 1);

        \rex_addon::get('live_preview')->setConfig('live_preview_enabled_' . $userId, $enabled);

        \rex_response::sendJson(['success' => true, 'enabled' => $enabled]);
        exit;
    }
}
