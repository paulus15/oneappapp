export default {
  language: {
    label: 'Langue',
    change: 'Changer de langue'
  },
  nav: {
    home: 'Accueil',
    popular: 'Populaires',
    recommended: 'Recommandés',
    trending: 'Tendances',
    categories: 'Catégories',
    business: 'Entreprises'
  },
  common: {
    cancel: 'Annuler',
    megabytes: '{n} Mo',
    close: 'Fermer',
    retry: 'Réessayer',
    gotIt: 'J’ai compris'
  },
  status: {
    draft: 'Brouillon',
    submitted: 'Soumise',
    in_review: 'En analyse',
    changes_requested: 'Correction demandée',
    approved: 'Approuvée — à publier',
    published: 'Publiée',
    rejected: 'Refusée',
    suspended: 'Suspendue',
    archived: 'Archivée'
  },
  decision: {
    in_review: 'Prendre en charge',
    approved: 'Approuver',
    changes_requested: 'Demander une correction',
    rejected: 'Refuser',
    suspended: 'Suspendre',
    reexamine: 'Réexaminer'
  },
  publication: {
    eyebrow: 'Publication et versions',
    fallbackName: 'Votre application',
    intro:
      'Préparation, analyse, revue et publication sont des étapes distinctes.',
    editListing: 'Modifier la fiche / déposer un build',
    profileAndQuotas: 'Mon profil et mes quotas',
    journey: {
      title: 'Parcours de publication',
      help: 'Comment ça marche ?',
      listing: 'Compléter la fiche',
      editListing: 'Modifier la fiche',
      checkUrl: 'Vérifier l’URL de la PWA',
      uploadBuild: 'Déposer un build analysé',
      preview: 'Prévisualiser la fiche',
      previewHint:
        'Ouvrez l’aperçu pour voir la fiche comme les visiteurs. L’étape se coche ensuite.',
      previewAgain:
        'La fiche a changé depuis votre dernier aperçu : regardez-la de nouveau.',
      previewAction: 'Aperçu',
      submit: 'Soumettre à la revue',
      submitAction: 'Soumettre'
    },
    helpDialog: {
      title: 'Comment publier mon application ?',
      intro:
        'La publication se fait en quelques étapes. Une coche verte veut dire que l’étape est terminée. Rien n’est visible dans le Store avant la dernière étape.',
      steps: [
        {
          title: 'Avant tout : votre profil',
          text: 'Votre adresse e-mail doit être confirmée. Votre profil développeur doit être complet, avec une pièce d’identité valide, et vérifié par un administrateur.'
        },
        {
          title: '1. Créer le brouillon',
          text: 'Donnez un nom à votre application et choisissez comment la fournir : en déposant ses fichiers (ZIP) ou en indiquant le lien de votre PWA déjà en ligne. Rien n’est publié à ce stade.'
        },
        {
          title: '2. Compléter la fiche',
          text: 'Dans les onglets Informations, Images et Confidentialité, renseignez tout : descriptions, catégorie, langues, lien officiel de votre PWA, e-mail de contact, icône, captures, politique de confidentialité et données collectées. Chaque onglet s’enregistre en brouillon ; un point orange signale ce qui manque.'
        },
        {
          title: '3. Fournir l’application',
          text: 'Onglet Version. ZIP : envoyez le dossier de production ; il est analysé tout de suite. Lien : votre adresse est contrôlée automatiquement au moment de la soumission.'
        },
        {
          title: 'Que veut dire le résultat de l’analyse ?',
          text: '« Prête à soumettre » : tout va bien. Si des fonctions sensibles sont signalées, souvent dans des bibliothèques connues comme Quasar ou SweetAlert, ce n’est pas bloquant : un administrateur les examinera. Un fichier avec de vraies erreurs est refusé dès l’envoi, avec la raison.'
        },
        {
          title: '4. Vérifier et soumettre',
          text: 'L’onglet Récapitulatif montre votre fiche comme les visiteurs la verront et liste ce qui manque. Quand tout est prêt, cliquez sur « Soumettre à validation ». Pendant l’examen, votre dossier est verrouillé ; vous pouvez le retirer pour le modifier.'
        },
        {
          title: '5. La décision',
          text: 'Un administrateur examine votre dossier en entier. S’il l’approuve, votre application est publiée automatiquement. S’il demande une correction, son message s’affiche en haut de la page : corrigez, puis soumettez à nouveau. Toutes les décisions sont gardées dans l’onglet Suivi.'
        },
        {
          title: '6. Après la publication',
          text: 'Pour changer la fiche ou envoyer une nouvelle version, faites vos modifications puis soumettez la mise à jour. Votre application reste en ligne telle qu’elle a été approuvée ; les changements apparaissent dès leur validation.'
        },
        {
          title: 'Les badges du Store',
          text: '« Hébergée par PWA Store » : les fichiers ont été déposés, analysés et sont servis par PWA Store. « Hébergée par l’éditeur » : l’application fonctionne sur votre propre site. Survolez un badge pour lire son explication.'
        }
      ],
      footer:
        'Une question ? Le centre d’aide et le formulaire de contact sont accessibles en bas de chaque page.'
    },
    source: {
      title: 'Mode de distribution',
      build: 'Build ZIP hébergé',
      url: 'PWA hébergée sur mon site',
      hostingPending:
        'L’hébergement des builds n’est pas encore activé sur cette plateforme. Vous pouvez déposer et faire analyser vos builds, mais leur mise en ligne attend la configuration d’un domaine isolé. Pour publier dès maintenant, choisissez le référencement par URL.',
      urlLabel: 'Adresse HTTPS de la PWA',
      save: 'Enregistrer le mode',
      saved: 'Mode de distribution enregistré.',
      checkUrl: 'Contrôler l’URL',
      checkOk: 'Contrôle de l’URL réussi.',
      lastCheck: 'Dernier contrôle : {date}',
      history: 'Historique des contrôles',
      scheduled: 'contrôle automatique',
      manual: 'contrôle manuel',
      manifestFound: 'Manifeste trouvé',
      manifestMissing: 'Manifeste absent',
      contentChanged: ' · contenu modifié',
      buildHint:
        'Déposez un build depuis l’édition de la fiche. Aucun script de compilation n’est exécuté sur le serveur.'
    },
    submission: {
      title: 'Soumission et modération',
      intro:
        'Un profil vérifié permet de soumettre une application. Chaque application et chaque build sont ensuite examinés séparément.',
      submit: 'Soumettre à la revue',
      submitted: 'Application soumise à revue.',
      publish: 'Publier dans le Store',
      publishTitle: 'Publier dans le Store ?',
      publishMessage:
        'L’application sera visible par tous les visiteurs. Pour un build, la dernière version approuvée est mise en ligne sur sa propre adresse.',
      published: 'Application publiée.',
      restore: 'Réactiver en brouillon',
      restored: 'Application réactivée en brouillon.',
      archive: 'Archiver',
      archiveTitle: 'Archiver cette application ?',
      archiveMessage:
        'Elle sera retirée du Store. Ses fichiers et son historique sont conservés et vous pourrez la réactiver en brouillon.',
      archived: 'Application archivée.',
      approvedHint:
        'L’application est approuvée mais pas encore visible : publiez-la quand vous êtes prêt.',
      completeProfile: 'Compléter mon profil développeur'
    },
    history: {
      title: 'Historique de publication',
      empty: 'Aucun changement d’état enregistré.',
      automatic: 'Contrôle automatique',
      version: 'Version {status}'
    },
    preview: {
      eyebrow: 'Aperçu de la fiche publique',
      iconAlt: 'Icône de {name}',
      noCategory: 'Sans catégorie',
      noDescription: 'Aucune description.',
      screenshot: 'Capture {n}',
      noScreenshots: 'Aucune capture d’écran.',
      reviewsLater: 'Les notes et avis apparaîtront après publication.'
    },
    versions: {
      title: 'Versions',
      empty: 'Aucun build déposé.',
      version: 'Version {number}',
      analysis: 'Analyse : {status}',
      review: 'Revue : {status}',
      active: 'Version active',
      quarantineHint:
        'Fonctions sensibles détectées, souvent présentes dans les bibliothèques (Quasar, SweetAlert…). Vous pouvez soumettre : un administrateur les examinera avant toute approbation.',
      approve: 'Approuver la version',
      reject: 'Refuser la version',
      redeploy: 'Redéployer',
      deploy: 'Publier cette version',
      deployTitle: 'Publier cette version ?',
      deployMessage:
        'Cette version approuvée remplacera la version actuellement servie. Les autres builds seront conservés.',
      deployed: 'Version publiée.',
      quarantineTitle: 'Lever la quarantaine et approuver ?',
      quarantineMessage:
        'J’ai examiné ces fonctions sensibles et les juge légitimes. Motif :',
      quarantineCleared: 'Quarantaine levée, version approuvée.',
      scan: {
        passed: 'Analyse réussie',
        pending: 'À analyser',
        rejected: 'Rejetée',
        quarantined: 'À examiner'
      },
      moderation: {
        pending: 'En attente de revue',
        approved: 'Approuvée',
        rejected: 'Refusée'
      }
    },
    moderation: {
      title: 'Décision de modération',
      message: 'Indiquez le motif de votre décision.',
      saved: 'Décision enregistrée.'
    },
    stats: {
      title: 'Statistiques disponibles',
      installations: '{n} installation(s) enregistrée(s)',
      launches: 'Ouvertures déclarées : {n}',
      crashes: '{n} crash(es) déclaré(s)',
      ratio: 'Ratio : {n}',
      note: 'Totaux issus des événements reçus. L’absence de données ne prouve pas l’absence d’usage ou d’erreur.'
    }
  },
  console: {
    open: 'Ouvrir',
    newVersion: 'Nouvelle version'
  },
  hosting: {
    build: {
      label: 'Hébergée par PWA Store',
      help: 'Le code de cette application a été déposé sur PWA Store, analysé puis approuvé. Elle est servie par PWA Store depuis sa propre adresse, isolée du Store.'
    },
    url: {
      label: 'Hébergée par l’éditeur',
      help: 'Cette application fonctionne sur le site de son éditeur. PWA Store a vérifié son adresse et sa fiche, mais son contenu peut évoluer sans nouvelle analyse.'
    }
  },
  newApp: {
    eyebrow: 'Nouvelle application',
    title: 'Créer une application',
    intro:
      'Commencez par l’essentiel. Vous compléterez la fiche, les images et la version à votre rythme : tout est enregistré en brouillon.',
    name: 'Nom de l’application',
    nameRequired: 'Indiquez le nom de votre application.',
    category: 'Catégorie (modifiable plus tard)',
    sourceTitle: 'Comment fournir votre application ?',
    source: {
      build: 'Déposer les fichiers de mon application (ZIP)',
      url: 'Indiquer le lien de ma PWA déjà en ligne'
    },
    sourceHelp: {
      build:
        'Vous envoyez le dossier de production de votre application. PWA Store l’analyse, puis l’héberge à une adresse dédiée.',
      url: 'Votre application reste sur votre site. PWA Store vérifie son adresse et la référence dans le Store.'
    },
    url: 'Lien HTTPS de votre PWA',
    urlHint: 'Exemple : https://monapp.com',
    urlRequired: 'Indiquez une adresse qui commence par https://',
    create: 'Créer le brouillon',
    draftNote:
      'Rien n’est publié à cette étape. Vous soumettrez votre application quand elle sera prête.'
  },
  builder: {
    versionNumber: 'Numéro de version',
    versionHint: 'Exemple : 1.0.0',
    versionRequired: 'Indiquez un numéro de version.',
    zip: 'Fichier ZIP de votre application',
    zipHint: 'Le dossier de production (avec index.html), compressé en ZIP.',
    zipRequired: 'Choisissez un fichier ZIP.',
    releaseNotes: 'Nouveautés de cette version (facultatif)',
    permissions: 'Autorisations demandées par l’application',
    permission: {
      camera: 'Caméra',
      location: 'Localisation',
      notifications: 'Notifications',
      contacts: 'Contacts',
      storage: 'Stockage',
      audio: 'Micro'
    },
    uploading: 'Envoi en cours',
    refused: 'Ce fichier n’a pas pu être accepté :',
    warnings: 'Points à vérifier',
    submit: 'Envoyer et analyser',
    done: 'Version analysée. Aucun domaine externe détecté. | Version analysée. {n} domaine externe détecté. | Version analysée. {n} domaines externes détectés.',
    missingTitle: 'Fichiers PWA manquants',
    missingMessage:
      'Votre ZIP ne contient pas de manifeste ou de service worker. PWA Store peut les générer pour que votre application soit installable. Voulez-vous continuer ainsi ?',
    missingCancel: 'Non, annuler l’envoi',
    missingOk: 'Oui, les générer'
  },
  workspace: {
    eyebrow: 'Mon application',
    iconAlt: 'Icône de {name}',
    viewInStore: 'Voir dans le Store',
    more: 'Plus d’actions',
    restore: 'Réactiver en brouillon',
    archive: 'Archiver l’application',
    stats: 'Statistiques',
    banner: {
      open: {
        pending:
          'Votre demande a été envoyée le {date}. Elle attend d’être examinée.',
        in_review: 'Votre demande, envoyée le {date}, est en cours d’examen.'
      },
      openLocked:
        'Pendant l’examen, l’application ne peut pas être modifiée. Retirez votre demande si vous devez changer quelque chose.',
      changes_requested: 'Des corrections sont demandées :',
      rejected: 'Votre demande a été refusée :',
      fixThenSubmit:
        'Corrigez les éléments concernés, puis soumettez à nouveau depuis l’onglet « Récapitulatif ».',
      pending: 'Vous avez des modifications non publiées.',
      pendingHelp:
        'Votre application reste en ligne telle qu’elle a été approuvée. Les modifications seront visibles après validation.',
      approved: 'Votre application est approuvée.',
      approvedHelp:
        'La mise en ligne automatique n’a pas pu se faire. Vous pouvez la publier maintenant.',
      suspended: 'Votre application est suspendue :'
    },
    withdraw: 'Retirer ma demande',
    discard: 'Annuler mes modifications',
    reviewAndSubmit: 'Vérifier et soumettre',
    publishNow: 'Publier maintenant',
    tab: {
      info: 'Informations',
      media: 'Images',
      privacy: 'Confidentialité',
      version: 'Version',
      submit: 'Récapitulatif',
      history: 'Suivi'
    },
    missing:
      '{n} élément à compléter | {n} élément à compléter | {n} éléments à compléter',
    field: {
      name: 'Nom de l’application',
      shortDescription: 'Description courte',
      description: 'Description complète',
      category: 'Catégorie',
      subcategory: 'Sous-catégorie (facultatif)',
      languages: 'Langues de l’application',
      countries: 'Pays de disponibilité',
      officialUrl: 'Lien officiel de votre PWA',
      contactEmail: 'E-mail de contact',
      supportUrl: 'Page d’assistance (facultatif)',
      termsUrl: 'Conditions d’utilisation (facultatif)',
      compatibility: 'Appareils et fonctions pris en charge',
      icon: 'Icône',
      screenshots: 'Captures d’écran',
      privacyUrl: 'Politique de confidentialité',
      dataCollected: 'Données collectées'
    },
    hint: {
      shortDescription: 'Une phrase qui donne envie, affichée sous le nom.',
      description:
        'Au moins 30 caractères : à quoi sert l’application, pour qui, ses points forts.',
      languages: 'Les langues dans lesquelles on peut utiliser l’application.',
      countries: 'Laissez vide pour la rendre disponible dans tous les pays.',
      officialUrl:
        'L’adresse officielle de votre PWA ou de son site de présentation.',
      contactEmail:
        'Pour que les utilisateurs et PWA Store puissent vous joindre.',
      icon: 'Image carrée d’au moins 192 × 192 pixels, en PNG, JPG ou WebP (1 Mo maximum).',
      screens:
        'Montrez votre application en action. PNG, JPG ou WebP, 5 Mo maximum par image.',
      privacyUrl:
        'La page qui explique comment vous utilisez les données des utilisateurs.',
      dataCollected:
        'Cochez tout ce que votre application recueille. Ces informations sont affichées sur sa fiche.'
    },
    compatibility: {
      mobile: 'Téléphone',
      tablet: 'Tablette',
      desktop: 'Ordinateur',
      offline: 'Fonctionne hors ligne',
      dark_mode: 'Mode sombre'
    },
    chooseIcon: 'Choisir une icône',
    screens: {
      mobile: 'Captures téléphone',
      tablet: 'Captures tablette (facultatif)'
    },
    removeScreen: 'Retirer cette capture',
    addScreens: 'Ajouter des captures',
    data: {
      none: 'Aucune donnée',
      account: 'Compte (nom, identifiant)',
      contact: 'Coordonnées (e-mail, téléphone)',
      location: 'Localisation',
      health: 'Santé',
      payment: 'Paiement',
      photos: 'Photos et fichiers',
      analytics: 'Statistiques d’utilisation',
      advertising: 'Publicité'
    },
    source: {
      title: 'Comment votre application est fournie',
      save: 'Enregistrer ce choix',
      fixed: 'Ce choix ne peut plus être modifié après la première soumission.',
      check: 'Contrôler mon lien maintenant',
      checkAuto: 'Le lien est contrôlé automatiquement à chaque soumission.'
    },
    build: {
      newVersion: 'Envoyer une version',
      newVersionHelp:
        'Chaque envoi crée une nouvelle version, analysée aussitôt. Elle sera examinée avec votre prochaine demande ; la version en ligne reste disponible pendant ce temps.',
      versions: 'Vos versions',
      putOnline: 'Remettre cette version en ligne'
    },
    versionState: {
      draft: 'Brouillon',
      analysing: 'Analyse en cours',
      ready: 'Prête à soumettre',
      submitted: 'Soumise',
      in_review: 'En examen',
      approved: 'Approuvée',
      rejected: 'Refusée',
      deployed: 'En ligne'
    },
    recap: {
      preview: 'Aperçu de la fiche',
      availability: 'Disponibilité',
      countries:
        'Disponible dans {n} pays | Disponible dans {n} pays | Disponible dans {n} pays',
      allCountries: 'Tous les pays',
      source: 'Application fournie',
      version: 'Version {number} · {domains} domaine(s) externe(s)',
      title: 'Prête pour la validation ?',
      updateTitle: 'Soumettre la mise à jour',
      intro:
        'Vérifiez votre dossier. Après votre envoi, un administrateur l’examine puis prend sa décision.',
      updateIntro:
        'Votre application reste en ligne pendant l’examen. Les changements apparaîtront dès leur validation.',
      changes: 'Ce qui change',
      checks: 'Vérifications',
      nothing: 'Aucune modification à soumettre pour le moment.',
      allGood: 'Tout est prêt.',
      complete: 'Compléter : {section}',
      afterSubmit:
        'Dès qu’elle est approuvée, votre application est publiée automatiquement.'
    },
    submit: 'Soumettre à validation',
    history: {
      requests: 'Vos demandes',
      noRequest: 'Aucune demande envoyée pour le moment.',
      sent: 'Envoyée le {date}',
      decided: 'décidée le {date}'
    },
    event: {
      update_submitted: 'Mise à jour soumise',
      update_withdrawn: 'Mise à jour retirée',
      update_approved: 'Mise à jour approuvée',
      update_changes_requested: 'Corrections demandées sur la mise à jour',
      update_rejected: 'Mise à jour refusée',
      deployed: 'Version mise en ligne',
      version_approved: 'Version approuvée',
      version_rejected: 'Version refusée'
    },
    save: 'Enregistrer',
    saveLive: 'Vos modifications resteront en attente jusqu’à leur validation.',
    saveDraft: 'Enregistré en brouillon, rien n’est publié.',
    saved: 'Brouillon enregistré.',
    savedLive:
      'Modifications enregistrées. Elles seront visibles après validation.',
    fileRejected: 'Ce fichier ne convient pas (format ou taille).',
    confirmSubmit: {
      title: 'Soumettre à validation ?',
      message:
        'Votre dossier sera transmis à l’administration. Vous ne pourrez plus le modifier pendant l’examen, sauf en retirant votre demande.'
    },
    submitted: 'Demande envoyée. Vous serez prévenu de la décision.',
    confirmWithdraw: {
      title: 'Retirer votre demande ?',
      message:
        'Elle ne sera pas examinée. Vous pourrez modifier votre application puis la soumettre à nouveau.'
    },
    withdrawn: 'Demande retirée.',
    confirmDiscard: {
      title: 'Annuler vos modifications ?',
      message: 'La fiche reviendra à la version actuellement publiée.'
    },
    discarded: 'Modifications annulées.'
  },
  requests: {
    openDossier: 'Ouvrir le dossier',
    eyebrow: 'Administration',
    title: 'Demandes de publication',
    intro:
      'Les dossiers préparés par les développeurs, du plus ancien au plus récent. Vous approuvez, demandez une correction ou refusez.',
    open: 'À traiter',
    decided: 'Décidées',
    emptyOpen: 'Aucune demande en attente. Tout est à jour.',
    emptyDecided: 'Aucune décision pour le moment.',
    waiting: 'En attente {time}',
    kind: { initial: 'Première publication', update: 'Mise à jour' },
    status: {
      pending: 'En attente',
      in_review: 'En examen',
      approved: 'Approuvée',
      changes_requested: 'Corrections demandées',
      rejected: 'Refusée',
      withdrawn: 'Retirée'
    },
    alert: {
      quarantined: 'Fonctions sensibles détectées dans le build',
      highRisk:
        '{n} ressource externe à risque élevé | {n} ressource externe à risque élevé | {n} ressources externes à risque élevé',
      unverified: 'Développeur non vérifié'
    },
    backToQueue: 'Retour aux demandes',
    dossier: {
      listing: 'Fiche soumise',
      changed: 'Modifié : {fields}',
      before: 'Avant : {value}',
      source: 'Application fournie',
      urlChecked: 'Lien contrôlé le {date}',
      sensitive: 'Fonctions sensibles détectées',
      noVersion: 'Aucune nouvelle version dans cette demande.',
      developer: 'Développeur',
      verified: 'Profil vérifié',
      notVerified: 'Profil non vérifié',
      otherApps:
        'Aucune autre application | {n} autre application | {n} autres applications',
      decision: 'Décision',
      takeOver: 'Prendre en charge',
      acknowledge:
        'J’ai examiné les fonctions sensibles et je les juge légitimes.',
      resourceCorrections:
        '{n} correction demandée sur les ressources externes reste à examiner. | {n} correction demandée sur les ressources externes reste à examiner. | {n} corrections demandées sur les ressources externes restent à examiner.',
      reason: 'Motif',
      reasonHint:
        'Facultatif pour approuver, obligatoire pour une correction ou un refus.',
      approve: 'Approuver et publier',
      requestChanges: 'Demander une correction',
      reject: 'Refuser',
      approveNote:
        'L’approbation valide l’application et sa version, puis les publie aussitôt.',
      notes: 'Notes internes',
      notesHint: 'Visibles uniquement par l’administration.',
      noteSaved: 'Note enregistrée.',
      history: 'Historique',
      firstRequest: 'Première demande pour cette application.',
      screens: 'Aucune capture | {n} capture | {n} captures'
    },
    confirm: {
      approved: {
        title: 'Approuver et publier ?',
        message: 'L’application sera visible dans le Store dès maintenant.',
        ok: 'Approuver et publier'
      },
      changes_requested: {
        title: 'Demander une correction ?',
        message:
          'Le développeur recevra votre motif et pourra soumettre à nouveau.',
        ok: 'Envoyer la demande'
      },
      rejected: {
        title: 'Refuser cette demande ?',
        message:
          'Le développeur recevra votre motif. La décision est conservée dans l’historique.',
        ok: 'Refuser'
      }
    },
    done: {
      online: 'Approuvée : l’application est en ligne.',
      approvedOffline:
        'Approuvée. La mise en ligne automatique n’a pas pu se faire ; le développeur a été prévenu.',
      changes_requested: 'Demande de correction envoyée.',
      rejected: 'Demande refusée.'
    }
  }
}
