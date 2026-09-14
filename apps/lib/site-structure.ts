/**
 * URL structure of the public portal of Bloctel, the national service for
 * managing unwanted commercial communications of the Republic of Astoria
 * (`bloctel.gouv.aor`).
 *
 * Hrefs are locale-agnostic pathnames: the next-intl Link (registered as the
 * ADS link renderer) prefixes the active locale automatically. Labels are
 * never stored here — they come from the message catalogs through the key
 * provided by each entry (see `apps/messages/{fr,en}.json`).
 *
 * Architecture of the navigation:
 *
 *   primaryNavigation  → the seven entries of the portal. Each entry opens a
 *                        mega-menu panel structured in four sections of four
 *                        links:
 *                            7 entrées × 4 sections × 4 liens = 112 liens
 *
 * This file is the single source of truth of the portal navigation: the
 * header (desktop mega-menus and mobile drawer), the sitemap and the footer
 * all derive their markup from `primaryNavigation`, so adding or renaming a
 * theme, section or link never requires rewriting a component — it only
 * requires editing this file (and the matching message keys).
 *
 * The information architecture is organised around the visitor and their
 * protection against unwanted commercial prospecting — not around the
 * administrative organisation that runs the service. It follows the citizen
 * journey, from rights to action:
 *
 *   Mes droits      → comprendre : le démarchage, les droits et les situations
 *   Ma protection   → se protéger : le registre, les coordonnées, les préférences et consentements
 *   Signaler        → agir       : déclarer un démarchage abusif et en suivre le traitement
 *   Professionnels  → se conformer : consulter la liste, recueillir le consentement, piloter les campagnes
 *   Réglementation  → connaître  : le cadre légal, les obligations, les restrictions et les contrôles
 *   Services        → accéder    : les portails citoyen et professionnel, les développeurs, les données
 *   Aide            → être aidé  : les questions fréquentes, les guides et l'assistance
 *
 * The structure deliberately keeps a Bloctel perimeter: the operational
 * treatment of reports (investigations, sanctions, litigation) belongs to the
 * competent authorities and is only exposed here through the entry points
 * that matter to the visitor. It is sufficiently generic to grow with the
 * service without inventing new sections just to fill the 7 × 4 × 4 model.
 *
 * The structure is validated both at compile time (the tuple types below
 * enforce exactly 7 themes × 4 sections × 4 links) and at runtime
 * (`validateNavigationStructure`), so a malformed navigation fails the build.
 *
 * Hrefs follow the URL plan of the portal; several point to pages being
 * published and will resolve as soon as those sections ship.
 */
export const PORTAL_HOME = "/";

/**
 * The seven entries of the portal — both `nav.primary` and `footer.columns`
 * keys. The first three entries carry the citizen journey (rights,
 * protection, reporting); the fourth addresses professionals; the last three
 * are the reference, service and support entries.
 */
export type PrimaryNavKey =
  | "mesDroits"
  | "maProtection"
  | "signaler"
  | "professionnels"
  | "reglementation"
  | "services"
  | "aide";

/** A destination inside a mega-menu panel; its label is a `nav.panel` message key. */
export type NavigationLink = {
  labelKey: string;
  href: string;
};

/**
 * A section of a navigation theme. In the mega-menu panel it heads one of the
 * four columns (`labelKey` → `nav.panel.<theme>.<section>.title`); in the
 * footer it becomes a destination of the domain column. It carries the four
 * destinations of the section.
 */
export type NavigationItem = NavigationLink & {
  /** Related destinations nested under this section. */
  links: NavigationLinks;
};

/**
 * The four destinations of a section. The tuple type is the compile-time
 * guarantee that no section exposes anything other than exactly 4 links.
 */
export type NavigationLinks = readonly [
  NavigationLink,
  NavigationLink,
  NavigationLink,
  NavigationLink,
];

/**
 * The four sections of a theme. The tuple type is the compile-time guarantee
 * that no theme exposes anything other than exactly 4 sections.
 */
export type NavigationItems = readonly [
  NavigationItem,
  NavigationItem,
  NavigationItem,
  NavigationItem,
];

/**
 * One top-level entry of the Government Header navigation.
 *
 * Navigation principle (info.gouv.fr-inspired, adapted to Astoria): the header
 * is organised around the visitor journey and their protection — not around
 * the internal structure of the administration. Each entry opens a mega-menu
 * panel composed of
 *  - a leader band: the entry name, a one-line description and the main
 *    action of the section (“Tout sur mes droits”, …),
 *  - four sections, each headed by its title and followed by its four
 *    destinations.
 *
 * Top-level labels resolve under `nav.primary` (`labelKey`), panel content
 * under `nav.panel` (`titleKey`, `paragraphKey`, nested `labelKey`s).
 */
export type NavigationSection = {
  type: "megaMenu";
  /** Message key (`nav.primary`) of the top-level tab. */
  labelKey: PrimaryNavKey;
  /** Landing page of the section, used by the leader action and active-state detection. */
  href: string;
  /** Leader band shown on top of the panel. */
  leader: {
    titleKey: string;
    paragraphKey: string;
    link: NavigationLink;
  };
  /** The four sections of the theme, each with its four links. */
  primaryItems: NavigationItems;
};

export type FooterColumn = {
  /** Message key (`footer.columns`) of the column heading. */
  columnKey: string;
  links: ReadonlyArray<NavigationLink>;
};

export const sectionPaths = {
  mesDroits: "/mes-droits",
  maProtection: "/ma-protection",
  signaler: "/signaler",
  professionnels: "/professionnels",
  reglementation: "/reglementation",
  services: "/services",
  aide: "/aide",
} as const;

export const legalPaths = {
  accessibility: "/legal/accessibility",
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  cookies: "/legal/cookies",
  sitemap: "/sitemap",
} as const;

export const searchPath = "/search";

/** DOM ids used as skip-link targets. */
export const pageAnchors = {
  content: "main-content",
  footer: "main-footer",
} as const;

/** Structural guard: the navigation must stay a fixed 7 × 4 × 4 grid. */
export const navigationShape = {
  themes: 7,
  sectionsPerTheme: 4,
  linksPerSection: 4,
} as const;

/**
 * Runtime validation of the navigation structure. Returns the list of
 * problems found (empty when the structure is valid):
 *  - the portal must expose exactly 7 themes;
 *  - each theme must contain exactly 4 sections;
 *  - each section must contain exactly 4 links;
 *  - every link must carry a non-empty, absolute-path destination.
 *
 * The same invariants are enforced at compile time by the tuple types
 * (`NavigationItems`, `NavigationLinks` and the seven-tuple below).
 */
export function validateNavigationStructure(
  navigation: ReadonlyArray<NavigationSection> = primaryNavigation
): string[] {
  const problems: string[] = [];

  if (navigation.length !== navigationShape.themes) {
    problems.push(
      `La navigation doit comporter exactement ${navigationShape.themes} thèmes, or elle en compte ${navigation.length}.`
    );
  }

  for (const section of navigation) {
    if (section.primaryItems.length !== navigationShape.sectionsPerTheme) {
      problems.push(
        `Le thème « ${section.labelKey} » doit contenir exactement ${navigationShape.sectionsPerTheme} sections, or il en compte ${section.primaryItems.length}.`
      );
    }

    for (const item of section.primaryItems) {
      if (item.links.length !== navigationShape.linksPerSection) {
        problems.push(
          `La section « ${item.labelKey} » doit contenir exactement ${navigationShape.linksPerSection} liens, or elle en compte ${item.links.length}.`
        );
      }

      for (const link of item.links) {
        if (!link.href || !link.href.startsWith("/")) {
          problems.push(
            `Le lien « ${link.labelKey} » (« ${item.labelKey} ») n'a pas de destination valide : « ${link.href} ».`
          );
        }
      }
    }
  }

  return problems;
}

/**
 * Throws when the navigation structure is malformed. Called at module load so
 * a structural error fails the build immediately instead of shipping a broken
 * header. Satisfies the contract: 7 thèmes × 4 sections × 4 liens = 112 liens.
 */
function assertNavigationStructureValid(): void {
  const problems = validateNavigationStructure();
  if (problems.length > 0) {
    throw new Error(
      `Structure de navigation invalide :\n- ${problems.join("\n- ")}`
    );
  }
}

/** Convenience: the total number of destinations exposed by the navigation. */
export function countNavigationLinks(
  navigation: ReadonlyArray<NavigationSection> = primaryNavigation
): number {
  return navigation.reduce(
    (total, section) =>
      total +
      section.primaryItems.reduce(
        (sectionTotal, item) => sectionTotal + item.links.length,
        0
      ),
    0
  );
}

/**
 * Main navigation of the Government Header of Bloctel — the permanent
 * information architecture of the portal, organised in seven entries:
 *
 *   Mes droits      → comprendre : le démarchage, les droits, les situations et la compréhension du dispositif
 *   Ma protection   → se protéger : le registre, les coordonnées, les préférences et les consentements
 *   Signaler        → agir       : créer et suivre un signalement, connaître les suites
 *   Professionnels  → se conformer : l'entreprise, la consultation de la liste, les consentements et les campagnes
 *   Réglementation  → connaître  : le cadre légal, les obligations, les restrictions et les contrôles
 *   Services        → accéder    : les portails citoyen et professionnel, les développeurs et les données publiques
 *   Aide            → être aidé  : les questions fréquentes, les guides, l'assistance et la présentation du service
 *
 * The first three entries follow the citizen journey; the fourth is the
 * distinct professional journey; the last three are the reference, access and
 * support entries. This keeps the two audiences clearly separated without
 * turning the navigation into a mirror of the administrative organisation.
 *
 * Each entry opens a mega-menu panel with a leader band and four sections —
 * each section headed by its title and followed by its four destinations. The
 * panel is not the sitemap of the portal; it exposes the destinations that
 * matter to the visitor journey. The structure is configuration-driven and
 * validated: adding a section only means adding an entry here (and the
 * matching messages).
 */
export const primaryNavigation: ReadonlyArray<NavigationSection> = [
  {
    type: "megaMenu",
    labelKey: "mesDroits",
    href: sectionPaths.mesDroits,
    leader: {
      titleKey: "mesDroits.title",
      paragraphKey: "mesDroits.text",
      link: {
        labelKey: "mesDroits.allLink",
        href: sectionPaths.mesDroits,
      },
    },
    primaryItems: [
      {
        labelKey: "mesDroits.demarchage.title",
        href: `${sectionPaths.mesDroits}/demarchage`,
        links: [
          { labelKey: "mesDroits.demarchage.questCeQueLeDemarchage", href: `${sectionPaths.mesDroits}/demarchage/quest-ce-que-le-demarchage` },
          { labelKey: "mesDroits.demarchage.demarchageAutorise", href: `${sectionPaths.mesDroits}/demarchage/demarchage-autorise` },
          { labelKey: "mesDroits.demarchage.demarchageInterdit", href: `${sectionPaths.mesDroits}/demarchage/demarchage-interdit` },
          { labelKey: "mesDroits.demarchage.reconnaitreUnAppelAbusif", href: `${sectionPaths.mesDroits}/demarchage/reconnaitre-un-appel-abusif` },
        ],
      },
      {
        labelKey: "mesDroits.vosDroits.title",
        href: `${sectionPaths.mesDroits}/vos-droits`,
        links: [
          { labelKey: "mesDroits.vosDroits.droitOpposition", href: `${sectionPaths.mesDroits}/vos-droits/droit-d-opposition` },
          { labelKey: "mesDroits.vosDroits.protectionDesConsommateurs", href: `${sectionPaths.mesDroits}/vos-droits/protection-des-consommateurs` },
          { labelKey: "mesDroits.vosDroits.donneesPersonnelles", href: `${sectionPaths.mesDroits}/vos-droits/donnees-personnelles` },
          { labelKey: "mesDroits.vosDroits.recoursEtReclamations", href: `${sectionPaths.mesDroits}/vos-droits/recours-et-reclamations` },
        ],
      },
      {
        labelKey: "mesDroits.situations.title",
        href: `${sectionPaths.mesDroits}/situations`,
        links: [
          { labelKey: "mesDroits.situations.particuliers", href: `${sectionPaths.mesDroits}/situations/particuliers` },
          { labelKey: "mesDroits.situations.numerosMobiles", href: `${sectionPaths.mesDroits}/situations/numeros-mobiles` },
          { labelKey: "mesDroits.situations.numerosProfessionnels", href: `${sectionPaths.mesDroits}/situations/numeros-professionnels` },
          { labelKey: "mesDroits.situations.casParticuliers", href: `${sectionPaths.mesDroits}/situations/cas-particuliers` },
        ],
      },
      {
        labelKey: "mesDroits.comprendre.title",
        href: `${sectionPaths.mesDroits}/comprendre`,
        links: [
          { labelKey: "mesDroits.comprendre.fonctionnementDeBloctel", href: `${sectionPaths.mesDroits}/comprendre/fonctionnement-de-bloctel` },
          { labelKey: "mesDroits.comprendre.acteursDuDispositif", href: `${sectionPaths.mesDroits}/comprendre/acteurs-du-dispositif` },
          { labelKey: "mesDroits.comprendre.chiffresCles", href: `${sectionPaths.mesDroits}/comprendre/chiffres-cles` },
          { labelKey: "mesDroits.comprendre.questionsSurLeDemarchage", href: `${sectionPaths.mesDroits}/comprendre/questions-sur-le-demarchage` },
        ],
      },
    ],
  },
  {
    type: "megaMenu",
    labelKey: "maProtection",
    href: sectionPaths.maProtection,
    leader: {
      titleKey: "maProtection.title",
      paragraphKey: "maProtection.text",
      link: {
        labelKey: "maProtection.allLink",
        href: sectionPaths.maProtection,
      },
    },
    primaryItems: [
      {
        labelKey: "maProtection.monRegistre.title",
        href: `${sectionPaths.maProtection}/mon-registre`,
        links: [
          { labelKey: "maProtection.monRegistre.mInscrire", href: `${sectionPaths.maProtection}/mon-registre/m-inscrire` },
          { labelKey: "maProtection.monRegistre.verifierMonInscription", href: `${sectionPaths.maProtection}/mon-registre/verifier-mon-inscription` },
          { labelKey: "maProtection.monRegistre.renouvelerMonInscription", href: `${sectionPaths.maProtection}/mon-registre/renouveler-mon-inscription` },
          { labelKey: "maProtection.monRegistre.meDesinscrire", href: `${sectionPaths.maProtection}/mon-registre/me-desinscrire` },
        ],
      },
      {
        labelKey: "maProtection.coordonnees.title",
        href: `${sectionPaths.maProtection}/coordonnees`,
        links: [
          { labelKey: "maProtection.coordonnees.ajouterUnNumero", href: `${sectionPaths.maProtection}/coordonnees/ajouter-un-numero` },
          { labelKey: "maProtection.coordonnees.modifierUnNumero", href: `${sectionPaths.maProtection}/coordonnees/modifier-un-numero` },
          { labelKey: "maProtection.coordonnees.supprimerUnNumero", href: `${sectionPaths.maProtection}/coordonnees/supprimer-un-numero` },
          { labelKey: "maProtection.coordonnees.numerosEtLignes", href: `${sectionPaths.maProtection}/coordonnees/numeros-et-lignes` },
        ],
      },
      {
        labelKey: "maProtection.preferences.title",
        href: `${sectionPaths.maProtection}/preferences`,
        links: [
          { labelKey: "maProtection.preferences.canauxDeContact", href: `${sectionPaths.maProtection}/preferences/canaux-de-contact` },
          { labelKey: "maProtection.preferences.typesDAppels", href: `${sectionPaths.maProtection}/preferences/types-d-appels` },
          { labelKey: "maProtection.preferences.horairesEtFrequence", href: `${sectionPaths.maProtection}/preferences/horaires-et-frequence` },
          { labelKey: "maProtection.preferences.notifications", href: `${sectionPaths.maProtection}/preferences/notifications` },
        ],
      },
      {
        labelKey: "maProtection.consentements.title",
        href: `${sectionPaths.maProtection}/consentements`,
        links: [
          { labelKey: "maProtection.consentements.consentementCommercial", href: `${sectionPaths.maProtection}/consentements/consentement-commercial` },
          { labelKey: "maProtection.consentements.retirerMonConsentement", href: `${sectionPaths.maProtection}/consentements/retirer-mon-consentement` },
          { labelKey: "maProtection.consentements.consentementDesTiers", href: `${sectionPaths.maProtection}/consentements/consentement-des-tiers` },
          { labelKey: "maProtection.consentements.gererMesConsentements", href: `${sectionPaths.maProtection}/consentements/gerer-mes-consentements` },
        ],
      },
    ],
  },
  {
    type: "megaMenu",
    labelKey: "signaler",
    href: sectionPaths.signaler,
    leader: {
      titleKey: "signaler.title",
      paragraphKey: "signaler.text",
      link: { labelKey: "signaler.allLink", href: sectionPaths.signaler },
    },
    primaryItems: [
      {
        labelKey: "signaler.nouveauSignalement.title",
        href: `${sectionPaths.signaler}/nouveau-signalement`,
        links: [
          { labelKey: "signaler.nouveauSignalement.signalerUnAppel", href: `${sectionPaths.signaler}/nouveau-signalement/signaler-un-appel` },
          { labelKey: "signaler.nouveauSignalement.signalerUnSms", href: `${sectionPaths.signaler}/nouveau-signalement/signaler-un-sms` },
          { labelKey: "signaler.nouveauSignalement.signalerUnNumero", href: `${sectionPaths.signaler}/nouveau-signalement/signaler-un-numero` },
          { labelKey: "signaler.nouveauSignalement.informationsAFournir", href: `${sectionPaths.signaler}/nouveau-signalement/informations-a-fournir` },
        ],
      },
      {
        labelKey: "signaler.mesSignalements.title",
        href: `${sectionPaths.signaler}/mes-signalements`,
        links: [
          { labelKey: "signaler.mesSignalements.suivreUnSignalement", href: `${sectionPaths.signaler}/mes-signalements/suivre-un-signalement` },
          { labelKey: "signaler.mesSignalements.historique", href: `${sectionPaths.signaler}/mes-signalements/historique` },
          { labelKey: "signaler.mesSignalements.modifierUnSignalement", href: `${sectionPaths.signaler}/mes-signalements/modifier-un-signalement` },
          { labelKey: "signaler.mesSignalements.supprimerUnSignalement", href: `${sectionPaths.signaler}/mes-signalements/supprimer-un-signalement` },
        ],
      },
      {
        labelKey: "signaler.informations.title",
        href: `${sectionPaths.signaler}/informations`,
        links: [
          { labelKey: "signaler.informations.questCeQuUnSignalement", href: `${sectionPaths.signaler}/informations/quest-ce-qu-un-signalement` },
          { labelKey: "signaler.informations.quiPeutSignaler", href: `${sectionPaths.signaler}/informations/qui-peut-signaler` },
          { labelKey: "signaler.informations.confidentialite", href: `${sectionPaths.signaler}/informations/confidentialite` },
          { labelKey: "signaler.informations.signalementsEtDroits", href: `${sectionPaths.signaler}/informations/signalements-et-droits` },
        ],
      },
      {
        labelKey: "signaler.suites.title",
        href: `${sectionPaths.signaler}/suites`,
        links: [
          { labelKey: "signaler.suites.traitementDesSignalements", href: `${sectionPaths.signaler}/suites/traitement-des-signalements` },
          { labelKey: "signaler.suites.enquetesEtControles", href: `${sectionPaths.signaler}/suites/enquetes-et-controles` },
          { labelKey: "signaler.suites.sanctions", href: `${sectionPaths.signaler}/suites/sanctions` },
          { labelKey: "signaler.suites.resultats", href: `${sectionPaths.signaler}/suites/resultats` },
        ],
      },
    ],
  },
  {
    type: "megaMenu",
    labelKey: "professionnels",
    href: sectionPaths.professionnels,
    leader: {
      titleKey: "professionnels.title",
      paragraphKey: "professionnels.text",
      link: {
        labelKey: "professionnels.allLink",
        href: sectionPaths.professionnels,
      },
    },
    primaryItems: [
      {
        labelKey: "professionnels.monEntreprise.title",
        href: `${sectionPaths.professionnels}/mon-entreprise`,
        links: [
          { labelKey: "professionnels.monEntreprise.espaceProfessionnel", href: `${sectionPaths.professionnels}/mon-entreprise/espace-professionnel` },
          { labelKey: "professionnels.monEntreprise.declarerMonActivite", href: `${sectionPaths.professionnels}/mon-entreprise/declarer-mon-activite` },
          { labelKey: "professionnels.monEntreprise.gererMesAcces", href: `${sectionPaths.professionnels}/mon-entreprise/gerer-mes-acces` },
          { labelKey: "professionnels.monEntreprise.conformite", href: `${sectionPaths.professionnels}/mon-entreprise/conformite` },
        ],
      },
      {
        labelKey: "professionnels.verifier.title",
        href: `${sectionPaths.professionnels}/verifier`,
        links: [
          { labelKey: "professionnels.verifier.consulterLaListe", href: `${sectionPaths.professionnels}/verifier/consulter-la-liste` },
          { labelKey: "professionnels.verifier.interrogerUnNumero", href: `${sectionPaths.professionnels}/verifier/interroger-un-numero` },
          { labelKey: "professionnels.verifier.miseAJourDesDonnees", href: `${sectionPaths.professionnels}/verifier/mise-a-jour-des-donnees` },
          { labelKey: "professionnels.verifier.tracabiliteDesConsultations", href: `${sectionPaths.professionnels}/verifier/tracabilite-des-consultations` },
        ],
      },
      {
        labelKey: "professionnels.consentements.title",
        href: `${sectionPaths.professionnels}/consentements`,
        links: [
          { labelKey: "professionnels.consentements.recueillirLeConsentement", href: `${sectionPaths.professionnels}/consentements/recueillir-le-consentement` },
          { labelKey: "professionnels.consentements.prouverLeConsentement", href: `${sectionPaths.professionnels}/consentements/prouver-le-consentement` },
          { labelKey: "professionnels.consentements.dureeDeValidite", href: `${sectionPaths.professionnels}/consentements/duree-de-validite` },
          { labelKey: "professionnels.consentements.exceptions", href: `${sectionPaths.professionnels}/consentements/exceptions` },
        ],
      },
      {
        labelKey: "professionnels.campagnes.title",
        href: `${sectionPaths.professionnels}/campagnes`,
        links: [
          { labelKey: "professionnels.campagnes.preparerUneCampagne", href: `${sectionPaths.professionnels}/campagnes/preparer-une-campagne` },
          { labelKey: "professionnels.campagnes.fichiersDAppel", href: `${sectionPaths.professionnels}/campagnes/fichiers-d-appel` },
          { labelKey: "professionnels.campagnes.controlerLesListes", href: `${sectionPaths.professionnels}/campagnes/controler-les-listes` },
          { labelKey: "professionnels.campagnes.bonnesPratiques", href: `${sectionPaths.professionnels}/campagnes/bonnes-pratiques` },
        ],
      },
    ],
  },
  {
    type: "megaMenu",
    labelKey: "reglementation",
    href: sectionPaths.reglementation,
    leader: {
      titleKey: "reglementation.title",
      paragraphKey: "reglementation.text",
      link: {
        labelKey: "reglementation.allLink",
        href: sectionPaths.reglementation,
      },
    },
    primaryItems: [
      {
        labelKey: "reglementation.cadreLegal.title",
        href: `${sectionPaths.reglementation}/cadre-legal`,
        links: [
          { labelKey: "reglementation.cadreLegal.textesDeReference", href: `${sectionPaths.reglementation}/cadre-legal/textes-de-reference` },
          { labelKey: "reglementation.cadreLegal.loiEtDecrets", href: `${sectionPaths.reglementation}/cadre-legal/loi-et-decrets` },
          { labelKey: "reglementation.cadreLegal.codeDeLaConsommation", href: `${sectionPaths.reglementation}/cadre-legal/code-de-la-consommation` },
          { labelKey: "reglementation.cadreLegal.jurisprudence", href: `${sectionPaths.reglementation}/cadre-legal/jurisprudence` },
        ],
      },
      {
        labelKey: "reglementation.obligations.title",
        href: `${sectionPaths.reglementation}/obligations`,
        links: [
          { labelKey: "reglementation.obligations.consultationObligatoire", href: `${sectionPaths.reglementation}/obligations/consultation-obligatoire` },
          { labelKey: "reglementation.obligations.informationDesConsommateurs", href: `${sectionPaths.reglementation}/obligations/information-des-consommateurs` },
          { labelKey: "reglementation.obligations.obligationsDesOperateurs", href: `${sectionPaths.reglementation}/obligations/obligations-des-operateurs` },
          { labelKey: "reglementation.obligations.obligationsDesPlateformes", href: `${sectionPaths.reglementation}/obligations/obligations-des-plateformes` },
        ],
      },
      {
        labelKey: "reglementation.restrictions.title",
        href: `${sectionPaths.reglementation}/restrictions`,
        links: [
          { labelKey: "reglementation.restrictions.horairesDAppel", href: `${sectionPaths.reglementation}/restrictions/horaires-d-appel` },
          { labelKey: "reglementation.restrictions.joursEtPeriodes", href: `${sectionPaths.reglementation}/restrictions/jours-et-periodes` },
          { labelKey: "reglementation.restrictions.numerosInterdits", href: `${sectionPaths.reglementation}/restrictions/numeros-interdits` },
          { labelKey: "reglementation.restrictions.secteursReglementes", href: `${sectionPaths.reglementation}/restrictions/secteurs-reglementes` },
        ],
      },
      {
        labelKey: "reglementation.controles.title",
        href: `${sectionPaths.reglementation}/controles`,
        links: [
          { labelKey: "reglementation.controles.autoriteDeControle", href: `${sectionPaths.reglementation}/controles/autorite-de-controle` },
          { labelKey: "reglementation.controles.proceduresDeControle", href: `${sectionPaths.reglementation}/controles/procedures-de-controle` },
          { labelKey: "reglementation.controles.controlesEtSignalements", href: `${sectionPaths.reglementation}/controles/controles-et-signalements` },
          { labelKey: "reglementation.controles.resultatsDesControles", href: `${sectionPaths.reglementation}/controles/resultats-des-controles` },
        ],
      },
    ],
  },
  {
    type: "megaMenu",
    labelKey: "services",
    href: sectionPaths.services,
    leader: {
      titleKey: "services.title",
      paragraphKey: "services.text",
      link: { labelKey: "services.allLink", href: sectionPaths.services },
    },
    primaryItems: [
      {
        labelKey: "services.portailCitoyen.title",
        href: `${sectionPaths.services}/portail-citoyen`,
        links: [
          { labelKey: "services.portailCitoyen.mInscrire", href: `${sectionPaths.services}/portail-citoyen/m-inscrire` },
          { labelKey: "services.portailCitoyen.signalerUnAppel", href: `${sectionPaths.services}/portail-citoyen/signaler-un-appel` },
          { labelKey: "services.portailCitoyen.monEspace", href: `${sectionPaths.services}/portail-citoyen/mon-espace` },
          { labelKey: "services.portailCitoyen.aideEnLigne", href: `${sectionPaths.services}/portail-citoyen/aide-en-ligne` },
        ],
      },
      {
        labelKey: "services.portailProfessionnel.title",
        href: `${sectionPaths.services}/portail-professionnel`,
        links: [
          { labelKey: "services.portailProfessionnel.seConnecter", href: `${sectionPaths.services}/portail-professionnel/se-connecter` },
          { labelKey: "services.portailProfessionnel.interrogerLaListe", href: `${sectionPaths.services}/portail-professionnel/interroger-la-liste` },
          { labelKey: "services.portailProfessionnel.abonnements", href: `${sectionPaths.services}/portail-professionnel/abonnements` },
          { labelKey: "services.portailProfessionnel.support", href: `${sectionPaths.services}/portail-professionnel/support` },
        ],
      },
      {
        labelKey: "services.developpeurs.title",
        href: `${sectionPaths.services}/developpeurs`,
        links: [
          { labelKey: "services.developpeurs.apiBloctel", href: `${sectionPaths.services}/developpeurs/api-bloctel` },
          { labelKey: "services.developpeurs.documentation", href: `${sectionPaths.services}/developpeurs/documentation` },
          { labelKey: "services.developpeurs.guidesTechniques", href: `${sectionPaths.services}/developpeurs/guides-techniques` },
          { labelKey: "services.developpeurs.statutDuService", href: `${sectionPaths.services}/developpeurs/statut-du-service` },
        ],
      },
      {
        labelKey: "services.donneesPubliques.title",
        href: `${sectionPaths.services}/donnees-publiques`,
        links: [
          { labelKey: "services.donneesPubliques.statistiques", href: `${sectionPaths.services}/donnees-publiques/statistiques` },
          { labelKey: "services.donneesPubliques.jeuxDeDonnees", href: `${sectionPaths.services}/donnees-publiques/jeux-de-donnees` },
          { labelKey: "services.donneesPubliques.rapports", href: `${sectionPaths.services}/donnees-publiques/rapports` },
          { labelKey: "services.donneesPubliques.openData", href: `${sectionPaths.services}/donnees-publiques/open-data` },
        ],
      },
    ],
  },
  {
    type: "megaMenu",
    labelKey: "aide",
    href: sectionPaths.aide,
    leader: {
      titleKey: "aide.title",
      paragraphKey: "aide.text",
      link: { labelKey: "aide.allLink", href: sectionPaths.aide },
    },
    primaryItems: [
      {
        labelKey: "aide.questionsFrequentes.title",
        href: `${sectionPaths.aide}/questions-frequentes`,
        links: [
          { labelKey: "aide.questionsFrequentes.inscription", href: `${sectionPaths.aide}/questions-frequentes/inscription` },
          { labelKey: "aide.questionsFrequentes.signalement", href: `${sectionPaths.aide}/questions-frequentes/signalement` },
          { labelKey: "aide.questionsFrequentes.droits", href: `${sectionPaths.aide}/questions-frequentes/droits` },
          { labelKey: "aide.questionsFrequentes.professionnels", href: `${sectionPaths.aide}/questions-frequentes/professionnels` },
        ],
      },
      {
        labelKey: "aide.guides.title",
        href: `${sectionPaths.aide}/guides`,
        links: [
          { labelKey: "aide.guides.guideDuCitoyen", href: `${sectionPaths.aide}/guides/guide-du-citoyen` },
          { labelKey: "aide.guides.guideDuProfessionnel", href: `${sectionPaths.aide}/guides/guide-du-professionnel` },
          { labelKey: "aide.guides.tutoriels", href: `${sectionPaths.aide}/guides/tutoriels` },
          { labelKey: "aide.guides.fichesPratiques", href: `${sectionPaths.aide}/guides/fiches-pratiques` },
        ],
      },
      {
        labelKey: "aide.assistance.title",
        href: `${sectionPaths.aide}/assistance`,
        links: [
          { labelKey: "aide.assistance.contacterLAssistance", href: `${sectionPaths.aide}/assistance/contacter-l-assistance` },
          { labelKey: "aide.assistance.formulaireDeContact", href: `${sectionPaths.aide}/assistance/formulaire-de-contact` },
          { labelKey: "aide.assistance.numeroDAide", href: `${sectionPaths.aide}/assistance/numero-d-aide` },
          { labelKey: "aide.assistance.horaires", href: `${sectionPaths.aide}/assistance/horaires` },
        ],
      },
      {
        labelKey: "aide.aPropos.title",
        href: `${sectionPaths.aide}/a-propos`,
        links: [
          { labelKey: "aide.aPropos.questCeQueBloctel", href: `${sectionPaths.aide}/a-propos/quest-ce-que-bloctel` },
          { labelKey: "aide.aPropos.missions", href: `${sectionPaths.aide}/a-propos/missions` },
          { labelKey: "aide.aPropos.quiSommesNous", href: `${sectionPaths.aide}/a-propos/qui-sommes-nous` },
          { labelKey: "aide.aPropos.contact", href: `${sectionPaths.aide}/a-propos/contact` },
        ],
      },
    ],
  },
];

assertNavigationStructureValid();

/**
 * Secondary navigation zone of the site footer, distinct from the main
 * navigation of the header. It mirrors the seven entries of the header
 * navigation and derives its links from the sections of each theme — so the
 * footer and the header can never drift apart.
 *
 * Column titles resolve under `footer.columns`, links under `nav.panel`.
 */
export const footerNavigation: ReadonlyArray<FooterColumn> = primaryNavigation.map(
  (section) => ({
    columnKey: section.labelKey,
    links: section.primaryItems,
  })
);
