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
          'Informations requises avant toute soumission : catégorie, description courte, description d’au moins 30 caractères, icône carrée (192 × 192 pixels minimum), au moins une capture d’écran, au moins une langue, lien officiel de la PWA, e-mail de contact, politique de confidentialité et données collectées.',
          'Référencement par URL : adresse HTTPS publique, contrôlée automatiquement au moment de la soumission puis surveillée régulièrement.',
          'Dépôt de build : fichiers de production uniquement (index.html à la racine, aucun fichier exécutable) ; aucun script n’est exécuté par PWA Store. Les ressources externes (polices, API, CDN…) sont détectées automatiquement par l’analyse et examinées par l’administration ; aucune déclaration manuelle n’est demandée.',
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
          'Compte : nom, adresse e-mail, pays de résidence déclaré, mot de passe (stocké sous forme chiffrée irréversible).',
          'Sécurité : codes de confirmation (stockés sous forme d’empreinte), sessions actives, adresse IP des actions d’administration.',
          'Développeurs : informations de profil, pièce d’identité (type, date d’expiration et fichier privé).',
          'Usage : favoris, applications déclarées installées par appareil, avis, événements d’ouverture des applications.'
        ]
      },
      {
        title: '3. Finalités',
        list: [
          'Fournir le service et sécuriser les comptes.',
          'Vérifier les éditeurs avant toute publication.',
          'Produire des statistiques agrégées pour les développeurs et l’administration.',
          'Répondre aux demandes envoyées par le formulaire de contact.'
        ]
      },
      {
        title: '4. Durées de conservation',
        list: [
          'Compte désactivé : données personnelles anonymisées 30 jours après la désactivation ; les avis restent affichés sous un nom anonyme.',
          'Justificatifs et pièces d’identité : supprimés automatiquement au terme de la durée de conservation configurée (30 jours par défaut).',
          'Codes de confirmation : supprimés un jour après leur expiration.'
        ]
      },
      {
        title: '5. Vos droits',
        paragraphs: [
          'Vous disposez de droits d’accès, de rectification, d’opposition et d’effacement. Pour les exercer, utilisez le formulaire de contact en choisissant « Données personnelles ».',
          'À valider juridiquement : en Côte d’Ivoire, la loi n° 2013-450 relative à la protection des données à caractère personnel et l’autorité de protection (ARTCI) ; pour les personnes situées dans l’Union européenne, le RGPD. Les autres pays ciblés doivent être examinés.'
        ]
      },
      {
        title: '6. Destinataires et transferts',
        paragraphs: [
          'À compléter : hébergeur, prestataire d’envoi d’e-mails, localisation des serveurs et garanties applicables aux transferts internationaux.'
        ]
      }
    ]
  }
}
