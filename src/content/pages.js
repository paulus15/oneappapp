// Static page content. Legal pages are drafts: they must be reviewed by a lawyer before launch.
export const pages = {
  about: {
    eyebrow: 'PWA Store',
    title: 'À propos de PWA Store',
    sections: [
      {
        title: 'Notre mission',
        paragraphs: [
          'PWA Store aide le public à découvrir des Progressive Web Apps et aide les développeurs à trouver leurs premiers utilisateurs, à recueillir des avis et à suivre l’accueil de leurs applications.',
          'PWA Store ne remplace ni Google Play ni l’App Store. C’est un canal complémentaire de découverte, de pré-lancement, de test et de distribution Web.'
        ]
      },
      {
        title: 'Comment fonctionne le Store',
        list: [
          'Un compte gratuit permet d’enregistrer des favoris, de retrouver ses applications et de laisser des avis.',
          'Le même compte peut activer un profil développeur pour présenter ses applications.',
          'Chaque éditeur est vérifié, puis chaque application et chaque version sont examinées avant publication.',
          'Les applications s’ouvrent dans le navigateur ; leur installation dépend du navigateur et du système de l’appareil.'
        ]
      },
      {
        title: 'Ce que nous ne promettons pas',
        paragraphs: [
          'Nos contrôles et notre surveillance réduisent certains risques techniques, mais ne constituent pas une garantie absolue de sécurité. Les applications référencées par URL restent hébergées et mises à jour par leurs éditeurs.'
        ]
      }
    ]
  },
  help: {
    eyebrow: 'Aide',
    title: 'Centre d’aide',
    sections: [
      {
        title: 'Compte et connexion',
        faq: [
          {
            q: 'Je n’ai pas reçu le code de confirmation.',
            a: 'Vérifiez vos courriers indésirables, puis utilisez « Renvoyer le code » après une minute. Le code est valable dix minutes.'
          },
          {
            q: 'J’ai oublié mon mot de passe.',
            a: 'Sur la page de connexion, choisissez « Mot de passe oublié ? ». Vous recevrez un code par e-mail pour en définir un nouveau.'
          },
          {
            q: 'Comment activer la double authentification ?',
            a: 'Dans « Mon espace », rubrique « Sécurité du compte ». Un code vous sera demandé par e-mail à chaque connexion.'
          },
          {
            q: 'Comment supprimer mon compte ?',
            a: 'Dans « Sécurité du compte », choisissez « Désactiver mon compte ». Vos données personnelles sont anonymisées 30 jours plus tard.'
          }
        ]
      },
      {
        title: 'Applications',
        faq: [
          {
            q: 'Pourquoi le bouton d’installation n’apparaît-il pas ?',
            a: 'L’installation d’une PWA est proposée par votre navigateur, sur le site de l’application, quand votre appareil la prend en charge. Ouvrez l’application puis utilisez le menu de votre navigateur.'
          },
          {
            q: 'Comment signaler une application ?',
            a: 'Sur la fiche de l’application, choisissez « Signaler », puis le motif. Un avis peut être signalé de la même façon. Vous suivez l’issue de vos signalements dans « Mon espace ».'
          }
        ]
      },
      {
        title: 'Développeurs',
        faq: [
          {
            q: 'Pourquoi ne puis-je pas publier ?',
            a: 'Une publication exige un e-mail confirmé, un profil développeur complet et vérifié, et une pièce d’identité valide. L’onglet « Récapitulatif » de votre application indique précisément ce qui manque.'
          },
          {
            q: 'Mon application est approuvée mais invisible.',
            a: 'L’approbation publie l’application aussitôt. Si la mise en ligne automatique n’a pas pu se faire, un message l’indique dans l’espace de votre application : choisissez « Publier maintenant ».'
          },
          {
            q: 'Le portail développeur n’apparaît pas sur mon téléphone.',
            a: 'Le portail s’utilise sur ordinateur ou tablette. Sur mobile, votre compte fonctionne comme un compte utilisateur.'
          }
        ]
      }
    ]
  },
  'publishing-rules': {
    eyebrow: 'Développeurs',
    title: 'Règles de publication',
    draft: true,
    updated: '12 octobre 2026',
    sections: [
      {
        title: '1. Éditeur',
        list: [
          'Seul un éditeur vérifié (profil complet et pièce d’identité valide) peut publier.',
          'Les informations du profil doivent être exactes et tenues à jour.',
          'Une pièce d’identité expirée suspend la possibilité de publier jusqu’à son renouvellement.'
        ]
      },
      {
        title: '2. Contenu de l’application',
        list: [
          'La fiche décrit fidèlement l’application, ses fonctionnalités et les données qu’elle collecte.',
          'Sont interdits : contenus illicites, logiciels malveillants, hameçonnage, collecte de données sans information ni base légale, usurpation d’identité ou de marque, contenus haineux ou violents, fraude.',
          'Une politique de confidentialité est requise dès que l’application traite des données personnelles.'
        ]
      },
      {
        title: '3. Technique',
        list: [
          'Informations requises avant toute soumission : image de couverture (16:9, au moins 1280 × 720 pixels), catégorie, description courte, description d’au moins 30 caractères, icône carrée (192 × 192 pixels minimum), au moins une capture d’écran, au moins une langue, lien officiel de la PWA, e-mail de contact, politique de confidentialité et données collectées, accès pour la vérification (avec des identifiants de test si nécessaire), présence d’annonces et classification du contenu.',
          'Les déclarations sur les annonces et le contenu doivent être exactes et tenues à jour ; une déclaration trompeuse peut entraîner la suspension. Les identifiants de test doivent être ceux d’un compte de démonstration, jamais d’un compte réel.',
          'Référencement par URL : adresse HTTPS publique, contrôlée automatiquement au moment de la soumission puis surveillée régulièrement.',
          'Dépôt de build : fichiers de production uniquement (index.html à la racine, aucun fichier exécutable) ; aucun script n’est exécuté par PWA Store. Les ressources externes (polices, API, CDN…) sont détectées automatiquement par l’analyse et examinées par l’administration ; aucune déclaration manuelle n’est demandée.',
          'Mesure des installations : l’éditeur peut ajouter à sa PWA le script fourni par PWA Store. Il signale uniquement l’installation, l’ouverture depuis l’écran d’accueil et l’ouverture depuis PWA Store (avec une référence à usage unique qui permet à PWA Store, et à lui seul, de reconnaître le compte), avec un identifiant pseudonyme de l’appareil. L’éditeur doit en informer les utilisateurs de son application dans sa propre politique de confidentialité. Les signaux ne sont acceptés que depuis l’adresse déclarée de l’application ; toute tentative de gonfler les chiffres peut entraîner la suspension.',
          'Toute modification d’une application publiée (fiche, images ou nouvelle version) est examinée avant d’être visible. Pendant l’examen, l’application reste en ligne telle qu’elle a été approuvée.'
        ]
      },
      {
        title: '4. Modération',
        list: [
          'Chaque application et chaque version sont examinées ; une décision est toujours motivée.',
          'PWA Store peut demander une correction, refuser, suspendre ou archiver une application, notamment si son contenu distant change ou devient indisponible.',
          'L’éditeur peut corriger et soumettre à nouveau son application.'
        ]
      },
      {
        title: '5. Avis et statistiques',
        list: [
          'Il est interdit d’acheter, de solliciter contre contrepartie ou de fabriquer des avis.',
          'Toute tentative de manipulation des notes ou des statistiques peut entraîner la suspension.'
        ]
      }
    ]
  },
  terms: {
    eyebrow: 'Légal',
    title: 'Conditions d’utilisation',
    draft: true,
    updated: '12 octobre 2026',
    sections: [
      {
        title: '1. Objet',
        paragraphs: [
          'Les présentes conditions régissent l’utilisation de PWA Store, plateforme de découverte et de distribution Web de Progressive Web Apps, par les visiteurs, les utilisateurs inscrits et les développeurs.'
        ]
      },
      {
        title: '2. Compte',
        list: [
          'L’inscription est gratuite. Vous fournissez des informations exactes et confirmez votre adresse e-mail.',
          'Vous êtes responsable de la confidentialité de votre mot de passe et de l’activité de votre compte.',
          'Vous pouvez désactiver votre compte à tout moment depuis « Sécurité du compte ».'
        ]
      },
      {
        title: '3. Applications référencées',
        paragraphs: [
          'Les applications sont éditées par des tiers, sous leur responsabilité. PWA Store vérifie les éditeurs et examine les applications, sans garantir leur disponibilité, leur exactitude ni l’absence de tout risque. Les applications hébergées par leurs éditeurs peuvent évoluer après leur revue.'
        ]
      },
      {
        title: '4. Développeurs',
        paragraphs: [
          'Les développeurs acceptent les Règles de publication. L’activation et les premières publications sont gratuites ; une contribution pourra être demandée au-delà d’un quota, selon des conditions annoncées à l’avance.'
        ]
      },
      {
        title: '5. Comportements interdits',
        list: [
          'Contourner les mesures de sécurité ou accéder sans autorisation aux données d’autrui.',
          'Publier des avis faux ou manipuler les statistiques.',
          'Utiliser la plateforme à des fins illicites.'
        ]
      },
      {
        title: '6. Suspension',
        paragraphs: [
          'PWA Store peut suspendre un compte ou une application en cas de manquement, après une décision motivée, sauf urgence liée à la sécurité des utilisateurs.'
        ]
      },
      {
        title: '7. Droit applicable',
        paragraphs: [
          'À compléter après revue juridique : droit applicable, juridiction compétente et identité de l’exploitant.'
        ]
      }
    ]
  },
  privacy: {
    eyebrow: 'Légal',
    title: 'Politique de confidentialité',
    draft: true,
    updated: '12 octobre 2026',
    sections: [
      {
        title: '1. Responsable du traitement',
        paragraphs: [
          'À compléter : identité et coordonnées de l’exploitant de PWA Store, et le cas échéant de son représentant ou délégué à la protection des données.'
        ]
      },
      {
        title: '2. Données collectées',
        list: [
          'Compte : nom, adresse e-mail, pays de résidence déclaré (modifiable une fois tous les 30 jours), langue de l’interface, mot de passe (conservé sous forme de hachage irréversible) et préférences (notifications, historique des fiches consultées).',
          'Sécurité : codes de confirmation à usage unique (conservés sous forme de hachage à clé), sessions ouvertes (navigateur ou appareil tel qu’il se présente, dates de création, de dernière utilisation et d’expiration), journal des actions sensibles avec l’adresse IP de leur auteur (changement de pays, décisions de modération, consultation des identifiants de test).',
          'Développeurs : profil (type de compte, nom public, nom légal, pays, représentant, e-mail professionnel, site web, description) et pièce d’identité (type, date d’expiration et fichier conservé dans un stockage privé, accessible seulement aux vérificateurs habilités, puis supprimé au terme de la durée de conservation).',
          'Bibliothèque et usage : favoris, applications déclarées installées par appareil (identifiant de l’appareil généré par le navigateur, plateforme, pays du compte, dates d’installation et d’ouverture), demandes d’installation, fiches consultées récemment (seulement si l’option est activée dans vos préférences), événements d’usage envoyés par l’application (type d’événement, plateforme, modèle de l’appareil, pays du compte).',
          'Contributions : avis et réponses, signalements (motif et précisions), analyses PWA Lab (adresse analysée et rapport).',
          'Mesure des installations : pour les applications dont l’éditeur a ajouté le script de PWA Store, deux événements seulement (installation, ouverture depuis l’écran d’accueil) avec un identifiant pseudonyme de l’appareil, conservé sous forme d’empreinte à clé propre à chaque application. Quand vous ouvrez une telle application depuis PWA Store, le lien contient une référence aléatoire, valable une seule fois et 10 minutes, que le script renvoie : PWA Store relie alors cet appareil à votre compte. Ni votre identifiant ni votre session ne figurent dans le lien, et l’éditeur ne voit qu’un nombre de comptes reconnus, jamais lesquels. Rien de ce que vous faites dans l’application n’est collecté.',
          'Consultations des fiches d’applications : une seule fois par compte et par application, avec sa date et le pays du visiteur. Pour les visiteurs non connectés, une empreinte à clé de l’adresse IP, propre à chaque application (jamais l’adresse elle-même), évite de compter plusieurs fois la même visite sans permettre de suivre un visiteur d’une fiche à l’autre.',
          'Ouvertures d’une application depuis PWA Store : comptées une seule fois par compte et par application, sous forme d’empreinte à clé.',
          'Identifiants de test fournis par un éditeur pour la vérification de son application : chiffrés, consultables uniquement par l’éditeur et l’équipe de vérification ; chaque consultation est journalisée.',
          'Formulaire de contact : nom, adresse e-mail, sujet et message, transmis par e-mail à l’équipe de PWA Store ; ils ne sont pas enregistrés dans la base de données de la plateforme.'
        ]
      },
      {
        title: '3. Finalités',
        list: [
          'Fournir le service et sécuriser les comptes.',
          'Vérifier les éditeurs avant toute publication.',
          'Examiner les applications soumises, y compris avec les identifiants de test fournis par l’éditeur.',
          'Produire des statistiques agrégées pour les développeurs et l’administration.',
          'Prévenir les abus : limites de fréquence, signalements, comptage des installations par compte distinct.',
          'Répondre aux demandes envoyées par le formulaire de contact.'
        ],
        paragraphs: [
          'À valider par un juriste : base légale de chaque traitement (exécution du service, vérification des éditeurs, intérêt légitime pour la sécurité et les statistiques, information des utilisateurs par l’éditeur pour la mesure des installations).'
        ]
      },
      {
        title: '4. Durées de conservation',
        list: [
          'Compte désactivé : données personnelles anonymisées 30 jours après la désactivation ; les avis restent affichés sous un nom anonyme.',
          'Justificatifs et pièces d’identité : supprimés automatiquement au terme de la durée de conservation configurée (30 jours par défaut).',
          'Codes de confirmation : supprimés un jour après leur expiration.',
          'Consultations, mesures d’installation et statistiques d’usage : supprimées après 13 mois ; seuls des totaux par jour sont conservés.',
          'Adresses IP des journaux de sécurité : effacées après 12 mois.',
          'Contrôles techniques des applications et analyses PWA Lab : supprimés après 12 mois.',
          'Notifications lues : supprimées après 6 mois.',
          'Images remplacées ou abandonnées : supprimées sept jours après qu’elles ne sont plus utilisées par aucune fiche ni aucune demande en cours.'
        ]
      },
      {
        title: '5. Vos droits',
        paragraphs: [
          'Vous disposez de droits d’accès, de rectification, d’opposition et d’effacement. Pour les exercer, utilisez le formulaire de contact en choisissant « Données personnelles ».',
          'À valider juridiquement : en Côte d’Ivoire, la loi n° 2013-450 relative à la protection des données à caractère personnel et l’autorité de protection (ARTCI) ; pour les personnes situées dans l’Union européenne, le RGPD. Les autres pays ciblés doivent être examinés.',
          'À compléter : formalité préalable auprès de l’ARTCI (déclaration ou autorisation) et sa référence.'
        ]
      },
      {
        title: '6. Destinataires et transferts',
        paragraphs: [
          'Au sein de PWA Store, seuls les membres de l’équipe habilités accèdent aux pièces d’identité et aux identifiants de test, selon leurs permissions. Les éditeurs reçoivent des statistiques agrégées sur leurs applications, jamais l’identité des personnes qui les consultent ou les installent ; les avis sont publiés sous le nom du compte.',
          'À compléter : hébergeur, prestataire d’envoi d’e-mails, localisation des serveurs et garanties applicables aux transferts internationaux.'
        ]
      }
    ]
  },
  'developer-guide': {
    eyebrow: 'Développeurs',
    title: 'Guide du développeur',
    sections: [
      {
        title: '1. Avant de commencer',
        list: [
          'Confirmez votre adresse e-mail et faites vérifier votre profil développeur avec une pièce d’identité valide.',
          'Votre PWA est en ligne, en HTTPS, avec un manifeste (nom, icônes, start_url) et un service worker.',
          'Préparez une icône carrée (192 × 192 pixels minimum), une image de couverture 16:9 (1920 × 1080 recommandé) et au moins une capture d’écran.'
        ]
      },
      {
        title: '2. Créer votre application',
        paragraphs: [
          'Dans « Mes applications », choisissez « Créer une application » : donnez un nom, une catégorie et le lien de votre PWA. Un brouillon est créé ; rien n’est publié.'
        ]
      },
      {
        title: '3. Compléter la fiche',
        paragraphs: [
          'Dans l’espace de l’application, remplissez les onglets Informations, Images et Confidentialité. Un point orange signale ce qui manque. Chaque onglet s’enregistre en brouillon.'
        ],
        list: [
          'Descriptions, catégorie, langues et pays de disponibilité.',
          'Lien officiel de la PWA et e-mail de contact.',
          'Icône, couverture et captures d’écran.',
          'Politique de confidentialité et données collectées.',
          'Onglet Contenu : accès pour la vérification (identifiants de test chiffrés, visibles seulement par l’équipe de vérification), annonces et questionnaire de classification du contenu.'
        ]
      },
      {
        title: '4. Mesurer les installations',
        paragraphs: [
          'Dans l’onglet Version, copiez la ligne de mesure et collez-la dans l’index.html de votre PWA, juste avant </body>. Cliquez ensuite sur « Vérifier mon site » : PWA Store confirme que la ligne est bien en place.',
          'Si votre site utilise une politique de sécurité (CSP), autorisez l’adresse de PWA Store pour script-src et connect-src.'
        ]
      },
      {
        title: '5. Soumettre et suivre',
        paragraphs: [
          'L’onglet Récapitulatif montre votre fiche telle qu’elle sera publiée. Cliquez sur « Soumettre à validation ». Pendant l’examen, le dossier est verrouillé ; vous pouvez le retirer pour le modifier.',
          'Suivez toutes vos demandes dans « Suivi des validations ». Si une correction est demandée, le motif s’affiche en haut de l’application : corrigez, puis soumettez à nouveau. Une approbation publie aussitôt l’application.'
        ]
      },
      {
        title: '6. Après la publication',
        paragraphs: [
          'Vos modifications restent en attente et votre application reste en ligne telle qu’elle a été approuvée. Soumettez la mise à jour : elle sera visible dès sa validation.'
        ]
      },
      {
        title: 'Questions fréquentes',
        faq: [
          {
            q: 'Mon application n’apparaît pas dans un pays.',
            a: 'Vérifiez sa disponibilité géographique dans l’onglet Informations : si vous avez choisi des pays, elle n’est visible que dans ceux-ci.'
          },
          {
            q: '« Vérifier mon site » ne trouve pas le script.',
            a: 'La ligne doit figurer dans le code HTML envoyé par votre serveur. Un script ajouté par JavaScript après le chargement ne peut pas être détecté.'
          },
          {
            q: 'Pourquoi mes installations restent à zéro ?',
            a: 'Les signaux ne sont comptés qu’une fois l’application publiée, et seulement depuis son adresse déclarée.'
          }
        ]
      }
    ]
  }
}
