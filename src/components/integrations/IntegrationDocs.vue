<template>
  <!-- Static documentation. Code samples are plain text inside <pre><code> (no raw
       HTML injection): the browser shows them exactly as written. -->
  <article class="integration-docs" aria-labelledby="docs-title">
    <h2 id="docs-title">{{ ui('Documentation de l’API Intégrations') }}</h2>
    <p class="lead">{{
      ui(
        'L’API Intégrations permet à vos outils (GitHub Actions, scripts, intégration continue) de lire vos applications, de lancer des vérifications et d’envoyer des demandes de mise à jour. La modération reste humaine : rien n’est publié automatiquement.'
      )
    }}</p>
    <nav class="docs-toc" :aria-label="ui('Sommaire de la documentation')">
      <a v-for="item in toc" :key="item.id" :href="`#${item.id}`">{{
        item.label
      }}</a>
    </nav>

    <section id="docs-auth" class="docs-section">
      <h3>{{ ui('Authentification') }}</h3>
      <p>{{
        ui(
          'Créez un jeton dans l’onglet « Jetons d’accès », puis envoyez-le dans l’en-tête Authorization de chaque requête. Toutes les adresses commencent par :'
        )
      }}</p>
      <div class="snippet">
        <pre><code class="api-base">{{ apiBase }}</code></pre>
      </div>
      <div class="snippet">
        <pre><code>{{ authSnippet }}</code></pre>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="content_copy"
          class="copy-snippet"
          :label="ui('Copier')"
          :aria-label="ui('Copier l’exemple d’authentification')"
          @click="copy(authSnippet)"
        />
      </div>
      <p class="tip">{{
        ui(
          'Gardez le jeton dans un coffre de secrets (variables secrètes de votre CI). Il ne doit jamais apparaître dans votre code ni dans vos journaux.'
        )
      }}</p>
    </section>

    <section id="docs-abilities" class="docs-section">
      <h3>{{ ui('Permissions') }}</h3>
      <p>{{
        ui(
          'Chaque jeton n’a que les permissions cochées à sa création. Une requête qui demande une autre permission reçoit une erreur 403.'
        )
      }}</p>
      <dl class="abilities">
        <div v-for="option in abilities" :key="option.value">
          <dt
            ><code>{{ option.value }}</code> — {{ option.label }}</dt
          >
          <dd>{{ option.description }}</dd>
        </div>
      </dl>
      <p class="tip">{{
        ui(
          'checks:read suffit pour lire les résultats (GET /apps/{id}/checks/latest et /apps/{id}/checks/{requestId}) ; checks:write permet en plus d’en lancer. GET /apps/{id} n’inclut latest_check que pour un jeton qui a l’une de ces deux permissions.'
        )
      }}</p>
    </section>

    <section id="docs-endpoints" class="docs-section">
      <h3>{{ ui('Points d’accès') }}</h3>
      <div class="table-wrap">
        <table class="endpoints">
          <caption class="sr-only">{{
            ui('Points d’accès de l’API Intégrations')
          }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ ui('Méthode') }}</th>
              <th scope="col">{{ ui('Chemin') }}</th>
              <th scope="col">{{ ui('Permission') }}</th>
              <th scope="col">{{ ui('Rôle') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="endpoint in endpoints" :key="endpoint.key">
              <td
                ><code>{{ endpoint.method }}</code></td
              >
              <td
                ><code>{{ endpoint.path }}</code></td
              >
              <td
                ><code>{{ endpoint.ability }}</code></td
              >
              <td>{{ endpoint.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h4>{{ ui('Exemples avec curl') }}</h4>
      <div v-for="endpoint in endpoints" :key="endpoint.key" class="example">
        <p class="example-title">{{ endpoint.description }}</p>
        <div class="snippet">
          <pre><code>{{ endpoint.curl }}</code></pre>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="content_copy"
            class="copy-snippet"
            :label="ui('Copier')"
            :aria-label="
              ui('Copier l’exemple : {p0}', { p0: endpoint.description })
            "
            @click="copy(endpoint.curl)"
          />
        </div>
        <p v-if="endpoint.note" class="tip">{{ endpoint.note }}</p>
        <div v-if="endpoint.response" class="snippet">
          <pre><code :aria-label="ui('Exemple de réponse')">{{
            endpoint.response
          }}</code></pre>
        </div>
      </div>
      <p class="tip">{{
        ui(
          'Une demande de mise à jour envoyée par l’API suit le même circuit qu’une demande faite depuis la console : un modérateur la valide ou la refuse. Suivez son état avec GET /apps/{id}/submissions/{requestId} ou avec les webhooks.'
        )
      }}</p>
    </section>

    <section id="docs-errors" class="docs-section">
      <h3>{{ ui('Erreurs et limites') }}</h3>
      <p>{{
        ui(
          'Chaque jeton peut faire 60 requêtes par minute. Au-delà, l’API répond 429 avec un en-tête Retry-After qui indique combien de secondes attendre.'
        )
      }}</p>
      <div class="table-wrap">
        <table class="endpoints">
          <caption class="sr-only">{{ ui('Codes d’erreur') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ ui('Code') }}</th>
              <th scope="col">{{ ui('Signification') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in errors" :key="item.code">
              <td
                ><code>{{ item.code }}</code></td
              >
              <td>{{ item.text }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="docs-webhooks" class="docs-section">
      <h3>{{ ui('Webhooks') }}</h3>
      <p>{{
        ui(
          'Chaque événement est envoyé en POST, au format JSON, à l’adresse HTTPS de votre webhook. Répondez par un code 2xx en moins de 10 secondes.'
        )
      }}</p>
      <p>{{
        ui(
          'En cas d’échec, l’envoi est retenté après 1 min, 5 min, 30 min, 2 h puis 6 h (6 tentatives au total). Après 15 tentatives échouées d’affilée, le webhook est désactivé et la livraison en cours est marquée comme échouée : corrigez votre serveur puis réactivez-le.'
        )
      }}</p>
      <h4>{{ ui('Événements') }}</h4>
      <dl class="abilities">
        <div v-for="event in events" :key="event.value">
          <dt
            ><code>{{ event.value }}</code> — {{ event.label }}</dt
          >
          <dd>{{ event.description }}</dd>
        </div>
      </dl>
      <h4>{{ ui('En-têtes envoyés') }}</h4>
      <dl class="abilities">
        <div v-for="header in headers" :key="header.name">
          <dt
            ><code>{{ header.name }}</code></dt
          >
          <dd>{{ header.text }}</dd>
        </div>
      </dl>
      <h4>{{ ui('Contenu envoyé') }}</h4>
      <p class="tip">{{
        ui(
          'Le champ id (un UUID) est le même que l’en-tête X-PWAStore-Delivery ; il ne change ni lors des nouveaux essais ni lors d’un renvoi. Traitez chaque identifiant une seule fois. Le contenu de data dépend de l’événement :'
        )
      }}</p>
      <div
        v-for="sample in payloadSnippets"
        :key="sample.event"
        class="example"
      >
        <p class="example-title"
          ><code>{{ sample.event }}</code></p
        >
        <div class="snippet">
          <pre><code>{{ sample.code }}</code></pre>
        </div>
      </div>

      <h4>{{ ui('Vérifier la signature') }}</h4>
      <p>{{
        ui(
          'Calculez un HMAC-SHA256 du texte « t.corps brut » avec votre secret, comparez-le à v1 en temps constant, et refusez les envois dont l’horodatage t a plus de 5 minutes. Utilisez le corps brut, avant tout décodage JSON.'
        )
      }}</p>
      <p>{{
        ui(
          'La clé HMAC est le secret complet, préfixe whsec_ compris. Un en-tête absent ou mal formé doit être refusé.'
        )
      }}</p>
      <p class="tip">{{
        ui(
          'Renouvellement du secret : il n’y a pas de période de chevauchement. Dès qu’un nouveau secret est généré, l’ancien ne signe plus rien ; mettez votre serveur à jour aussitôt, sinon les envois suivants seront refusés par votre vérification.'
        )
      }}</p>
      <div
        v-for="sample in signatureSnippets"
        :key="sample.lang"
        class="example"
      >
        <p class="example-title">{{ sample.lang }}</p>
        <div class="snippet">
          <pre><code>{{ sample.code }}</code></pre>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="content_copy"
            class="copy-snippet"
            :label="ui('Copier')"
            :aria-label="ui('Copier l’exemple : {p0}', { p0: sample.lang })"
            @click="copy(sample.code)"
          />
        </div>
      </div>
    </section>

    <section id="docs-github" class="docs-section">
      <h3>{{ ui('GitHub Actions') }}</h3>
      <p>{{
        ui(
          'Ajoutez votre jeton dans les secrets du dépôt (Settings › Secrets and variables › Actions) sous le nom PWASTORE_TOKEN, puis ajoutez ce fichier dans .github/workflows/.'
        )
      }}</p>
      <p class="action-abilities">{{
        ui(
          'Permissions du jeton : checks:write ; en mode submit, ajoutez versions:write et versions:read. Pour seulement lire les résultats, checks:read suffit.'
        )
      }}</p>
      <div class="snippet">
        <pre><code>{{ githubSnippet }}</code></pre>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="content_copy"
          class="copy-snippet"
          :label="ui('Copier')"
          :aria-label="ui('Copier l’exemple GitHub Actions')"
          @click="copy(githubSnippet)"
        />
      </div>
      <p class="tip">{{
        ui(
          'Le chemin de l’action est à adapter : {p0} une fois l’action publiée, ou le chemin du dossier integrations/github-action du dépôt PWA Store.',
          { p0: ACTION_PATH }
        )
      }}</p>
      <div class="human-note" role="note">
        <q-icon name="gavel" size="22px" aria-hidden="true" />
        <p>{{
          ui(
            'La modération reste humaine : en mode submit, l’action envoie une demande de mise à jour et un modérateur la valide. Rien n’est publié automatiquement. Avec wait: false, l’action envoie la demande sans attendre la décision.'
          )
        }}</p>
      </div>
    </section>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { ui } from '@/i18n/text'
import { copyText } from '@/utils/growth'
import {
  abilityOptions,
  eventLabel,
  eventOptions,
  integrationsApiBase
} from '@/utils/integrations'

const $q = useQuasar()
const apiBase = integrationsApiBase()
const abilities = computed(() => abilityOptions())
const events = computed(() => [
  ...eventOptions(),
  {
    value: 'ping',
    label: eventLabel('ping'),
    description: ui('Événement de test envoyé par le bouton « Tester ».')
  }
])

const toc = computed(() => [
  { id: 'docs-auth', label: ui('Authentification') },
  { id: 'docs-abilities', label: ui('Permissions') },
  { id: 'docs-endpoints', label: ui('Points d’accès') },
  { id: 'docs-errors', label: ui('Erreurs et limites') },
  { id: 'docs-webhooks', label: ui('Webhooks') },
  { id: 'docs-github', label: ui('GitHub Actions') }
])

const lines = (...rows) => rows.join('\n')
const ACTION_PATH = '<votre-organisation>/pwastore-action@v1'
const DEFAULT_ACTION_API_URL = 'https://api.pwastore.online/api/integrations/v1'
const auth = 'Authorization: Bearer $PWASTORE_TOKEN'

const authSnippet = lines(
  `curl -s ${apiBase}/apps \\`,
  `  -H "${auth}" \\`,
  '  -H "Accept: application/json"'
)

const curl = (method, path) =>
  lines(
    `curl -s${method === 'GET' ? '' : ` -X ${method}`} ${apiBase}${path} \\`,
    `  -H "${auth}" \\`,
    '  -H "Accept: application/json"'
  )
const json = value => JSON.stringify(value, null, 2)
const CHECK_ID = '9b2f6c1e-4d7a-4c3b-8e21-5f0a7d9c3b64'

const endpoints = computed(() =>
  [
    {
      key: 'apps',
      method: 'GET',
      path: '/apps',
      ability: 'apps:read',
      description: ui('Lister les applications accessibles au jeton')
    },
    {
      key: 'app',
      method: 'GET',
      path: '/apps/{id}',
      ability: 'apps:read',
      description: ui('Lire une application et son statut')
    },
    {
      key: 'check',
      method: 'POST',
      path: '/apps/{id}/checks',
      ability: 'checks:write',
      description: ui('Lancer une vérification'),
      note: ui(
        'Répond 202 : la vérification est mise en file. Une seule vérification par application toutes les 5 minutes ; au-delà, 429 avec Retry-After.'
      ),
      response: json({
        data: { check_request_id: CHECK_ID, status: 'queued' }
      })
    },
    {
      key: 'check-status',
      method: 'GET',
      path: '/apps/{id}/checks/{requestId}',
      ability: 'checks:read | checks:write',
      description: ui('Suivre une vérification lancée'),
      note: ui(
        'requestId est le check_request_id reçu au lancement. status vaut queued (en attente), skipped (non effectuée, avec reason) ou done (terminée, avec ok, checked_at et error).'
      ),
      response: json({
        data: {
          status: 'done',
          id: 5120,
          request_id: CHECK_ID,
          trigger: 'api',
          ok: true,
          checked_at: '2026-10-15T09:31:12Z',
          error: null,
          report_summary: {
            final_url: 'https://mon-app.example.com/',
            manifest_found: true,
            content_changed: false,
            duration_ms: 840,
            warnings: []
          }
        }
      })
    },
    {
      key: 'check-latest',
      method: 'GET',
      path: '/apps/{id}/checks/latest',
      ability: 'checks:read | checks:write',
      description: ui('Lire le résultat de la dernière vérification')
    },
    {
      key: 'audit-latest',
      method: 'GET',
      path: '/apps/{id}/audits/latest',
      ability: 'audits:read',
      description: ui('Lire le dernier audit PWA')
    },
    {
      key: 'submit',
      method: 'POST',
      path: '/apps/{id}/submissions',
      ability: 'versions:write',
      description: ui('Soumettre une mise à jour à la modération'),
      note: ui(
        'Sans corps de requête. Répond 201 avec la demande créée ; 409 ou 422 avec le même message que dans la console (par exemple une demande déjà en cours). Limité à 5 demandes par minute et par compte (429).'
      ),
      response: json({
        data: {
          request_id: 7,
          id: 7,
          status: 'pending',
          kind: 'update',
          decision: null,
          review_note: null
        }
      })
    },
    {
      key: 'submission',
      method: 'GET',
      path: '/apps/{id}/submissions/{requestId}',
      ability: 'versions:read',
      description: ui('Suivre une demande de mise à jour'),
      response: json({
        data: {
          request_id: 7,
          id: 7,
          status: 'approved',
          kind: 'update',
          decision: 'approved',
          review_note: null,
          created_at: '2026-10-15T09:30:00Z',
          decided_at: '2026-10-15T14:05:00Z'
        }
      })
    }
  ].map(endpoint => ({
    ...endpoint,
    curl: curl(
      endpoint.method,
      endpoint.path
        .replace('{id}', '42')
        .replace(
          '{requestId}',
          endpoint.key === 'check-status' ? CHECK_ID : '7'
        )
    )
  }))
)

const errors = computed(() => [
  {
    code: '401',
    text: ui(
      'Jeton absent, invalide, expiré ou révoqué, ou compte propriétaire désactivé. Les essais répétés avec un jeton invalide sont limités par adresse IP.'
    )
  },
  {
    code: '403',
    text: ui(
      'Le jeton n’a pas la permission demandée, ou son propriétaire n’a plus d’accès développeur.'
    )
  },
  {
    code: '404',
    text: ui(
      'Application inconnue ou hors de la portée du jeton : la réponse est volontairement la même dans les deux cas.'
    )
  },
  {
    code: '409',
    text: ui(
      'Action impossible dans l’état actuel (par exemple une demande déjà en cours) : le message l’explique.'
    )
  },
  {
    code: '422',
    text: ui('Données refusées : le message précise le champ à corriger.')
  },
  {
    code: '429',
    text: ui(
      'Trop de requêtes : 60 par minute et par jeton, une vérification par application toutes les 5 minutes, 5 demandes de mise à jour par minute et par compte. Attendez le nombre de secondes indiqué par Retry-After.'
    )
  }
])

const headers = computed(() => [
  {
    name: 'X-PWAStore-Event',
    text: ui('Nom de l’événement, par exemple audit.completed.')
  },
  {
    name: 'X-PWAStore-Delivery',
    text: ui(
      'Identifiant unique de la livraison, identique à chaque nouvel essai : servez-vous-en pour ignorer un envoi déjà traité.'
    )
  },
  {
    name: 'X-PWAStore-Signature',
    text: ui(
      'Signature sous la forme t=<horodatage unix>,v1=<HMAC-SHA256 en hexadécimal>.'
    )
  }
])

const envelope = (id, event, data) =>
  json({ id, event, created_at: '2026-10-15T09:30:00+00:00', data })
const application = { id: 42, name: 'Mon application' }
const payloadSnippets = [
  {
    event: 'audit.completed',
    code: envelope('3f1c9a52-8d47-4b8e-9a1f-2c6e5d7b8a90', 'audit.completed', {
      application,
      audit: {
        id: 318,
        url: 'https://mon-app.example.com/',
        final_url: 'https://mon-app.example.com/',
        score: 92,
        reachable: true,
        installable: true,
        created_at: '2026-10-15T09:29:58.000000Z',
        summary: {
          by_status: { pass: 41, warn: 3, fail: 1, not_measured: 4 },
          by_severity: { critical: 0, high: 1, medium: 2, low: 1, info: 0 }
        }
      }
    })
  },
  {
    event: 'submission.rejected',
    code: envelope(
      'a7d2e4f1-0b3c-4e5d-8f9a-1b2c3d4e5f60',
      'submission.rejected',
      {
        application,
        submission: {
          id: 7,
          kind: 'update',
          status: 'changes_requested',
          decision: 'changes_requested',
          review_note: 'Ajoutez une politique de confidentialité.',
          created_at: '2026-10-15T09:30:00.000000Z',
          decided_at: '2026-10-15T14:05:00.000000Z'
        },
        online: false
      }
    )
  },
  {
    event: 'incident.opened',
    code: envelope('c0ffee00-1234-4abc-9def-0123456789ab', 'incident.opened', {
      application,
      incident: {
        id: 55,
        kind: 'down',
        error_code: 'timeout',
        started_at: '2026-10-15T09:20:00+00:00',
        confirmed_at: '2026-10-15T09:25:00+00:00',
        resolved_at: null
      }
    })
  },
  {
    event: 'ping',
    code: envelope('5e6f7a8b-9c0d-4e1f-a2b3-c4d5e6f7a8b9', 'ping', {
      application: null,
      webhook: { id: 3 }
    })
  }
]

const signatureSnippets = [
  {
    lang: 'Node.js',
    code: lines(
      "import crypto from 'node:crypto'",
      '',
      '// rawBody: the request body as received (Buffer or string), before JSON.parse.',
      '// secret: the full value, whsec_ prefix included.',
      'export function verifyPwaStoreSignature(rawBody, header, secret) {',
      "  if (typeof header !== 'string' || !header) return false",
      '  const parts = {}',
      "  for (const item of header.split(',')) {",
      "    const at = item.indexOf('=')",
      '    if (at > 0) parts[item.slice(0, at).trim()] = item.slice(at + 1).trim()',
      '  }',
      '  const t = Number(parts.t)',
      "  if (!Number.isInteger(t) || !/^[0-9a-f]{64}$/i.test(parts.v1 || '')) return false",
      '  if (Math.abs(Date.now() / 1000 - t) > 300) return false',
      '  const expected = crypto',
      "    .createHmac('sha256', secret)",
      '    .update(`${t}.${rawBody}`)',
      "    .digest('hex')",
      "  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'))",
      '}'
    )
  },
  {
    lang: 'PHP',
    code: lines(
      '<?php',
      "// $rawBody = file_get_contents('php://input');",
      "// $header = $_SERVER['HTTP_X_PWASTORE_SIGNATURE'] ?? '';",
      '// $secret: the full value, whsec_ prefix included.',
      'function verifyPwaStoreSignature(string $rawBody, string $header, string $secret): bool',
      '{',
      '    $parts = [];',
      "    foreach (explode(',', $header) as $item) {",
      "        [$key, $value] = array_pad(explode('=', $item, 2), 2, '');",
      '        $parts[trim($key)] = trim($value);',
      '    }',
      "    $t = $parts['t'] ?? '';",
      "    $v1 = $parts['v1'] ?? '';",
      "    if (! ctype_digit($t) || ! preg_match('/^[0-9a-f]{64}$/i', $v1)) {",
      '        return false;',
      '    }',
      '    if (abs(time() - (int) $t) > 300) {',
      '        return false;',
      '    }',
      "    $expected = hash_hmac('sha256', $t.'.'.$rawBody, $secret);",
      '    return hash_equals($expected, strtolower($v1));',
      '}'
    )
  },
  {
    lang: 'Python',
    code: lines(
      'import hashlib, hmac, re, time',
      '',
      '# raw_body: bytes of the request body, before json.loads.',
      '# secret: the full value, whsec_ prefix included.',
      'def verify_pwastore_signature(raw_body: bytes, header: str | None, secret: str) -> bool:',
      '    if not header:',
      '        return False',
      '    parts = {}',
      "    for item in header.split(','):",
      "        key, sep, value = item.partition('=')",
      '        if sep:',
      '            parts[key.strip()] = value.strip()',
      "    t, v1 = parts.get('t', ''), parts.get('v1', '')",
      "    if not t.isdigit() or not re.fullmatch(r'[0-9a-fA-F]{64}', v1):",
      '        return False',
      '    if abs(time.time() - int(t)) > 300:',
      '        return False',
      "    message = t.encode() + b'.' + raw_body",
      '    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()',
      '    return hmac.compare_digest(expected, v1.lower())'
    )
  }
]

const githubSnippet = lines(
  'name: PWA Store',
  '',
  'on:',
  '  push:',
  '    tags: ["v*"]',
  '',
  'jobs:',
  '  pwastore:',
  '    runs-on: ubuntu-latest',
  '    steps:',
  '      # à adapter : ou le chemin du dossier integrations/github-action du dépôt PWA Store',
  `      - uses: ${ACTION_PATH}`,
  '        with:',
  '          token: ${{ secrets.PWASTORE_TOKEN }}',
  '          application-id: 42',
  '          # check (par défaut) : lance une vérification',
  '          # submit : demande de mise à jour, validée par un modérateur',
  '          mode: submit',
  '          wait: "true"',
  '          timeout-minutes: "10"',
  `          # facultatif, par défaut ${DEFAULT_ACTION_API_URL}`,
  `          api-url: ${apiBase}`
)

async function copy(text) {
  if (await copyText(text))
    $q.notify({
      type: 'positive',
      message: ui('Copié dans le presse-papiers.')
    })
  else
    $q.notify({
      type: 'warning',
      message: ui('Copie impossible : sélectionnez la valeur pour la copier.')
    })
}

defineExpose({
  apiBase,
  endpoints,
  githubSnippet,
  payloadSnippets,
  signatureSnippets
})
</script>
<style scoped>
.integration-docs {
  display: grid;
  gap: 8px;
  max-width: 900px;
  min-width: 0;
}
.integration-docs h2 {
  margin: 0;
}
.lead {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.6;
}
.docs-toc {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.docs-toc a {
  padding: 6px 12px;
  color: var(--pwa-link, var(--pwa-primary));
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 999px;
}
.docs-toc a:focus-visible,
.docs-toc a:hover {
  border-color: var(--pwa-primary);
  outline: none;
}
.docs-section {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: var(--ui-radius-lg, 18px);
  scroll-margin-top: 80px;
}
.docs-section h3 {
  margin: 0;
  font-size: 18px;
}
.docs-section h4 {
  margin: 10px 0 0;
  font-size: 15px;
}
.docs-section p {
  margin: 0;
  line-height: 1.6;
}
.tip {
  color: var(--muted);
  font-size: 14px;
}
.snippet {
  position: relative;
  min-width: 0;
}
.snippet pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 10px;
}
.snippet pre code {
  white-space: pre;
}
.copy-snippet {
  margin-top: 4px;
}
.action-abilities {
  font-weight: 600;
}
.example-title {
  font-weight: 600;
}
.abilities {
  display: grid;
  gap: 8px;
  margin: 0;
}
.abilities dt {
  font-weight: 600;
}
.abilities dd {
  margin: 0;
  color: var(--muted);
}
.table-wrap {
  overflow-x: auto;
}
.endpoints {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.endpoints th,
.endpoints td {
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--outline);
}
.endpoints th {
  color: var(--muted);
  font-size: 12px;
}
.endpoints code {
  white-space: nowrap;
}
.human-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--pwa-primary) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--pwa-primary) 25%, transparent);
  border-radius: 12px;
}
.human-note .q-icon {
  flex: none;
  color: var(--pwa-primary);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
