#!/bin/sh
# Starts an isolated Laravel backend for end-to-end tests on a dedicated database.
# Mails go to the log so tests can read one-time codes; nothing is sent.
set -e
ROUTER="$(cd "$(dirname "$0")" && pwd)/backend-router.php"
cd "${E2E_BACKEND_DIR:-$HOME/LaravelProjects/oneapp}"
export DB_CONNECTION=mysql DB_DATABASE=oneapp_e2e MAIL_MAILER=log MAIL_LOG_CHANNEL=single \
  QUEUE_CONNECTION=sync CACHE_STORE=array APP_ENV=local PWA_CORS_ORIGINS='https://127.0.0.1:9124' \
  PWA_FRONTEND_URL=https://127.0.0.1:9124 PWA_E2E_HTTPS=1 PWA_BUILD_UPLOADS=true
DB_DATABASE=mysql php artisan tinker --execute 'DB::statement("CREATE DATABASE IF NOT EXISTS oneapp_e2e CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");' >/dev/null
php artisan migrate:fresh --force >/dev/null
php artisan tinker --execute '
$admin = App\Models\User::create(["name" => "Admin E2E", "email" => "admin@e2e.test", "password" => Hash::make("Admin-pass-123"), "role" => "admin"]);
$admin->forceFill(["email_verified_at" => now()])->save();
App\Models\Category::create(["name" => "Outils", "slug" => "outils", "is_active" => true]);
' >/dev/null
# Same as `php artisan serve`, through a router that serves the test PWA (fixtures/pwa) for the
# reserved host demo.pwastore-e2e.example without any network access. See backend-router.php.
# The built-in server's connection log goes to storage/logs/e2e-server.log, not the test report.
cd public
exec php -S 127.0.0.1:8011 "$ROUTER" 2>>../storage/logs/e2e-server.log
