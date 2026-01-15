
// Simple i18n engine
// In a production app, this would load JSON files dynamically

type Locale = 'en' | 'es' | 'fr';

const translations = {
  en: {
    'splash.tagline': 'Your Nightlife Vibe Forecast',
    'nav.dashboard': 'Explore', // Renamed from Dashboard
    'nav.map': 'Map',
    'nav.ai': 'CityGauge',
    'nav.profile': 'Profile',
    'profile.premium.title': 'Premium',
    'profile.premium.btn': 'Upgrade plan',
    'profile.premium.perk1': 'Get live promotions & discounts',
    'profile.premium.perk2': 'Custom itineraries',
    'profile.settings.theme': 'App Theme',
    'profile.safety.title': 'Safety',
    'profile.safety.desc': 'Keep each other in the know when you step out',
    'profile.safety.btn': 'Add trusted friends',
    'venue.forecast': '7-Day Forecast',
    'venue.reviews': 'What people say',
    'dashboard.vibe': 'City Vibe',
    'dashboard.partners': 'Services & Partners',
    
    // Preferences Flow
    'prefs.title': 'Build Your Persona',
    'prefs.subtitle': 'Help CityGauge make you a local in 5 minutes.',
    'prefs.travel_mode': 'Travel Mode',
    'prefs.travel_desc': 'Adjusts recommendations for visitors.',
    
    'prefs.step1.title': 'The Mission',
    'prefs.step1.desc': 'What is the goal for tonight?',
    'prefs.step1.tip': 'Tip: Select multiple if you are open to spontaneity.',
    
    'prefs.step2.title': 'The Sound',
    'prefs.step2.desc': 'What moves you?',
    'prefs.step2.tip': 'Tip: Venues are filtered heavily by music genre.',
    
    'prefs.step3.title': 'The Crowd',
    'prefs.step3.desc': 'Who are you with & what energy do you want?',
    'prefs.step3.tip': 'Tip: We use real-time density data to match this.',
    
    'prefs.step4.title': 'The Timing',
    'prefs.step4.desc': 'When does your night peak?',
    'prefs.step4.tip': 'Tip: Forecasts change based on arrival time.',
    
    'prefs.step5.title': 'The Budget',
    'prefs.step5.desc': 'Set your spend comfort zone.',
    'prefs.step5.tip': 'Tip: You can update this per night in your Profile.',
    'prefs.budget.vibe': 'Vibe Mode',
    'prefs.budget.exact': 'Exact Amount',
    
    'prefs.back': 'Back',
    'prefs.skip': 'Skip for now',
    'prefs.finish': 'Personalize App'
  },
  es: {
    'splash.tagline': 'Tu Pronóstico de Vida Nocturna',
    'nav.dashboard': 'Explorar', // Renamed
    'nav.map': 'Mapa',
    'nav.ai': 'CityGauge',
    'nav.profile': 'Perfil',
    'profile.premium.title': 'Premium',
    'profile.premium.btn': 'Mejorar plan',
    'profile.premium.perk1': 'Promociones en vivo y descuentos',
    'profile.premium.perk2': 'Itinerarios personalizados',
    'profile.settings.theme': 'Tema de la App',
    'profile.safety.title': 'Seguridad',
    'profile.safety.desc': 'Manténganse informados al salir',
    'profile.safety.btn': 'Añadir amigos de confianza',
    'venue.forecast': 'Pronóstico 7 Días',
    'venue.reviews': 'Opiniones',
    'dashboard.vibe': 'Vibra de la Ciudad',
    'dashboard.partners': 'Servicios y Socios',
    
    'prefs.title': 'Crea tu Persona',
    'prefs.subtitle': 'Ayuda a CityGauge a convertirte en local.',
    'prefs.travel_mode': 'Modo Viaje',
    'prefs.travel_desc': 'Ajusta recomendaciones para visitantes.',
    
    'prefs.step1.title': 'La Misión',
    'prefs.step1.desc': '¿Cuál es el objetivo de esta noche?',
    'prefs.step1.tip': 'Consejo: Selecciona varios si estás abierto.',
    
    'prefs.step2.title': 'El Sonido',
    'prefs.step2.desc': '¿Qué música te mueve?',
    'prefs.step2.tip': 'Consejo: Los lugares se filtran por género.',
    
    'prefs.step3.title': 'La Multitud',
    'prefs.step3.desc': '¿Con quién vas y qué energía buscas?',
    'prefs.step3.tip': 'Consejo: Usamos datos de densidad en tiempo real.',
    
    'prefs.step4.title': 'El Horario',
    'prefs.step4.desc': '¿Cuándo es el pico de tu noche?',
    'prefs.step4.tip': 'Consejo: Los pronósticos cambian según la hora.',
    
    'prefs.step5.title': 'El Presupuesto',
    'prefs.step5.desc': 'Define tu zona de confort.',
    'prefs.step5.tip': 'Consejo: Puedes cambiar esto en tu Perfil.',
    'prefs.budget.vibe': 'Modo Vibra',
    'prefs.budget.exact': 'Monto Exacto',

    'prefs.back': 'Atrás',
    'prefs.skip': 'Saltar',
    'prefs.finish': 'Personalizar'
  },
  fr: {
    'splash.tagline': 'Votre Prévisions de Vie Nocturne',
    'nav.dashboard': 'Explorer', // Renamed
    'nav.map': 'Carte',
    'nav.ai': 'CityGauge',
    'nav.profile': 'Profil',
    'profile.premium.title': 'Premium',
    'profile.premium.btn': 'Mettre à niveau',
    'profile.premium.perk1': 'Promotions en direct',
    'profile.premium.perk2': 'Itinéraires personnalisés',
    'profile.settings.theme': 'Thème',
    'profile.safety.title': 'Sécurité',
    'profile.safety.desc': 'Restez connectés lors de vos sorties',
    'profile.safety.btn': 'Ajouter des amis de confiance',
    'venue.forecast': 'Prévisions 7 jours',
    'venue.reviews': 'Avis',
    'dashboard.vibe': 'Ambiance Ville',
    'dashboard.partners': 'Services et Partenaires',
    
    'prefs.title': 'Votre Personna',
    'prefs.subtitle': 'Devenez un local en 5 minutes.',
    'prefs.travel_mode': 'Mode Voyage',
    'prefs.travel_desc': 'Ajuste pour les visiteurs.',
    
    'prefs.step1.title': 'La Mission',
    'prefs.step1.desc': 'Quel est le but ce soir ?',
    'prefs.step1.tip': 'Conseil : Sélectionnez plusieurs options.',
    
    'prefs.step2.title': 'Le Son',
    'prefs.step2.desc': 'Quel style musical ?',
    'prefs.step2.tip': 'Conseil : Filtrage puissant par genre.',
    
    'prefs.step3.title': 'La Foule',
    'prefs.step3.desc': 'Avec qui et quelle énergie ?',
    'prefs.step3.tip': 'Conseil : Basé sur la densité réelle.',
    
    'prefs.step4.title': 'Le Timing',
    'prefs.step4.desc': 'Quand sortez-vous ?',
    'prefs.step4.tip': 'Conseil : Les prévisions varient selon l\'heure.',
    
    'prefs.step5.title': 'Le Budget',
    'prefs.step5.desc': 'Votre zone de confort.',
    'prefs.step5.tip': 'Conseil : Modifiable dans le profil.',
    'prefs.budget.vibe': 'Mode Vibe',
    'prefs.budget.exact': 'Montant Exact',

    'prefs.back': 'Retour',
    'prefs.skip': 'Passer',
    'prefs.finish': 'Terminer'
  }
};

export let currentLocale: Locale = 'en';

export const setLocale = (locale: Locale) => {
  currentLocale = locale;
};

export const t = (key: string): string => {
  const dict = translations[currentLocale] as any;
  return dict[key] || key;
};
