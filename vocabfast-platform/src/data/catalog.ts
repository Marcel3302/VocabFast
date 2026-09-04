export type Language = {
  code: string;
  name: string;
  nativeName: string;
  symbol: string;
  available: boolean;
  levels: string[];
};

export type Specialty = {
  id: string;
  name: string;
  description: string;
  icon: string;
  pro: boolean;
};

export type LearningUnit = {
  id: number;
  title: string;
  subtitle: string;
  progress: number;
  state: 'done' | 'active' | 'locked';
  lessons: number;
};

export const languages: Language[] = [
  { code: 'en', name: 'Englisch', nativeName: 'English', symbol: 'EN', available: true, levels: ['A1','A2','B1','B2','C1','C2'] },
  { code: 'es', name: 'Spanisch', nativeName: 'Español', symbol: 'ES', available: false, levels: ['A1','A2','B1','B2','C1','C2'] },
  { code: 'fr', name: 'Französisch', nativeName: 'Français', symbol: 'FR', available: false, levels: ['A1','A2','B1','B2','C1','C2'] },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', symbol: 'DE', available: false, levels: ['A1','A2','B1','B2','C1','C2'] },
  { code: 'it', name: 'Italienisch', nativeName: 'Italiano', symbol: 'IT', available: false, levels: ['A1','A2','B1','B2','C1','C2'] },
  { code: 'pt', name: 'Portugiesisch', nativeName: 'Português', symbol: 'PT', available: false, levels: ['A1','A2','B1','B2','C1','C2'] },
  { code: 'zh', name: 'Chinesisch', nativeName: '中文', symbol: '中', available: false, levels: ['A1','A2','B1','B2','C1'] },
  { code: 'ja', name: 'Japanisch', nativeName: '日本語', symbol: '日', available: false, levels: ['A1','A2','B1','B2','C1'] },
  { code: 'ko', name: 'Koreanisch', nativeName: '한국어', symbol: '한', available: false, levels: ['A1','A2','B1','B2','C1'] },
  { code: 'ar', name: 'Arabisch', nativeName: 'العربية', symbol: 'ع', available: false, levels: ['A1','A2','B1','B2','C1'] }
];

export const specialties: Specialty[] = [
  { id: 'aviation', name: 'Aviation English', description: 'Kommunikation, Phraseology, Technik und Prüfungssituationen.', icon: '✈', pro: true },
  { id: 'business', name: 'Business', description: 'Meetings, Präsentationen, E-Mails und Verhandlungen.', icon: '↗', pro: true },
  { id: 'medical', name: 'Medizin', description: 'Patientengespräche, Fachbegriffe und klinische Kommunikation.', icon: '+', pro: true },
  { id: 'technology', name: 'Technik & IT', description: 'Software, Engineering, Dokumentation und Teams.', icon: '</>', pro: true },
  { id: 'tourism', name: 'Tourismus', description: 'Hotel, Gastronomie, Reisen und Gästekommunikation.', icon: '⌂', pro: true }
];

export const learningUnits: LearningUnit[] = [
  { id: 1, title: 'Erste Gespräche', subtitle: 'Begrüßen, vorstellen, höflich reagieren & im Café bestellen', progress: 0, state: 'active', lessons: 3 },
  { id: 2, title: 'Menschen & Dinge', subtitle: 'Personen beschreiben, Artikel, Zahlen und Besitz ausdrücken', progress: 0, state: 'locked', lessons: 10 },
  { id: 3, title: 'Mein Alltag', subtitle: 'Tagesablauf, Uhrzeit, Gewohnheiten und einfache Fragen', progress: 0, state: 'locked', lessons: 10 },
  { id: 4, title: 'Unterwegs', subtitle: 'Orientierung, Verkehr, Reisen und einfache Reisesituationen', progress: 0, state: 'locked', lessons: 12 }
];
