export default {
  store: {
    nav: {
      primary: 'Main navigation'
    },
    hero: {
      eyebrow: 'The universal platform',
      line1: 'One installation.',
      line2: 'Every platform.',
      lead: 'Discover, try and use modern web apps.',
      explore: 'Explore apps',
      becomeDeveloper: 'Become a developer',
      phone1: 'Install anywhere.',
      phone2: 'Open instantly.'
    },
    search: {
      resultsFor: 'Results for “{query}”',
      clear: 'Clear search',
      kicker: 'Search',
      count: 'No apps found | {n} app found | {n} apps found',
      empty: 'No app matches. Try other filters or keywords.'
    },
    filters: {
      platform: 'Platform',
      price: 'Price',
      sort: 'Sort by',
      reset: 'Reset',
      allPlatforms: 'All platforms',
      allPrices: 'Any price',
      free: 'Free',
      paid: 'Paid'
    },
    sort: {
      latest: 'Newest',
      downloads: 'Downloads',
      rating: 'Average rating',
      price_asc: 'Price: low to high',
      price_desc: 'Price: high to low',
      name: 'Name (A → Z)'
    },
    home: {
      featured: 'Featured',
      featuredKicker: 'Picked by our team',
      trending: 'Trending',
      trendingKicker: 'Right now',
      latest: 'New releases',
      latestKicker: 'Just published',
      recommended: 'Recommended',
      recommendedKicker: 'For you',
      collectionKicker: 'Collection',
      categories: 'Popular categories',
      categoriesKicker: 'Browse',
      discover: 'Discover more',
      discoverKicker: 'Catalogue',
      emptyTitle: 'The Store is getting ready',
      emptyText: 'The first published apps will appear here.',
      developerTitle: 'Do you build apps?',
      developerText:
        'Publish your PWAs on PWA Store and follow their review from your workspace.',
      learnMore: 'Learn more'
    },
    features: {
      label: 'Why PWA Store',
      modern: {
        title: 'Modern web apps',
        text: 'Open them in the browser, and install them when your device allows it.'
      },
      verified: {
        title: 'Verified publishers',
        text: 'Every publisher and every app is reviewed before publication.'
      },
      reviews: {
        title: 'Reviews from real accounts',
        text: 'Ratings come from registered users; no rating is ever made up.'
      },
      africa: {
        title: 'Made in Africa',
        text: 'A platform built for the world.'
      }
    },
    row: {
      previous: 'Previous',
      next: 'Next',
      seeAll: 'See all',
      seeAllOf: 'See all: {title}'
    },
    card: {
      iconAlt: '{name} icon'
    },
    featured: {
      cta: 'Discover'
    },
    empty: {
      default: 'No apps yet.'
    },
    categories: {
      eyebrow: 'Catalogue',
      title: 'Categories',
      lead: 'Browse published apps by theme.',
      count: 'No apps | {n} app | {n} apps',
      empty: 'No categories yet.',
      error: 'Categories could not be loaded. Try again.'
    },
    apps: {
      all: {
        eyebrow: 'Catalogue',
        title: 'Apps',
        lead: 'Every app published on PWA Store.'
      },
      popular: {
        eyebrow: 'Must-haves',
        title: 'Popular apps',
        lead: 'The apps rated highest by the community.'
      },
      trending: {
        eyebrow: 'Right now',
        title: 'Trending',
        lead: 'The apps installed the most lately.'
      },
      recommended: {
        eyebrow: 'PWA Store picks',
        title: 'Recommended',
        lead: 'Apps chosen for their quality and reliability.'
      },
      searchPlaceholder: 'Search the catalogue…',
      searchLabel: 'Search for an app',
      categoryFilter: 'Filter by category',
      allCategories: 'All',
      count: 'No apps | {n} app | {n} apps',
      empty: 'The first published apps will appear here.',
      emptyFiltered: 'No app matches. Try another search or category.',
      error: 'Apps could not be loaded. Try again.'
    },
    rankings: {
      eyebrow: 'Best of the Store',
      title: 'Top charts',
      lead: 'The apps that stand out, computed from real data.',
      tabs: {
        popular: 'Popular',
        trending: 'Trending',
        new: 'New',
        top_rated: 'Top rated'
      },
      hint: {
        popular: 'Based on installations and user ratings.',
        trending: 'Based on installations over the last 7 days.',
        new: 'The latest published apps.',
        top_rated: 'Apps with at least 3 reviews.'
      },
      empty: {
        popular: 'No app is ranked here yet.',
        trending: 'No recent installations yet.',
        new: 'No published apps yet.',
        top_rated: 'No app has enough reviews to be ranked yet.'
      },
      emptyTitle: 'Nothing to rank yet',
      soonTitle: 'Top charts are coming soon',
      soonText:
        'They will be computed from real installations and reviews. Meanwhile, browse the catalogue.',
      errorTitle: 'Charts unavailable',
      errorText: 'The service is not responding right now. Try again.',
      browse: 'Browse apps',
      reviews: '({n} reviews) | ({n} review) | ({n} reviews)'
    },
    details: {
      loginToActivate: 'Sign in to activate',
      activate: 'Activate app',
      activationCount: '{n} activation | {n} activations',
      activationHelp:
        'An activation is counted once per account and per app. It does not confirm installation on the device.',
      noAds: 'No ads',
      back: 'Back to the Store',
      backToStore: 'Back to the Store',
      unavailable: 'This app is not available in your country.',
      unavailableHelp:
        'Its publisher has limited it to certain countries. Plenty of other apps are waiting for you in the Store.',
      errorTitle: 'This app cannot be shown',
      loadError: 'The app details could not be loaded.',
      publishedBy: 'Published by',
      reviews: '({n} reviews) | ({n} review) | ({n} reviews)',
      open: 'Launch the app',
      addFavorite: 'Add to favourites',
      inFavorites: 'In your favourites',
      share: 'Share',
      edit: 'Edit the app',
      screenshots: 'Screenshots',
      screenshotAlt: 'Screenshot {n} of {name}',
      about: 'About',
      noDescription: 'The publisher has not provided a description yet.',
      information: 'Information',
      info: {
        rating: 'Rating',
        ads: 'Ads',
        version: 'Version',
        category: 'Category',
        languages: 'Languages',
        availability: 'Availability',
        dataCollected: 'Data collected',
        compatibility: 'Compatibility',
        contact: 'Contact',
        website: 'Official website',
        support: 'Support',
        privacyPolicy: 'Privacy policy',
        terms: 'Terms of use'
      },
      allCountries: 'All countries',
      moreCountries: 'and {n} more | and {n} more | and {n} more',
      noDataCollected: 'No data collected',
      install: 'Installation',
      version: 'Version {version}',
      declareInstalled: 'I installed this PWA',
      installNote:
        'Installation is offered by your browser, when it supports it.',
      pwaInfo:
        'This app is a PWA. Once it is open, you can install it on your home screen.',
      sandbox: 'PWA Store sandbox',
      sandboxIntro:
        'This app runs in a secure sandbox and declares the following access.',
      permissions: 'Required permissions',
      noPermissions: 'No special permission required.',
      domains: 'External domains detected',
      noDomains: 'No external domain reported by the static analysis.',
      versions: 'Version history',
      noVersions: 'No version history.',
      download: 'Download version {version}',
      similar: 'Similar apps',
      opening: 'Opening…',
      openingHelp: 'Checking that the app is available.',
      installDialog: {
        title: 'Installation on this device',
        message:
          'Did you install this PWA from your browser? Confirm to find it in your library. This does not start the installation.'
      },
      noStorage: 'Local storage is unavailable.',
      installSaved: 'Installation saved for this device.',
      installFailed: 'This installation could not be saved.',
      downloadNotSaved:
        'Archive received, but adding it to your library failed.',
      downloadFailed: 'This version could not be downloaded.',
      unsafeLaunch: 'Unsafe launch address.',
      launchFailed: 'This app could not be opened.',
      favoriteAdded: 'App added to your favourites.',
      favoriteFailed: 'This favourite could not be saved.',
      shareText: '{name} on PWA Store',
      linkCopied: 'Link copied.',
      shareFailed: 'This link could not be shared.'
    }
  },
  cover: {
    title: 'Cover image',
    help: 'Add an image that presents your app. It is used in the catalogue and on its page.',
    spec: {
      format: 'Landscape format, 16:9.',
      recommended: 'Recommended size: 1920 × 1080 pixels.',
      minimum: 'Minimum size: 1280 × 720 pixels.',
      weight: 'Maximum file size: 3 MB.',
      types: 'Accepted formats: JPEG, PNG and WebP.'
    },
    choose: 'Choose a cover image',
    drop: 'Drop an image here or click to choose one.',
    uploading: 'Uploading cover image',
    previewDesktop: 'Desktop preview',
    previewMobile: 'Mobile preview',
    replace: 'Replace image',
    remove: 'Remove image',
    error: {
      type: 'This file is not a valid JPG, PNG or WebP image.',
      weight: 'The maximum file size is 3 MB.',
      small: 'Your image is too small. Use at least 1280 × 720 pixels.',
      ratio: 'Use a 16:9 landscape image.'
    }
  },
  geo: {
    profileHint:
      'The catalogue you see depends on this country. You can change it once every 30 days.',
    visitor: {
      change: 'Choose my country',
      current: 'Country: {code}. Change country',
      short: 'Country',
      title: 'Your country',
      help: 'Available apps depend on the country. Without a choice, only apps available in every country are shown.',
      label: 'Country',
      clear: 'Do not choose',
      confirm: 'Show the catalogue'
    },
    missing: {
      short: 'Choose your country to see the full catalogue.',
      actionShort: 'Choose',
      text: 'Add your country to see every app available where you live.',
      action: 'Complete my profile'
    },
    title: 'Geographic availability',
    all: 'All countries',
    selected: 'Selected countries',
    choose: 'Select the countries where your app will be available.',
    count:
      'Your app will be available in {n} country. | Your app will be available in {n} countries.',
    none: 'No countries selected.'
  },
  language: {
    label: 'Language',
    change: 'Change language'
  },
  nav: {
    discover: 'Discover',
    applications: 'Apps',
    rankings: 'Charts',
    home: 'Home',
    popular: 'Popular',
    recommended: 'Recommended',
    trending: 'Trending',
    categories: 'Categories',
    business: 'Business',
    developerSpaceHint: 'Manage your apps'
  },
  portal: {
    howToPublish: 'How to publish',
    prepareStep:
      'Listing, screenshots, then your PWA’s HTTPS address. Your profile must be validated before you can create an app.'
  },
  library: {
    downloadNotInstalled:
      'A downloaded file does not necessarily mean the app is installed.'
  },
  installHelp: {
    declared:
      'Declared installations: the user tapped “I installed this PWA” on the listing. Nothing verifies it.',
    confirmed:
      'Confirmed installations: a signal sent by the measurement script added to your PWA, on an actual installation from the home screen.'
  },
  common: {
    cancel: 'Cancel',
    megabytes: '{n} MB',
    close: 'Close',
    retry: 'Retry',
    gotIt: 'Got it'
  },
  status: {
    draft: 'Draft',
    submitted: 'Submitted',
    in_review: 'In review',
    changes_requested: 'Changes requested',
    approved: 'Approved — ready to publish',
    published: 'Published',
    rejected: 'Rejected',
    suspended: 'Suspended',
    archived: 'Archived'
  },
  decision: {
    in_review: 'Take over',
    approved: 'Approve',
    changes_requested: 'Request changes',
    rejected: 'Reject',
    suspended: 'Suspend',
    reexamine: 'Review again',
    reinstate: 'Reinstate'
  },
  publication: {
    history: { title: 'Publication history', automatic: 'Automatic action' },
    journey: {
      help: 'How does it work?'
    },
    helpDialog: {
      title: 'How do I publish my app?',
      intro:
        'Publishing takes a few steps. A green tick means the step is done. Nothing is visible in the Store before the last step.',
      steps: [
        {
          title: 'First: your profile',
          text: 'Your email address must be confirmed. Your developer profile must be complete, with a valid identity document, and verified by an administrator.'
        },
        {
          title: '1. Create the draft',
          text: 'Name your app and choose how to provide it: by uploading its files (ZIP) or by giving the link to your PWA, already online. Nothing is published at this stage.'
        },
        {
          title: '2. Complete the listing',
          text: 'In the Details, Images and Privacy tabs, fill in everything: descriptions, category, languages, official link to your PWA, contact email, icon, screenshots, privacy policy and data collected. Each tab is saved as a draft; an orange dot shows what is missing.'
        },
        {
          title: '3. Provide the app',
          text: 'Version tab. ZIP: upload the production folder; it is analysed right away. Link: your address is checked automatically when you submit.'
        },
        {
          title: 'What does the analysis result mean?',
          text: '“Ready to submit”: all good. If sensitive functions are reported, often inside well-known libraries such as Quasar or SweetAlert, this does not block you: an administrator will review them. A file with real errors is refused on upload, with the reason.'
        },
        {
          title: '4. Review and submit',
          text: 'The Summary tab shows your listing as visitors will see it and lists what is missing. When everything is ready, click “Submit for review”. During the review your submission is locked; you can withdraw it to make changes.'
        },
        {
          title: '5. The decision',
          text: 'An administrator reviews your whole submission. If they approve it, your app is published automatically. If they request changes, their message appears at the top of the page: fix it, then submit again. Every decision is kept in the Tracking tab.'
        },
        {
          title: '6. After publication',
          text: 'To change the listing or ship a new version, make your changes then submit the update. Your app stays online as it was approved; the changes appear as soon as they are approved.'
        },
        {
          title: 'Store badges',
          text: '“Hosted by PWA Store”: the files were uploaded, analysed and are served by PWA Store. “Hosted by the publisher”: the app runs on your own website. Hover a badge to read its explanation.'
        }
      ],
      footer:
        'A question? The help centre and the contact form are at the bottom of every page.'
    },
    source: {
      hostingPending:
        'Build hosting is not enabled on this platform yet. You can upload builds and have them analysed, but putting them online requires an isolated domain to be configured. To publish now, choose listing by URL.',
      save: 'Save the mode',
      saved: 'Distribution mode saved.',
      checkOk: 'URL check passed.',
      manifestFound: 'Manifest found',
      manifestMissing: 'Manifest missing'
    },
    submission: {
      publish: 'Publish to the Store',
      published: 'App published.',
      restore: 'Restore as draft',
      restored: 'App restored as draft.',
      archive: 'Archive',
      archiveTitle: 'Archive this app?',
      archiveMessage:
        'It will be removed from the Store. Its files and history are kept and you can restore it as a draft.',
      archived: 'App archived.',
      completeProfile: 'Complete my developer profile'
    },
    preview: {
      noCategory: 'No category',
      noDescription: 'No description.'
    },
    versions: {
      empty: 'No build uploaded.',
      version: 'Version {number}',
      quarantineHint:
        'Sensitive functions found, often inside libraries (Quasar, SweetAlert…). You can submit: an administrator will review them before any approval.',
      deploy: 'Publish this version',
      deployTitle: 'Publish this version?',
      deployMessage:
        'This approved version will replace the one currently served. Other builds are kept.',
      deployed: 'Version published.',
      scan: {
        passed: 'Analysis passed',
        pending: 'Not analysed yet',
        rejected: 'Rejected',
        quarantined: 'To be reviewed'
      }
    }
  },
  console: {
    open: 'Open',
    newVersion: 'New version'
  },
  sdk: {
    collection: {
      unchecked: 'Script not checked',
      waiting: 'Script detected · waiting for data',
      received: 'Data received',
      blocked: 'Script detected · check security restrictions',
      noData: 'No data received. This does not mean nobody is using your app.',
      period: 'Totals since collection began, with no retroactive data.'
    },
    recapUnchecked: 'Install measurement script: not checked yet (optional)',
    recapAction: 'Check',
    check: {
      button: 'Check my site',
      at: 'Last check: {date}',
      csp: 'Your site’s security policy blocks the script ({directives}). Add {host} to these directives.',
      status: {
        connected: 'Script detected on your PWA',
        missing: 'Script not found on your site',
        wrong_key: 'Script found, but with another app’s key',
        wrong_host: 'Script found, but it points to another PWA Store address',
        unreachable: 'Your site could not be reached',
        no_url: 'No address to check'
      },
      help: {
        connected:
          'The line was found on {url} with the right key. Installs will be counted as soon as someone installs or opens the app.',
        missing:
          'No measurement line was found on {url}. Paste it into index.html, put your site online, then check again. A script added by JavaScript after loading cannot be detected.',
        wrong_key:
          'The line found on {url} uses another key. Replace it with the one above.',
        wrong_host:
          'The line found ({found}) does not point to the official PWA Store address. Replace it with the one above.',
        unreachable:
          'PWA Store could not open {url}. Check that the address is public and uses HTTPS, then try again.',
        no_url: 'Enter the link to your PWA first.'
      }
    },
    title: 'Install measurement',
    intro:
      'Add this line to your PWA so PWA Store can confirm installs and launches of your app. Without it, no install can be verified.',
    step1: 'Copy the line below.',
    step2: 'Paste it into your PWA’s index.html, just before </body>.',
    step3:
      'Put your site online: the first signal shows up here as soon as someone installs or opens the app.',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Copy failed: select the line and copy it by hand.',
    origins: 'Signals are accepted only from: {origins}',
    csp: 'If your site uses a Content Security Policy, allow {host} in script-src and connect-src.',
    received: 'Signal received — latest on {date}',
    waiting: 'No signal received yet.',
    afterPublication: 'Signals are accepted once the app is published.',
    installs: 'Confirmed installs',
    launches: 'Launches from the home screen',
    privacy:
      'Only two events are measured (install, launch), with an anonymous device identifier. Nothing the user does inside the app is collected.'
  },
  devnav: {
    eyebrow: 'Developer space',
    apps: 'My apps',
    requests: 'Review tracking',
    measure: 'Install measurement',
    guide: 'Developer guide',
    rules: 'Publishing rules',
    settings: 'Account settings',
    soon: 'Soon',
    revenueSoon:
      'Revenue will show here once payments are enabled on PWA Store.'
  },
  myApps: {
    title: 'My apps',
    intro: 'Each app, its status and the next step.',
    create: 'Create an app',
    emptyTitle: 'No app yet',
    emptyText:
      'Create your first app: a name and the link to your PWA are enough.',
    updated: 'Updated on {date}',
    step: {
      complete: 'Complete and submit',
      inReview: 'In review',
      fix: 'Fix it',
      rejected: 'See the reason',
      publish: 'Publish',
      submitChanges: 'Submit the changes',
      online: 'View in the Store',
      suspended: 'See the reason',
      archived: 'Open'
    }
  },
  devRequests: {
    title: 'Review tracking',
    intro: 'All your publication requests and the administrators’ decisions.',
    open: 'request in review | request in review | requests in review',
    toFix: 'app to fix | app to fix | apps to fix'
  },
  measurePage: {
    intro:
      'The measurement script and confirmed installs of each of your apps.',
    empty: 'No app hosted on your site yet.',
    open: 'Open'
  },
  content: {
    yes: 'Yes',
    no: 'No',
    incomplete: 'Answer every question about ads and rating to save.',
    access: {
      title: 'Access for the review',
      intro:
        'If part of your app needs a login or special access, give the review team what they need to test it. Without it, the review may be rejected.',
      open: 'All features are available without special access',
      restricted: 'Some features need a login or special access',
      instructions: 'Access instructions',
      instructionsHint:
        'Explain how to reach the restricted features (steps, code, role to choose…).',
      username: 'Test username or email',
      password: 'Test password',
      togglePassword: 'Show or hide the password',
      other: 'Other information (optional)',
      secure:
        'This information is encrypted and visible only to the review team. Every reading is recorded. Use a test account, never a personal one.',
      saved: 'Review access saved.'
    },
    ads: {
      title: 'Ads',
      intro:
        'Tell us whether your app contains ads. This includes ads delivered by third-party ad networks. Make sure this information is accurate and kept up to date.',
      yes: 'Yes, my app contains ads',
      no: 'No, my app does not contain ads',
      badge: 'Contains ads'
    },
    rating: {
      title: 'Content rating',
      intro:
        'Answer honestly: the age rating is computed from your answers and shown on the listing. The review team checks it.',
      ageLabel: 'Computed minimum age: {age} and over',
      notOfficial:
        'Rating computed by PWA Store from your answers. It is not an official rating (IARC, PEGI, ESRB).',
      packagedHelp:
        'For example: images, videos, texts or sounds included in the app’s code or resources, rather than loaded from the internet or posted by users.',
      q: {
        violence: 'Does the app show violence?',
        sexual: 'Does it contain sexual content or nudity?',
        language: 'Does it contain crude language?',
        drugs: 'Does it refer to drugs, alcohol or tobacco?',
        gambling: 'Does it contain gambling?',
        fear: 'Does it contain frightening content?',
        users_interact:
          'Can users communicate with each other or share content?',
        shares_location:
          'Does the app share the user’s location with other people?',
        digital_purchases: 'Does it offer digital purchases?',
        packaged:
          'Is this content included in the app package (code, resources)?'
      },
      a: {
        violence: {
          none: 'No',
          mild: 'Mild or cartoon',
          strong: 'Realistic or intense'
        },
        sexual: {
          none: 'No',
          suggestive: 'Suggestive',
          explicit: 'Explicit'
        },
        language: {
          none: 'No',
          mild: 'Occasional',
          strong: 'Frequent or very crude'
        },
        drugs: {
          none: 'No',
          references: 'References',
          use: 'Use shown or encouraged'
        },
        gambling: {
          none: 'No',
          simulated: 'Simulated (no real money)',
          real_money: 'With real money'
        },
        fear: {
          none: 'No',
          mild: 'Mild',
          strong: 'Intense'
        }
      },
      descriptor: {
        violence: 'Violence',
        sexual: 'Sexual content',
        language: 'Crude language',
        drugs: 'Drugs',
        gambling: 'Gambling',
        fear: 'Fear',
        users_interact: 'Users interact',
        shares_location: 'Shares location',
        digital_purchases: 'Digital purchases'
      }
    },
    dossier: {
      title: 'App content',
      access: 'Access for the review',
      reveal: 'Show test credentials',
      revealNote: 'This reading is recorded in the log.',
      noAccess: 'Not provided'
    }
  },
  hosting: {
    build: {
      label: 'Hosted by PWA Store',
      help: 'This app’s code was uploaded to PWA Store, analysed and approved. PWA Store serves it from its own address, kept separate from the Store.'
    },
    url: {
      label: 'Hosted by the publisher',
      help: 'This app runs on its publisher’s website. PWA Store checked its address and listing, but its content can change without a new analysis.'
    }
  },
  newApp: {
    zipUnavailable: 'not available for now',
    eyebrow: 'New app',
    title: 'Create an app',
    intro:
      'Start with the essentials. You will complete the listing, images and version at your own pace: everything is saved as a draft.',
    name: 'App name',
    nameRequired: 'Enter your app’s name.',
    category: 'Category (you can change it later)',
    sourceTitle: 'How will you provide your app?',
    source: {
      build: 'Upload my app’s files (ZIP)',
      url: 'Link to my PWA, already online'
    },
    sourceHelp: {
      build:
        'You upload your app’s production folder. PWA Store analyses it, then hosts it at a dedicated address.',
      url: 'Your app stays on your website. PWA Store checks its address and lists it in the Store.'
    },
    url: 'HTTPS link to your PWA',
    urlHint: 'Example: https://myapp.com',
    urlRequired: 'Enter an address starting with https://',
    create: 'Create the draft',
    draftNote:
      'Nothing is published at this stage. You will submit your app when it is ready.'
  },
  builder: {
    versionNumber: 'Version number',
    versionHint: 'Example: 1.0.0',
    versionRequired: 'Enter a version number.',
    zip: 'Your app’s ZIP file',
    zipHint: 'The production folder (with index.html), compressed as a ZIP.',
    zipRequired: 'Choose a ZIP file.',
    releaseNotes: 'What’s new in this version (optional)',
    permissions: 'Permissions the app asks for',
    permission: {
      camera: 'Camera',
      location: 'Location',
      notifications: 'Notifications',
      contacts: 'Contacts',
      storage: 'Storage',
      audio: 'Microphone'
    },
    uploading: 'Uploading',
    refused: 'This file could not be accepted:',
    warnings: 'Things to check',
    submit: 'Upload and analyse',
    done: 'Version analysed. No external domain found. | Version analysed. {n} external domain found. | Version analysed. {n} external domains found.',
    missingTitle: 'PWA files missing',
    missingMessage:
      'Your ZIP has no manifest or service worker. PWA Store can generate them so your app can be installed. Continue this way?',
    missingCancel: 'No, cancel the upload',
    missingOk: 'Yes, generate them'
  },
  workspace: {
    eyebrow: 'My app',
    iconAlt: '{name} icon',
    viewInStore: 'View in the Store',
    more: 'More actions',
    restore: 'Restore as draft',
    archive: 'Archive the app',
    stats: 'Statistics',
    banner: {
      open: {
        pending:
          'Your request was sent on {date}. It is waiting to be reviewed.',
        in_review: 'Your request, sent on {date}, is being reviewed.'
      },
      openLocked:
        'During the review, the app cannot be edited. Withdraw your request if you need to change something.',
      changes_requested: 'Changes are requested:',
      rejected: 'Your request was rejected:',
      fixThenSubmit:
        'Fix what is mentioned, then submit again from the “Summary” tab.',
      pending: 'You have unpublished changes.',
      pendingHelp:
        'Your app stays online as it was approved. The changes will appear once approved.',
      approved: 'Your app is approved.',
      approvedHelp:
        'It could not be put online automatically. You can publish it now.',
      suspended: 'Your app is suspended:'
    },
    withdraw: 'Withdraw my request',
    discard: 'Discard my changes',
    reviewAndSubmit: 'Review and submit',
    publishNow: 'Publish now',
    tab: {
      info: 'Details',
      media: 'Images',
      privacy: 'Privacy',
      content: 'App content',
      version: 'Version',
      submit: 'Summary',
      history: 'Tracking'
    },
    missing:
      '{n} item to complete | {n} item to complete | {n} items to complete',
    field: {
      contains_ads: 'Ads',
      content_rating: 'Content rating',
      review_access: 'Access for the review',
      cover: 'Cover image',
      availability: 'Geographic availability',
      name: 'App name',
      shortDescription: 'Short description',
      description: 'Full description',
      category: 'Category',
      subcategory: 'Subcategory (optional)',
      languages: 'App languages',
      countries: 'Available countries',
      officialUrl: 'Official link to your PWA',
      contactEmail: 'Contact email',
      supportUrl: 'Support page (optional)',
      termsUrl: 'Terms of use (optional)',
      compatibility: 'Supported devices and features',
      icon: 'Icon',
      screenshots: 'Screenshots',
      privacyUrl: 'Privacy policy',
      dataCollected: 'Data collected'
    },
    hint: {
      shortDescription: 'One appealing sentence, shown under the name.',
      description:
        'At least 30 characters: what the app does, who it is for, what makes it good.',
      languages: 'The languages the app can be used in.',
      officialUrl: 'The official address of your PWA or of its website.',
      contactEmail: 'So that users and PWA Store can reach you.',
      icon: 'Square image of at least 192 × 192 pixels, PNG, JPG or WebP (1 MB max).',
      screens: 'Show your app in action. PNG, JPG or WebP, 5 MB max per image.',
      privacyUrl: 'The page explaining how you use your users’ data.',
      dataCollected:
        'Tick everything your app collects. This is shown on its listing.'
    },
    compatibility: {
      mobile: 'Phone',
      tablet: 'Tablet',
      desktop: 'Computer',
      offline: 'Works offline',
      dark_mode: 'Dark mode'
    },
    chooseIcon: 'Choose an icon',
    screens: {
      mobile: 'Phone screenshots',
      tablet: 'Tablet screenshots (optional)'
    },
    removeScreen: 'Remove this screenshot',
    addScreens: 'Add screenshots',
    data: {
      none: 'No data',
      account: 'Account (name, username)',
      contact: 'Contact details (email, phone)',
      location: 'Location',
      health: 'Health',
      payment: 'Payment',
      photos: 'Photos and files',
      analytics: 'Usage statistics',
      advertising: 'Advertising'
    },
    source: {
      title: 'How your app is provided',
      save: 'Save this choice',
      fixed: 'This choice cannot be changed after the first submission.',
      check: 'Check my link now',
      checkAuto: 'The link is checked automatically at every submission.'
    },
    build: {
      newVersion: 'Upload a version',
      newVersionHelp:
        'Each upload creates a new version, analysed right away. It is reviewed with your next request; the online version stays available meanwhile.',
      versions: 'Your versions',
      putOnline: 'Put this version back online'
    },
    versionState: {
      draft: 'Draft',
      analysing: 'Being analysed',
      ready: 'Ready to submit',
      submitted: 'Submitted',
      in_review: 'In review',
      approved: 'Approved',
      rejected: 'Rejected',
      deployed: 'Online'
    },
    recap: {
      preview: 'Listing preview',
      availability: 'Availability',
      countries:
        'Available in {n} country | Available in {n} country | Available in {n} countries',
      allCountries: 'All countries',
      source: 'App provided',
      version: 'Version {number} · {domains} external domain(s)',
      title: 'Ready for review?',
      updateTitle: 'Submit the update',
      intro:
        'Check your submission. Once sent, an administrator reviews it and makes a decision.',
      updateIntro:
        'Your app stays online during the review. The changes appear as soon as they are approved.',
      changes: 'What changes',
      checks: 'Checks',
      nothing: 'Nothing to submit for now.',
      allGood: 'Everything is ready.',
      complete: 'Complete: {section}',
      afterSubmit:
        'As soon as it is approved, your app is published automatically.'
    },
    submit: 'Submit for review',
    history: {
      requests: 'Your requests',
      noRequest: 'No request sent yet.',
      sent: 'Sent on {date}',
      decided: 'decided on {date}'
    },
    event: {
      update_submitted: 'Update submitted',
      update_withdrawn: 'Update withdrawn',
      update_approved: 'Update approved',
      update_changes_requested: 'Changes requested on the update',
      update_rejected: 'Update rejected',
      deployed: 'Version put online',
      version_approved: 'Version approved',
      version_rejected: 'Version rejected'
    },
    save: 'Save',
    saveLive: 'Your changes will wait until they are approved.',
    saveDraft: 'Saved as a draft, nothing is published.',
    saved: 'Draft saved.',
    savedLive: 'Changes saved. They will appear once approved.',
    fileRejected: 'This file is not suitable (format or size).',
    confirmSubmit: {
      title: 'Submit for review?',
      message:
        'Your submission will be sent to the administrators. You cannot edit it during the review, unless you withdraw your request.'
    },
    submitted: 'Request sent. You will be notified of the decision.',
    confirmWithdraw: {
      title: 'Withdraw your request?',
      message:
        'It will not be reviewed. You can edit your app and submit it again.'
    },
    withdrawn: 'Request withdrawn.',
    confirmDiscard: {
      title: 'Discard your changes?',
      message: 'The listing goes back to the version currently published.'
    },
    discarded: 'Changes discarded.'
  },
  requests: {
    openDossier: 'Open the dossier',
    eyebrow: 'Administration',
    title: 'Publication requests',
    intro:
      'Submissions prepared by developers, oldest first. You approve, request changes or reject.',
    open: 'To handle',
    decided: 'Decided',
    emptyOpen: 'No request waiting. All caught up.',
    emptyDecided: 'No decision yet.',
    waiting: 'Waiting {time}',
    kind: {
      initial: 'First publication',
      update: 'Update'
    },
    status: {
      pending: 'Waiting',
      in_review: 'In review',
      approved: 'Approved',
      changes_requested: 'Changes requested',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    },
    alert: {
      quarantined: 'Sensitive functions found in the build',
      highRisk:
        '{n} high-risk external resource | {n} high-risk external resource | {n} high-risk external resources',
      unverified: 'Developer not verified'
    },
    backToQueue: 'Back to requests',
    dossier: {
      noCover: 'No cover image provided.',
      previousCover: 'Previous cover image',
      listing: 'Submitted listing',
      changed: 'Changed: {fields}',
      before: 'Before: {value}',
      source: 'App provided',
      urlChecked: 'Link checked on {date}',
      sensitive: 'Sensitive functions found',
      noVersion: 'No new version in this request.',
      developer: 'Developer',
      verified: 'Verified profile',
      notVerified: 'Profile not verified',
      otherApps: 'No other app | {n} other app | {n} other apps',
      decision: 'Decision',
      takeOver: 'Take over',
      liftSuspension:
        'The app is suspended: approving lifts the suspension and puts it back online.',
      acknowledge:
        'I have reviewed the sensitive functions and consider them legitimate.',
      resourceCorrections:
        '{n} requested correction on external resources is still to review. | {n} requested correction on external resources is still to review. | {n} requested corrections on external resources are still to review.',
      reason: 'Reason',
      reasonHint: 'Optional to approve, required to request changes or reject.',
      approve: 'Approve and publish',
      requestChanges: 'Request changes',
      reject: 'Reject',
      approveNote:
        'Approving validates the app and its version, then publishes them right away.',
      notes: 'Internal notes',
      notesHint: 'Visible to administrators only.',
      noteSaved: 'Note saved.',
      history: 'History',
      firstRequest: 'First request for this app.',
      screens: 'No screenshot | {n} screenshot | {n} screenshots'
    },
    confirm: {
      approved: {
        title: 'Approve and publish?',
        message: 'The app will be visible in the Store right away.',
        ok: 'Approve and publish'
      },
      changes_requested: {
        title: 'Request changes?',
        message: 'The developer will receive your reason and can submit again.',
        ok: 'Send the request'
      },
      rejected: {
        title: 'Reject this request?',
        message:
          'The developer will receive your reason. The decision is kept in the history.',
        ok: 'Reject'
      }
    },
    done: {
      online: 'Approved: the app is online.',
      approvedOffline:
        'Approved. It could not be put online automatically; the developer has been notified.',
      changes_requested: 'Change request sent.',
      rejected: 'Request rejected.'
    }
  }
}
