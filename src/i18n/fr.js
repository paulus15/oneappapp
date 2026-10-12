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
          text: 'Votre adresse e-mail doit être confirmée. Votre profil développeur doit être complet, avec une pièce d’identité valide, et vérifié par un administrateur. Sans cela, vous ne pouvez pas soumettre.'
        },
        {
          title: '1. Compléter la fiche',
          text: 'Choisissez une catégorie, ajoutez une icône et écrivez une description d’au moins 30 caractères. C’est ce que les visiteurs verront.'
        },
        {
          title: '2. Fournir l’application',
          text: 'Deux choix. Build ZIP : vous envoyez le dossier de production (index.html, manifeste, service worker) et nous l’analysons tout de suite. URL : votre PWA est déjà en ligne, cliquez sur « Contrôler l’URL » (le contrôle doit dater de moins de 24 h).'
        },
        {
          title: 'Que veut dire le résultat de l’analyse ?',
          text: '« Analyse réussie » : tout va bien. « À examiner » : nous avons trouvé des fonctions sensibles, souvent dans des bibliothèques connues comme Quasar ou SweetAlert. Ce n’est pas bloquant : vous pouvez soumettre, un administrateur vérifiera. Un build avec de vraies erreurs est refusé dès l’envoi, avec la raison.'
        },
        {
          title: '3. Prévisualiser la fiche',
          text: 'Cliquez sur « Aperçu » pour voir votre fiche comme un visiteur. L’étape se coche dès que vous l’avez ouverte. Si vous modifiez la fiche ensuite, regardez à nouveau l’aperçu.'
        },
        {
          title: '4. Soumettre à la revue',
          text: 'Cliquez sur « Soumettre à la revue ». La fiche est verrouillée pendant l’examen.'
        },
        {
          title: '5. La revue',
          text: 'Un administrateur examine l’application, puis chaque build séparément. Il peut approuver, demander une correction (vous corrigez puis soumettez de nouveau) ou refuser. Chaque décision est expliquée et vous recevez une notification.'
        },
        {
          title: '6. Publier',
          text: 'Une application approuvée n’est pas encore visible. Cliquez sur « Publier dans le Store » quand vous êtes prêt. Pour un build, cliquez aussi sur « Publier cette version ».'
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
      publishMessage: 'L’application sera visible par tous les visiteurs.',
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
  }
}
