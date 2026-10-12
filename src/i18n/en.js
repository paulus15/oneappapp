export default {
  language: {
    label: 'Language',
    change: 'Change language'
  },
  nav: {
    home: 'Home',
    popular: 'Popular',
    recommended: 'Recommended',
    trending: 'Trending',
    categories: 'Categories',
    business: 'Business'
  },
  common: {
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
    reexamine: 'Review again'
  },
  publication: {
    eyebrow: 'Publishing and versions',
    fallbackName: 'Your app',
    intro: 'Preparation, analysis, review and publishing are separate steps.',
    editListing: 'Edit the listing / upload a build',
    profileAndQuotas: 'My profile and quotas',
    journey: {
      title: 'Publishing journey',
      help: 'How does it work?',
      listing: 'Complete the listing',
      editListing: 'Edit the listing',
      checkUrl: 'Check the PWA URL',
      uploadBuild: 'Upload an analysed build',
      preview: 'Preview the listing',
      previewHint:
        'Open the preview to see the listing as visitors will. The step is then ticked.',
      previewAgain:
        'The listing changed since your last preview: take another look.',
      previewAction: 'Preview',
      submit: 'Submit for review',
      submitAction: 'Submit'
    },
    helpDialog: {
      title: 'How do I publish my app?',
      intro:
        'Publishing takes a few steps. A green tick means the step is done. Nothing is visible in the Store before the last step.',
      steps: [
        {
          title: 'First: your profile',
          text: 'Your email address must be confirmed. Your developer profile must be complete, with a valid identity document, and verified by an administrator. Until then, you cannot submit.'
        },
        {
          title: '1. Complete the listing',
          text: 'Choose a category, add an icon and write a description of at least 30 characters. This is what visitors will see.'
        },
        {
          title: '2. Provide the app',
          text: 'Two options. ZIP build: you upload the production folder (index.html, manifest, service worker) and we analyse it right away. URL: your PWA is already online; click “Check the URL” (the check must be less than 24 h old).'
        },
        {
          title: 'What does the analysis result mean?',
          text: '“Analysis passed”: all good. “To be reviewed”: we found sensitive functions, often inside well-known libraries such as Quasar or SweetAlert. This does not block you: you can submit and an administrator will check them. A build with real errors is refused on upload, with the reason.'
        },
        {
          title: '3. Preview the listing',
          text: 'Click “Preview” to see your listing as a visitor. The step is ticked as soon as you open it. If you edit the listing afterwards, look at the preview again.'
        },
        {
          title: '4. Submit for review',
          text: 'Click “Submit for review”. The listing is locked during the review.'
        },
        {
          title: '5. The review',
          text: 'An administrator reviews the app, then each build separately. They can approve, request changes (you fix them and submit again) or reject. Every decision is explained and you get a notification.'
        },
        {
          title: '6. Publish',
          text: 'An approved app is not visible yet. Click “Publish to the Store” when you are ready: for a build, the latest approved version is put online automatically on its own address. The app then opens on its own, in a new tab, and can be installed like a real app. “Publish this version” is then used to replace the online version.'
        }
      ],
      footer:
        'A question? The help centre and the contact form are at the bottom of every page.'
    },
    source: {
      title: 'Distribution mode',
      build: 'Hosted ZIP build',
      url: 'PWA hosted on my site',
      hostingPending:
        'Build hosting is not enabled on this platform yet. You can upload builds and have them analysed, but putting them online requires an isolated domain to be configured. To publish now, choose listing by URL.',
      urlLabel: 'HTTPS address of the PWA',
      save: 'Save the mode',
      saved: 'Distribution mode saved.',
      checkUrl: 'Check the URL',
      checkOk: 'URL check passed.',
      lastCheck: 'Last check: {date}',
      history: 'Check history',
      scheduled: 'automatic check',
      manual: 'manual check',
      manifestFound: 'Manifest found',
      manifestMissing: 'Manifest missing',
      contentChanged: ' · content changed',
      buildHint:
        'Upload a build from the listing editor. No build script is ever run on the server.'
    },
    submission: {
      title: 'Submission and moderation',
      intro:
        'A verified profile lets you submit an app. Each app and each build is then reviewed separately.',
      submit: 'Submit for review',
      submitted: 'App submitted for review.',
      publish: 'Publish to the Store',
      publishTitle: 'Publish to the Store?',
      publishMessage:
        'The app will be visible to every visitor. For a build, the latest approved version is put online on its own address.',
      published: 'App published.',
      restore: 'Restore as draft',
      restored: 'App restored as draft.',
      archive: 'Archive',
      archiveTitle: 'Archive this app?',
      archiveMessage:
        'It will be removed from the Store. Its files and history are kept and you can restore it as a draft.',
      archived: 'App archived.',
      approvedHint:
        'The app is approved but not visible yet: publish it when you are ready.',
      completeProfile: 'Complete my developer profile'
    },
    history: {
      title: 'Publishing history',
      empty: 'No status change recorded.',
      automatic: 'Automatic check',
      version: 'Version {status}'
    },
    preview: {
      eyebrow: 'Public listing preview',
      iconAlt: '{name} icon',
      noCategory: 'No category',
      noDescription: 'No description.',
      screenshot: 'Screenshot {n}',
      noScreenshots: 'No screenshots.',
      reviewsLater: 'Ratings and reviews will appear after publishing.'
    },
    versions: {
      title: 'Versions',
      empty: 'No build uploaded.',
      version: 'Version {number}',
      analysis: 'Analysis: {status}',
      review: 'Review: {status}',
      active: 'Active version',
      quarantineHint:
        'Sensitive functions found, often inside libraries (Quasar, SweetAlert…). You can submit: an administrator will review them before any approval.',
      approve: 'Approve the version',
      reject: 'Reject the version',
      redeploy: 'Redeploy',
      deploy: 'Publish this version',
      deployTitle: 'Publish this version?',
      deployMessage:
        'This approved version will replace the one currently served. Other builds are kept.',
      deployed: 'Version published.',
      quarantineTitle: 'Lift the quarantine and approve?',
      quarantineMessage:
        'I have reviewed these sensitive functions and consider them legitimate. Reason:',
      quarantineCleared: 'Quarantine lifted, version approved.',
      scan: {
        passed: 'Analysis passed',
        pending: 'Not analysed yet',
        rejected: 'Rejected',
        quarantined: 'To be reviewed'
      },
      moderation: {
        pending: 'Awaiting review',
        approved: 'Approved',
        rejected: 'Rejected'
      }
    },
    moderation: {
      title: 'Moderation decision',
      message: 'Give the reason for your decision.',
      saved: 'Decision saved.'
    },
    stats: {
      title: 'Available statistics',
      installations: '{n} installation(s) recorded',
      launches: 'Reported launches: {n}',
      crashes: '{n} crash(es) reported',
      ratio: 'Ratio: {n}',
      note: 'Totals come from received events. Missing data does not prove there is no usage or error.'
    }
  }
}
