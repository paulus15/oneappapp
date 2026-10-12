<?php

/*
 * Router for PHP's built-in server, used ONLY by the end-to-end backend (test/e2e/backend.sh).
 *
 * It does what Laravel's own `artisan serve` router does, with one addition: the external PWA
 * checker answers requests for the reserved test host E2E_PWA_HOST (a `.example` name, which
 * never resolves on the Internet) from the local fixture folder test/e2e/fixtures/pwa, instead
 * of the network. Every other address still goes through the real checker, so its protections
 * (HTTPS on port 443 only, public IPs only, pinned DNS, revalidated redirects, size limit) are
 * unchanged and the backend code is not modified. The journey therefore no longer depends on
 * a third-party website being online.
 */

use App\Services\ExternalPwaChecker;
use Illuminate\Http\Request;

const E2E_PWA_HOST = 'demo.pwastore-e2e.example';

$publicPath = getcwd();
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '');
if ($uri !== '/' && file_exists($publicPath.$uri)) {
    return false;
}

define('LARAVEL_START', microtime(true));
require $publicPath.'/../vendor/autoload.php';
$app = require_once $publicPath.'/../bootstrap/app.php';

$app->bind(ExternalPwaChecker::class, fn () => new class extends ExternalPwaChecker
{
    public function fetch(string $url): array
    {
        [$host, $parts] = $this->validateUrl($url);
        if ($host !== E2E_PWA_HOST) {
            return parent::fetch($url);
        }
        $root = realpath(__DIR__.'/fixtures/pwa');
        $path = $parts['path'] ?? '/';
        $file = realpath($root.($path === '/' ? '/index.html' : $path));
        if ($file === false || ! str_starts_with($file, $root.DIRECTORY_SEPARATOR) || ! is_file($file)) {
            throw new RuntimeException('La ressource distante est indisponible.');
        }

        return ['body' => file_get_contents($file), 'url' => $url, 'csp' => []];
    }
});

$app->handleRequest(Request::capture());
