// ── Kai's Coffee — i18n translations ─────────────────────────────────────────
//
// HOW TO ADD A LANGUAGE:
//   1. Add the new code to LangCode (e.g. "fr")
//   2. Add an entry to LANGUAGES with its display name
//   3. Copy the "en" block, paste it under the new code, and translate all values
//   4. TypeScript will error on any missing keys
//
// HOW TO ADD A NEW STRING:
//   1. Add it under the "en" block at the appropriate section
//   2. Add matching keys to every other language block
//   3. Use it in components via: const { strings } = useLang(); strings.section.key

export type LangCode = "en" | "es";

/** Display names shown in the language picker */
export const LANGUAGES: Record<LangCode, string> = {
  en: "English",
  es: "Español",
};

const translations = {
  en: {
    nav: {
      aboutUs:          "About Us",
      menu:             "Menu",
      signIn:           "Sign In",
      signOut:          "Sign out",
      myRewards:        "My Rewards",
      purchaseHistory:  "Purchase History",
      accountSettings:  "Account Settings",
      adminDashboard:   "Admin Dashboard",
      hiName:           "Hi",
    },
    settings: {
      label:            "Settings",
      language:         "Language",
    },
    home: {
      heroHeading:      "Every cup, a small pleasure.",
      heroSubtext:      "Single-origin espresso, slow-steeped cold brews, and house-baked pastries — crafted with care, for you.",
      badge:            "Artisan Coffee · Est. 2024",
      exploreMenu:      "Explore the Menu",
      joinRewards:      "Join Rewards",
      stampBadge:       "Digital Stamp Card",
      stampTitle:       "8 stamps =\na free coffee",
      stampSubtext:     "Earn a stamp with every $6+ purchase. Your 8th is always on us.",
      stampExample:     "Example — 5 of 8 stamps collected",
      startCollecting:  "Start Collecting Stamps",
      viewMyStamps:     "View My Stamps",
      espressoBar:      "Espresso Bar",
      espressoBody:     "Single-origin beans pulled at 9 bar. Notes of dark chocolate and hazelnut.",
      coldBrew:         "Cold Brew",
      coldBrewBody:     "18-hour cold steep. Nitrogen on tap. Smooth, never bitter.",
      pastries:         "House Pastries",
      pastriesBody:     "Almond croissants, banana bread, seasonal scones. Baked fresh daily.",
      footer:           "Made with care",
    },
    menu: {
      coffeeNotes:      "♡  12oz · 2 shots of espresso · whole milk",
      coffeeExtras:     "Oat milk +$1 · 16oz upgrade +$1",
      nothingYet:       "Nothing here yet — check back soon!",
      stampBadge:       "Digital Stamp Card",
      stampTitle:       "8 stamps = a free coffee ☕",
      stampSubtext:     "Earn a digital stamp with every $6+ purchase",
      createAccount:    "Create Account",
    },
    about: {
      badge:            "Est. 2024",
      ourStory:         "Our Story",
      ourCoffee:        "Our Coffee",
      meetTheTeam:      "Meet the Team",
      visitUs:          "Visit Us",
      location:         "Location",
      hours:            "Hours",
      monFri:           "Mon – Fri",
      saturday:         "Saturday",
      sunday:           "Sunday",
      mapComingSoon:    "Map coming soon — add a Google Maps embed URL in the admin panel.",
      joinRewards:      "Join Rewards",
      viewMenu:         "View the Menu",
      stampBadge:       "Digital Stamp Card",
      stampTitle:       "Your 8th stamp is a free coffee.",
      stampBody:        "Earn a digital stamp with every purchase of $6 or more. Collect 8 stamps and your next coffee is on us.",
      footer:           "Made with care",
    },
    auth: {
      tryAgain:         "Try Again",
      youAreOffline:    "You're offline",
      offlineMessage:   "Please check your internet connection and try again. Your reward points are safe.",
    },
    reward: {
      congratulations:  "Congratulations!",
      earnedFree:       "You've earned a free coffee! Redeem it on your next visit.",
      awesome:          "Awesome!",
    },
    langPicker: {
      chooseLanguage:   "Choose your language",
      chooseSubtext:    "Elige tu idioma",
    },
    gearGuide: {
      title:            "Change language anytime",
      body:             "Tap the gear icon to switch languages later.",
    },
  },

  es: {
    nav: {
      aboutUs:          "Sobre Nosotros",
      menu:             "Menú",
      signIn:           "Iniciar Sesión",
      signOut:          "Cerrar sesión",
      myRewards:        "Mis Recompensas",
      purchaseHistory:  "Historial de Compras",
      accountSettings:  "Mi Cuenta",
      adminDashboard:   "Panel de Admin",
      hiName:           "Hola",
    },
    settings: {
      label:            "Configuración",
      language:         "Idioma",
    },
    home: {
      heroHeading:      "Cada taza, un pequeño placer.",
      heroSubtext:      "Espresso de origen único, cold brew de infusión lenta y repostería artesanal — preparados con cuidado, para ti.",
      badge:            "Café Artesanal · Est. 2024",
      exploreMenu:      "Explorar el Menú",
      joinRewards:      "Unirse a Recompensas",
      stampBadge:       "Tarjeta Digital de Sellos",
      stampTitle:       "8 sellos =\nun café gratis",
      stampSubtext:     "Gana un sello con cada compra de $6 o más. El octavo es siempre nuestro regalo.",
      stampExample:     "Ejemplo — 5 de 8 sellos acumulados",
      startCollecting:  "Comenzar a Coleccionar",
      viewMyStamps:     "Ver Mis Sellos",
      espressoBar:      "Barra de Espresso",
      espressoBody:     "Granos de origen único a 9 bar. Notas de chocolate oscuro y avellana.",
      coldBrew:         "Cold Brew",
      coldBrewBody:     "Infusión en frío de 18 horas. Nitrógeno en grifo. Suave, nunca amargo.",
      pastries:         "Repostería de Casa",
      pastriesBody:     "Croissants de almendra, pan de plátano y scones de temporada. Horneados frescos diariamente.",
      footer:           "Hecho con cuidado",
    },
    menu: {
      coffeeNotes:      "♡  12oz · 2 shots de espresso · leche entera",
      coffeeExtras:     "Leche de avena +$1 · Upgrade a 16oz +$1",
      nothingYet:       "Aún no hay nada aquí — ¡vuelve pronto!",
      stampBadge:       "Tarjeta Digital de Sellos",
      stampTitle:       "8 sellos = un café gratis ☕",
      stampSubtext:     "Gana un sello digital con cada compra de $6 o más",
      createAccount:    "Crear Cuenta",
    },
    about: {
      badge:            "Est. 2024",
      ourStory:         "Nuestra Historia",
      ourCoffee:        "Nuestro Café",
      meetTheTeam:      "Conoce al Equipo",
      visitUs:          "Visítanos",
      location:         "Ubicación",
      hours:            "Horario",
      monFri:           "Lun – Vie",
      saturday:         "Sábado",
      sunday:           "Domingo",
      mapComingSoon:    "Mapa próximamente — agrega una URL de Google Maps embed en el panel de administración.",
      joinRewards:      "Unirse a Recompensas",
      viewMenu:         "Ver el Menú",
      stampBadge:       "Tarjeta Digital de Sellos",
      stampTitle:       "Tu 8.º sello es un café gratis.",
      stampBody:        "Gana un sello digital con cada compra de $6 o más. Acumula 8 sellos y tu próximo café corre por nuestra cuenta.",
      footer:           "Hecho con cuidado",
    },
    auth: {
      tryAgain:         "Intentar de Nuevo",
      youAreOffline:    "Estás sin conexión",
      offlineMessage:   "Comprueba tu conexión a Internet e inténtalo de nuevo. Tus puntos de recompensa están seguros.",
    },
    reward: {
      congratulations:  "¡Felicidades!",
      earnedFree:       "¡Has ganado un café gratis! Canjéalo en tu próxima visita.",
      awesome:          "¡Genial!",
    },
    langPicker: {
      chooseLanguage:   "Elige tu idioma",
      chooseSubtext:    "Choose your language",
    },
    gearGuide: {
      title:            "Cambia el idioma en cualquier momento",
      body:             "Toca el icono de engranaje para cambiar el idioma más tarde.",
    },
  },
} as const;

export default translations;
export type Translations = typeof translations.en;
