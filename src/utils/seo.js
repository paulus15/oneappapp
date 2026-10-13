export const SITE_URL = 'https://pwastore.online'
export const SITE_NAME = 'PWAStore'
// Absolute URL: link previews ignore relative paths.
export const SITE_IMAGE = `${SITE_URL}/brand/pwastore-social.png`

// Only public landing pages belong in the static sitemap. Dynamic listings are added at build time.
export const PUBLIC_PAGES = {
  '/': {
    fr: [
      'PWAStore — Découvrez les applications web progressives (PWA)',
      'Découvrez PWAStore, le catalogue d’applications web progressives. Explorez les PWA par catégorie et trouvez des applications pour mobile et ordinateur.'
    ],
    en: [
      'PWAStore — Discover progressive web apps (PWAs)',
      'Discover PWAStore, the progressive web app catalogue. Explore PWAs by category and find apps for mobile and desktop.'
    ]
  },
  '/applications': {
    fr: [
      'Applications PWA : le catalogue | PWAStore',
      'Parcourez les applications web progressives sur PWAStore. Comparez les fiches, les fonctionnalités et les avis pour choisir votre prochaine PWA.'
    ],
    en: [
      'PWA app catalogue | PWAStore',
      'Browse progressive web apps on PWAStore. Explore app details, features and reviews to choose your next PWA.'
    ]
  },
  '/categories': {
    fr: [
      'Catégories d’applications PWA | PWAStore',
      'Explorez les catégories de PWAStore et trouvez des applications web progressives adaptées à vos besoins.'
    ],
    en: [
      'PWA app categories | PWAStore',
      'Explore PWAStore categories and find progressive web apps that fit your needs.'
    ]
  },
  '/rankings': {
    fr: [
      'Classements des applications PWA | PWAStore',
      'Découvrez les classements PWAStore : applications populaires, nouveautés et PWA les mieux notées par la communauté.'
    ],
    en: [
      'PWA app rankings | PWAStore',
      'Explore PWAStore rankings: popular apps, new releases and PWAs rated by the community.'
    ]
  },
  '/popular': {
    fr: [
      'Applications PWA populaires | PWAStore',
      'Découvrez les applications web progressives populaires du catalogue PWAStore et consultez leurs fiches.'
    ],
    en: [
      'Popular PWA apps | PWAStore',
      'Discover popular progressive web apps in the PWAStore catalogue and explore their details.'
    ]
  },
  '/recommended': {
    fr: [
      'Applications PWA recommandées | PWAStore',
      'Découvrez les applications recommandées sur PWAStore et trouvez une PWA adaptée à vos usages.'
    ],
    en: [
      'Recommended PWA apps | PWAStore',
      'Explore recommended apps on PWAStore and find a PWA for your needs.'
    ]
  },
  '/trending': {
    fr: [
      'Applications PWA tendance | PWAStore',
      'Explorez les applications web progressives tendance sur PWAStore et découvrez de nouveaux services.'
    ],
    en: [
      'Trending PWA apps | PWAStore',
      'Explore trending progressive web apps on PWAStore and discover new services.'
    ]
  },
  '/developers': {
    fr: [
      'Publier une PWA : espace développeurs | PWAStore',
      'Présentez votre application web progressive sur PWAStore. Découvrez la publication, la validation et les outils destinés aux développeurs.'
    ],
    en: [
      'Publish a PWA: for developers | PWAStore',
      'List your progressive web app on PWAStore. Learn about publication, review and developer tools.'
    ]
  },
  '/about': {
    fr: [
      'À propos de PWAStore | Catalogue d’applications PWA',
      'Découvrez PWAStore, une plateforme pour explorer les applications web progressives et rencontrer leurs développeurs.'
    ],
    en: [
      'About PWAStore | Progressive web app catalogue',
      'Learn about PWAStore, a platform for discovering progressive web apps and their developers.'
    ]
  },
  '/help': {
    fr: [
      'Aide : utiliser et installer une PWA | PWAStore',
      'Consultez l’aide PWAStore pour découvrir les PWA, utiliser le catalogue et comprendre l’installation des applications web progressives.'
    ],
    en: [
      'Help: using and installing PWAs | PWAStore',
      'Read PWAStore help to discover PWAs, use the catalogue and understand progressive web app installation.'
    ]
  },
  '/contact': {
    fr: [
      'Contacter PWAStore | Assistance',
      'Contactez l’équipe PWAStore pour une question sur le catalogue, votre compte ou la publication d’une application.'
    ],
    en: [
      'Contact PWAStore | Support',
      'Contact the PWAStore team about the catalogue, your account or publishing an app.'
    ]
  },
  '/publishing-rules': {
    fr: [
      'Règles de publication des PWA | PWAStore',
      'Consultez les règles de publication et les exigences de qualité pour proposer votre application web progressive sur PWAStore.'
    ],
    en: [
      'PWA publishing rules | PWAStore',
      'Read the publishing rules and quality requirements for submitting a progressive web app to PWAStore.'
    ]
  },
  '/privacy': {
    fr: [
      'Confidentialité et données personnelles | PWAStore',
      'Consultez les informations de PWAStore sur la confidentialité et le traitement des données personnelles.'
    ],
    en: [
      'Privacy and personal data | PWAStore',
      'Read PWAStore information about privacy and personal data processing.'
    ]
  },
  '/terms': {
    fr: [
      'Conditions d’utilisation | PWAStore',
      'Consultez les conditions d’utilisation de la plateforme PWAStore.'
    ],
    en: [
      'Terms of use | PWAStore',
      'Read the terms of use for the PWAStore platform.'
    ]
  }
}

export function plainDescription(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

export function routeSeo(route, locale = 'fr', details = {}) {
  const path = (route.path || '/').replace(/\/+$/, '') || '/'
  const language = locale === 'en' ? 'en' : 'fr'
  const copy = PUBLIC_PAGES[path]?.[language]
  const dynamic =
    /^\/(apps\/\d+|categories\/[^/]+|collections\/[^/]+|publishers\/\d+|entities\/\d+)$/.test(
      path
    )
  const privatePage = !!route.meta?.requiresAuth || (!copy && !dynamic)
  // Search/filter combinations have no independent editorial content. Tracking parameters are canonicalized.
  const filtered = Object.keys(route.query || {}).some(
    key => !/^(utm_.+|gclid|fbclid|from)$/.test(key)
  )
  const noindex = privatePage || filtered || details.noindex === true
  const canonical = `${SITE_URL}${path}`
  const title =
    details.title ||
    copy?.[0] ||
    (dynamic
      ? `Applications web progressives | ${SITE_NAME}`
      : `${language === 'fr' ? 'PWAStore : compte ou page indisponible' : 'PWAStore: account or unavailable page'}`)
  const description = plainDescription(
    details.description || copy?.[1] || PUBLIC_PAGES['/'][language][1]
  )
  const graph =
    !noindex && path === '/'
      ? [
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: SITE_NAME,
            alternateName: 'PWA Store',
            url: `${SITE_URL}/`,
            inLanguage: language
          },
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            alternateName: 'PWA Store',
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/brand/pwa-store-icon.png`
          }
        ]
      : []
  if (!noindex && details.name && dynamic) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: `${SITE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: details.name,
          item: canonical
        }
      ]
    })
  }
  return {
    title,
    description,
    canonical,
    noindex,
    image: SITE_IMAGE,
    language,
    graph
  }
}

export function applySeo(seo, doc = document) {
  doc.title = seo.title
  const meta = (attribute, key, value) => {
    let tag = doc.head.querySelector(`meta[${attribute}="${key}"]`)
    if (!tag) {
      tag = doc.createElement('meta')
      tag.setAttribute(attribute, key)
      doc.head.append(tag)
    }
    tag.setAttribute('content', value)
  }
  meta('name', 'description', seo.description)
  meta(
    'name',
    'robots',
    seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'
  )
  for (const [key, value] of Object.entries({
    title: seo.title,
    description: seo.description,
    url: seo.canonical,
    image: seo.image,
    'image:alt': SITE_NAME,
    'image:width': '1200',
    'image:height': '630',
    'image:type': 'image/png',
    site_name: SITE_NAME,
    type: 'website',
    locale: seo.language === 'en' ? 'en_US' : 'fr_FR'
  }))
    meta('property', `og:${key}`, value)
  for (const [key, value] of Object.entries({
    card: 'summary_large_image',
    title: seo.title,
    description: seo.description,
    image: seo.image
  }))
    meta('name', `twitter:${key}`, value)
  let canonical = doc.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = doc.createElement('link')
    canonical.rel = 'canonical'
    doc.head.append(canonical)
  }
  canonical.href = seo.canonical
  doc.getElementById('pwastore-structured-data')?.remove()
  if (seo.graph.length) {
    const script = doc.createElement('script')
    script.id = 'pwastore-structured-data'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': seo.graph
    }).replace(/</g, '\\u003c')
    doc.head.append(script)
  }
}
