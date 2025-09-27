// Global Football Clubs Database - Complete list of clubs from major leagues worldwide
// Used across the application for player club selection, scout locations, etc.
// Coverage: Europe (Tier 1 & 2), Africa (Tier 1), Middle East (Tier 1)

export interface Club {
  id: string
  name: string
  city: string
  founded?: number
  stadium?: string
  notable?: boolean // For major clubs with global recognition
}

export interface League {
  id: string
  name: string
  country: string
  continent: 'Europe' | 'Africa' | 'Asia'
  tier: 1 | 2
  clubs: Club[]
}

export const FOOTBALL_LEAGUES: League[] = [
  // ===================
  // EUROPE - TIER 1
  // ===================

  {
    id: 'premier-league',
    name: 'Premier League',
    country: 'England',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'arsenal', name: 'Arsenal', city: 'London', founded: 1886, stadium: 'Emirates Stadium', notable: true },
      { id: 'aston-villa', name: 'Aston Villa', city: 'Birmingham', founded: 1874, stadium: 'Villa Park', notable: true },
      { id: 'bournemouth', name: 'AFC Bournemouth', city: 'Bournemouth', founded: 1899, stadium: 'Vitality Stadium' },
      { id: 'brentford', name: 'Brentford', city: 'London', founded: 1889, stadium: 'Brentford Community Stadium' },
      { id: 'brighton', name: 'Brighton & Hove Albion', city: 'Brighton', founded: 1901, stadium: 'Falmer Stadium' },
      { id: 'chelsea', name: 'Chelsea', city: 'London', founded: 1905, stadium: 'Stamford Bridge', notable: true },
      { id: 'crystal-palace', name: 'Crystal Palace', city: 'London', founded: 1905, stadium: 'Selhurst Park' },
      { id: 'everton', name: 'Everton', city: 'Liverpool', founded: 1878, stadium: 'Goodison Park', notable: true },
      { id: 'fulham', name: 'Fulham', city: 'London', founded: 1879, stadium: 'Craven Cottage' },
      { id: 'liverpool', name: 'Liverpool', city: 'Liverpool', founded: 1892, stadium: 'Anfield', notable: true },
      { id: 'man-city', name: 'Manchester City', city: 'Manchester', founded: 1880, stadium: 'Etihad Stadium', notable: true },
      { id: 'man-united', name: 'Manchester United', city: 'Manchester', founded: 1878, stadium: 'Old Trafford', notable: true },
      { id: 'newcastle', name: 'Newcastle United', city: 'Newcastle', founded: 1892, stadium: 'St. James\' Park', notable: true },
      { id: 'nottingham-forest', name: 'Nottingham Forest', city: 'Nottingham', founded: 1865, stadium: 'City Ground' },
      { id: 'sheffield-united', name: 'Sheffield United', city: 'Sheffield', founded: 1889, stadium: 'Bramall Lane' },
      { id: 'tottenham', name: 'Tottenham Hotspur', city: 'London', founded: 1882, stadium: 'Tottenham Hotspur Stadium', notable: true },
      { id: 'west-ham', name: 'West Ham United', city: 'London', founded: 1895, stadium: 'London Stadium', notable: true },
      { id: 'wolves', name: 'Wolverhampton Wanderers', city: 'Wolverhampton', founded: 1877, stadium: 'Molineux Stadium' }
    ]
  },

  {
    id: 'la-liga',
    name: 'La Liga',
    country: 'Spain',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'real-madrid', name: 'Real Madrid', city: 'Madrid', founded: 1902, stadium: 'Santiago Bernabéu', notable: true },
      { id: 'barcelona', name: 'FC Barcelona', city: 'Barcelona', founded: 1899, stadium: 'Camp Nou', notable: true },
      { id: 'atletico-madrid', name: 'Atlético Madrid', city: 'Madrid', founded: 1903, stadium: 'Cívitas Metropolitano', notable: true },
      { id: 'sevilla', name: 'Sevilla', city: 'Seville', founded: 1890, stadium: 'Ramón Sánchez-Pizjuán', notable: true },
      { id: 'real-betis', name: 'Real Betis', city: 'Seville', founded: 1907, stadium: 'Benito Villamarín' },
      { id: 'real-sociedad', name: 'Real Sociedad', city: 'San Sebastián', founded: 1909, stadium: 'Reale Arena' },
      { id: 'villarreal', name: 'Villarreal', city: 'Villarreal', founded: 1923, stadium: 'Estadio de la Cerámica', notable: true },
      { id: 'valencia', name: 'Valencia', city: 'Valencia', founded: 1919, stadium: 'Mestalla', notable: true },
      { id: 'athletic-bilbao', name: 'Athletic Bilbao', city: 'Bilbao', founded: 1898, stadium: 'San Mamés', notable: true },
      { id: 'getafe', name: 'Getafe', city: 'Getafe', founded: 1983, stadium: 'Coliseum Alfonso Pérez' },
      { id: 'osasuna', name: 'CA Osasuna', city: 'Pamplona', founded: 1920, stadium: 'El Sadar' },
      { id: 'rayo-vallecano', name: 'Rayo Vallecano', city: 'Madrid', founded: 1924, stadium: 'Campo de Fútbol de Vallecas' },
      { id: 'cadiz', name: 'Cádiz CF', city: 'Cádiz', founded: 1910, stadium: 'Nuevo Mirandilla' },
      { id: 'mallorca', name: 'RCD Mallorca', city: 'Palma', founded: 1916, stadium: 'Visit Mallorca Estadi' },
      { id: 'girona', name: 'Girona FC', city: 'Girona', founded: 1930, stadium: 'Estadi Montilivi' },
      { id: 'las-palmas', name: 'UD Las Palmas', city: 'Las Palmas', founded: 1949, stadium: 'Estadio Gran Canaria' },
      { id: 'alaves', name: 'Deportivo Alavés', city: 'Vitoria-Gasteiz', founded: 1921, stadium: 'Mendizorrotza' },
      { id: 'celta-vigo', name: 'Celta Vigo', city: 'Vigo', founded: 1923, stadium: 'Balaídos' },
      { id: 'granada', name: 'Granada CF', city: 'Granada', founded: 1931, stadium: 'Nuevo Los Cármenes' },
      { id: 'almeria', name: 'UD Almería', city: 'Almería', founded: 1989, stadium: 'Power Horse Stadium' }
    ]
  },

  {
    id: 'bundesliga',
    name: 'Bundesliga',
    country: 'Germany',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'bayern-munich', name: 'Bayern Munich', city: 'Munich', founded: 1900, stadium: 'Allianz Arena', notable: true },
      { id: 'dortmund', name: 'Borussia Dortmund', city: 'Dortmund', founded: 1909, stadium: 'Signal Iduna Park', notable: true },
      { id: 'rb-leipzig', name: 'RB Leipzig', city: 'Leipzig', founded: 2009, stadium: 'Red Bull Arena' },
      { id: 'bayer-leverkusen', name: 'Bayer Leverkusen', city: 'Leverkusen', founded: 1904, stadium: 'BayArena', notable: true },
      { id: 'eintracht-frankfurt', name: 'Eintracht Frankfurt', city: 'Frankfurt', founded: 1899, stadium: 'Deutsche Bank Park' },
      { id: 'schalke', name: 'Schalke 04', city: 'Gelsenkirchen', founded: 1904, stadium: 'Veltins-Arena', notable: true },
      { id: 'vfl-wolfsburg', name: 'VfL Wolfsburg', city: 'Wolfsburg', founded: 1945, stadium: 'Volkswagen Arena' },
      { id: 'borussia-mgladbach', name: 'Borussia Mönchengladbach', city: 'Mönchengladbach', founded: 1900, stadium: 'Borussia-Park' },
      { id: 'werder-bremen', name: 'Werder Bremen', city: 'Bremen', founded: 1899, stadium: 'Weserstadion' },
      { id: 'hoffenheim', name: '1899 Hoffenheim', city: 'Sinsheim', founded: 1899, stadium: 'PreZero Arena' },
      { id: 'augsburg', name: 'FC Augsburg', city: 'Augsburg', founded: 1907, stadium: 'WWK Arena' },
      { id: 'stuttgart', name: 'VfB Stuttgart', city: 'Stuttgart', founded: 1893, stadium: 'MHPArena' },
      { id: 'freiburg', name: 'SC Freiburg', city: 'Freiburg', founded: 1904, stadium: 'Europa-Park Stadion' },
      { id: 'mainz', name: 'Mainz 05', city: 'Mainz', founded: 1905, stadium: 'MEWA Arena' },
      { id: 'union-berlin', name: 'Union Berlin', city: 'Berlin', founded: 1966, stadium: 'Stadion An der Alten Försterei' },
      { id: 'hertha-berlin', name: 'Hertha Berlin', city: 'Berlin', founded: 1892, stadium: 'Olympiastadion' },
      { id: 'koln', name: '1. FC Köln', city: 'Cologne', founded: 1948, stadium: 'RheinEnergieStadion' },
      { id: 'bochum', name: 'VfL Bochum', city: 'Bochum', founded: 1848, stadium: 'Vonovia Ruhrstadion' }
    ]
  },

  {
    id: 'serie-a',
    name: 'Serie A',
    country: 'Italy',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'juventus', name: 'Juventus', city: 'Turin', founded: 1897, stadium: 'Allianz Stadium', notable: true },
      { id: 'inter-milan', name: 'Inter Milan', city: 'Milan', founded: 1908, stadium: 'San Siro', notable: true },
      { id: 'ac-milan', name: 'AC Milan', city: 'Milan', founded: 1899, stadium: 'San Siro', notable: true },
      { id: 'napoli', name: 'Napoli', city: 'Naples', founded: 1926, stadium: 'Stadio Diego Armando Maradona', notable: true },
      { id: 'roma', name: 'AS Roma', city: 'Rome', founded: 1927, stadium: 'Stadio Olimpico', notable: true },
      { id: 'lazio', name: 'Lazio', city: 'Rome', founded: 1900, stadium: 'Stadio Olimpico', notable: true },
      { id: 'atalanta', name: 'Atalanta', city: 'Bergamo', founded: 1907, stadium: 'Gewiss Stadium' },
      { id: 'fiorentina', name: 'Fiorentina', city: 'Florence', founded: 1926, stadium: 'Stadio Artemio Franchi' },
      { id: 'torino', name: 'Torino', city: 'Turin', founded: 1906, stadium: 'Stadio Olimpico Grande Torino' },
      { id: 'sassuolo', name: 'Sassuolo', city: 'Sassuolo', founded: 1920, stadium: 'Mapei Stadium' },
      { id: 'udinese', name: 'Udinese', city: 'Udine', founded: 1896, stadium: 'Dacia Arena' },
      { id: 'bologna', name: 'Bologna', city: 'Bologna', founded: 1909, stadium: 'Stadio Renato Dall\'Ara' },
      { id: 'empoli', name: 'Empoli', city: 'Empoli', founded: 1920, stadium: 'Stadio Carlo Castellani' },
      { id: 'monza', name: 'Monza', city: 'Monza', founded: 1912, stadium: 'U-Power Stadium' },
      { id: 'lecce', name: 'Lecce', city: 'Lecce', founded: 1908, stadium: 'Stadio Via del Mare' },
      { id: 'verona', name: 'Hellas Verona', city: 'Verona', founded: 1903, stadium: 'Stadio Marcantonio Bentegodi' },
      { id: 'cagliari', name: 'Cagliari', city: 'Cagliari', founded: 1920, stadium: 'Unipol Domus' },
      { id: 'frosinone', name: 'Frosinone', city: 'Frosinone', founded: 1928, stadium: 'Stadio Benito Stirpe' },
      { id: 'genoa', name: 'Genoa', city: 'Genoa', founded: 1893, stadium: 'Stadio Luigi Ferraris' },
      { id: 'salernitana', name: 'Salernitana', city: 'Salerno', founded: 1919, stadium: 'Stadio Arechi' }
    ]
  },

  {
    id: 'ligue1',
    name: 'Ligue 1',
    country: 'France',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'psg', name: 'Paris Saint-Germain', city: 'Paris', founded: 1970, stadium: 'Parc des Princes', notable: true },
      { id: 'marseille', name: 'Olympique Marseille', city: 'Marseille', founded: 1899, stadium: 'Orange Vélodrome', notable: true },
      { id: 'lyon', name: 'Olympique Lyon', city: 'Lyon', founded: 1950, stadium: 'Groupama Stadium', notable: true },
      { id: 'monaco', name: 'AS Monaco', city: 'Monaco', founded: 1924, stadium: 'Stade Louis II', notable: true },
      { id: 'lille', name: 'Lille OSC', city: 'Lille', founded: 1944, stadium: 'Stade Pierre-Mauroy' },
      { id: 'rennes', name: 'Stade Rennais', city: 'Rennes', founded: 1901, stadium: 'Roazhon Park' },
      { id: 'nice', name: 'OGC Nice', city: 'Nice', founded: 1904, stadium: 'Allianz Riviera' },
      { id: 'lens', name: 'RC Lens', city: 'Lens', founded: 1906, stadium: 'Stade Bollaert-Delelis' },
      { id: 'strasbourg', name: 'RC Strasbourg', city: 'Strasbourg', founded: 1906, stadium: 'Stade de la Meinau' },
      { id: 'nantes', name: 'FC Nantes', city: 'Nantes', founded: 1943, stadium: 'Stade de la Beaujoire' },
      { id: 'montpellier', name: 'Montpellier HSC', city: 'Montpellier', founded: 1974, stadium: 'Stade de la Mosson' },
      { id: 'reims', name: 'Stade de Reims', city: 'Reims', founded: 1910, stadium: 'Stade Auguste-Delaune' },
      { id: 'toulouse', name: 'Toulouse FC', city: 'Toulouse', founded: 1970, stadium: 'Stadium de Toulouse' },
      { id: 'clermont', name: 'Clermont Foot', city: 'Clermont-Ferrand', founded: 1911, stadium: 'Stade Gabriel-Montpied' },
      { id: 'lorient', name: 'FC Lorient', city: 'Lorient', founded: 1926, stadium: 'Stade du Moustoir' },
      { id: 'brest', name: 'Stade Brestois', city: 'Brest', founded: 1950, stadium: 'Stade Francis-Le Blé' },
      { id: 'troyes', name: 'ES Troyes AC', city: 'Troyes', founded: 1986, stadium: 'Stade de l\'Aube' },
      { id: 'ajaccio', name: 'AC Ajaccio', city: 'Ajaccio', founded: 1910, stadium: 'Stade François Coty' }
    ]
  },

  {
    id: 'super-lig',
    name: 'Süper Lig',
    country: 'Turkey',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'galatasaray', name: 'Galatasaray', city: 'Istanbul', founded: 1905, stadium: 'Türk Telekom Stadium', notable: true },
      { id: 'fenerbahce', name: 'Fenerbahçe', city: 'Istanbul', founded: 1907, stadium: 'Şükrü Saracoğlu Stadium', notable: true },
      { id: 'besiktas', name: 'Beşiktaş', city: 'Istanbul', founded: 1903, stadium: 'Vodafone Park', notable: true },
      { id: 'trabzonspor', name: 'Trabzonspor', city: 'Trabzon', founded: 1967, stadium: 'Şenol Güneş Stadium', notable: true },
      { id: 'basaksehir', name: 'İstanbul Başakşehir', city: 'Istanbul', founded: 1990, stadium: 'Başakşehir Fatih Terim Stadium' },
      { id: 'sivasspor', name: 'Sivasspor', city: 'Sivas', founded: 1967, stadium: 'BG Group 4 Eylül Stadium' },
      { id: 'alanyaspor', name: 'Alanyaspor', city: 'Alanya', founded: 1948, stadium: 'Bahçeşehir Okulları Stadium' },
      { id: 'konyaspor', name: 'Konyaspor', city: 'Konya', founded: 1922, stadium: 'Konya Büyükşehir Stadium' },
      { id: 'antalyaspor', name: 'Antalyaspor', city: 'Antalya', founded: 1966, stadium: 'Antalya Stadium' },
      { id: 'kasimpasa', name: 'Kasımpaşa', city: 'Istanbul', founded: 1921, stadium: 'Recep Tayyip Erdoğan Stadium' },
      { id: 'kayserispor', name: 'Kayserispor', city: 'Kayseri', founded: 1966, stadium: 'Kadir Has Stadium' },
      { id: 'gaziantep-fk', name: 'Gaziantep FK', city: 'Gaziantep', founded: 1969, stadium: 'Gaziantep Stadium' },
      { id: 'adana-demirspor', name: 'Adana Demirspor', city: 'Adana', founded: 1940, stadium: 'Yeni Adana Stadium' },
      { id: 'rizespor', name: 'Çaykur Rizespor', city: 'Rize', founded: 1953, stadium: 'Çaykur Didi Stadium' },
      { id: 'fatih-karagumruk', name: 'Fatih Karagümrük', city: 'Istanbul', founded: 1926, stadium: 'Vefa Stadium' },
      { id: 'giresunspor', name: 'Giresunspor', city: 'Giresun', founded: 1967, stadium: 'Çotanak Stadium' },
      { id: 'hatayspor', name: 'Hatayspor', city: 'Antakya', founded: 1967, stadium: 'Hatay Stadium' },
      { id: 'umraniyespor', name: 'Ümraniyespor', city: 'Istanbul', founded: 1938, stadium: 'Ümraniye District Stadium' }
    ]
  },

  // ===================
  // EUROPE - TIER 2
  // ===================

  {
    id: 'championship',
    name: 'EFL Championship',
    country: 'England',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'leeds-united', name: 'Leeds United', city: 'Leeds', founded: 1919, stadium: 'Elland Road', notable: true },
      { id: 'leicester-city', name: 'Leicester City', city: 'Leicester', founded: 1884, stadium: 'King Power Stadium', notable: true },
      { id: 'southampton', name: 'Southampton', city: 'Southampton', founded: 1885, stadium: 'St Mary\'s Stadium', notable: true },
      { id: 'west-brom', name: 'West Bromwich Albion', city: 'West Bromwich', founded: 1878, stadium: 'The Hawthorns' },
      { id: 'norwich-city', name: 'Norwich City', city: 'Norwich', founded: 1902, stadium: 'Carrow Road' },
      { id: 'middlesbrough', name: 'Middlesbrough', city: 'Middlesbrough', founded: 1876, stadium: 'Riverside Stadium' },
      { id: 'coventry-city', name: 'Coventry City', city: 'Coventry', founded: 1883, stadium: 'Coventry Building Society Arena' },
      { id: 'millwall', name: 'Millwall', city: 'London', founded: 1885, stadium: 'The Den' },
      { id: 'blackburn-rovers', name: 'Blackburn Rovers', city: 'Blackburn', founded: 1875, stadium: 'Ewood Park' },
      { id: 'preston-ne', name: 'Preston North End', city: 'Preston', founded: 1880, stadium: 'Deepdale' },
      { id: 'bristol-city', name: 'Bristol City', city: 'Bristol', founded: 1894, stadium: 'Ashton Gate' },
      { id: 'cardiff-city', name: 'Cardiff City', city: 'Cardiff', founded: 1899, stadium: 'Cardiff City Stadium' },
      { id: 'swansea-city', name: 'Swansea City', city: 'Swansea', founded: 1912, stadium: 'Swansea.com Stadium' },
      { id: 'hull-city', name: 'Hull City', city: 'Hull', founded: 1904, stadium: 'MKM Stadium' },
      { id: 'stoke-city', name: 'Stoke City', city: 'Stoke-on-Trent', founded: 1863, stadium: 'bet365 Stadium' },
      { id: 'sunderland', name: 'Sunderland', city: 'Sunderland', founded: 1879, stadium: 'Stadium of Light' },
      { id: 'plymouth-argyle', name: 'Plymouth Argyle', city: 'Plymouth', founded: 1886, stadium: 'Home Park' },
      { id: 'qpr', name: 'Queens Park Rangers', city: 'London', founded: 1882, stadium: 'Loftus Road' },
      { id: 'sheffield-wednesday', name: 'Sheffield Wednesday', city: 'Sheffield', founded: 1867, stadium: 'Hillsborough' },
      { id: 'watford', name: 'Watford', city: 'Watford', founded: 1881, stadium: 'Vicarage Road' },
      { id: 'rotherham-united', name: 'Rotherham United', city: 'Rotherham', founded: 1925, stadium: 'New York Stadium' },
      { id: 'huddersfield-town', name: 'Huddersfield Town', city: 'Huddersfield', founded: 1908, stadium: 'John Smith\'s Stadium' },
      { id: 'birmingham-city', name: 'Birmingham City', city: 'Birmingham', founded: 1875, stadium: 'St. Andrew\'s' },
      { id: 'ipswich-town', name: 'Ipswich Town', city: 'Ipswich', founded: 1878, stadium: 'Portman Road' }
    ]
  },

  {
    id: 'segunda-division',
    name: 'Segunda División',
    country: 'Spain',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'deportivo', name: 'Deportivo La Coruña', city: 'A Coruña', founded: 1906, stadium: 'Riazor', notable: true },
      { id: 'real-zaragoza', name: 'Real Zaragoza', city: 'Zaragoza', founded: 1932, stadium: 'La Romareda' },
      { id: 'espanyol', name: 'RCD Espanyol', city: 'Barcelona', founded: 1900, stadium: 'RCDE Stadium', notable: true },
      { id: 'elche', name: 'Elche CF', city: 'Elche', founded: 1923, stadium: 'Estadio Manuel Martínez Valero' },
      { id: 'real-oviedo', name: 'Real Oviedo', city: 'Oviedo', founded: 1926, stadium: 'Carlos Tartiere' },
      { id: 'sporting-gijon', name: 'Sporting Gijón', city: 'Gijón', founded: 1905, stadium: 'El Molinón' },
      { id: 'racing-santander', name: 'Racing Santander', city: 'Santander', founded: 1913, stadium: 'El Sardinero' },
      { id: 'levante', name: 'Levante UD', city: 'Valencia', founded: 1909, stadium: 'Ciutat de València' },
      { id: 'real-valladolid', name: 'Real Valladolid', city: 'Valladolid', founded: 1928, stadium: 'José Zorrilla' },
      { id: 'burgos', name: 'Burgos CF', city: 'Burgos', founded: 1994, stadium: 'El Plantío' },
      { id: 'mirandes', name: 'CD Mirandés', city: 'Miranda de Ebro', founded: 1927, stadium: 'Anduva' },
      { id: 'tenerife', name: 'CD Tenerife', city: 'Santa Cruz de Tenerife', founded: 1922, stadium: 'Heliodoro Rodríguez López' },
      { id: 'leganes', name: 'CD Leganés', city: 'Leganés', founded: 1928, stadium: 'Butarque' },
      { id: 'eibar', name: 'SD Eibar', city: 'Eibar', founded: 1940, stadium: 'Ipurua' },
      { id: 'huesca', name: 'SD Huesca', city: 'Huesca', founded: 1910, stadium: 'El Alcoraz' },
      { id: 'andorra', name: 'FC Andorra', city: 'Andorra la Vella', founded: 1942, stadium: 'Estadi Nacional' },
      { id: 'villarreal-b', name: 'Villarreal CF B', city: 'Villarreal', founded: 1999, stadium: 'Ciudad Deportiva' },
      { id: 'albacete', name: 'Albacete Balompié', city: 'Albacete', founded: 1940, stadium: 'Carlos Belmonte' },
      { id: 'cartagena', name: 'FC Cartagena', city: 'Cartagena', founded: 1995, stadium: 'Cartagonova' },
      { id: 'amorebieta', name: 'Club Amorebieta', city: 'Amorebieta', founded: 1925, stadium: 'Urritxe' },
      { id: 'alcorcon', name: 'AD Alcorcón', city: 'Alcorcón', founded: 1971, stadium: 'Santo Domingo' },
      { id: 'ferrol', name: 'Racing Club de Ferrol', city: 'Ferrol', founded: 1919, stadium: 'A Malata' }
    ]
  },

  {
    id: 'bundesliga-2',
    name: '2. Bundesliga',
    country: 'Germany',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'hamburg', name: 'Hamburger SV', city: 'Hamburg', founded: 1887, stadium: 'Volksparkstadion', notable: true },
      { id: 'hannover', name: 'Hannover 96', city: 'Hannover', founded: 1896, stadium: 'HDI-Arena', notable: true },
      { id: 'nurnberg', name: '1. FC Nürnberg', city: 'Nuremberg', founded: 1900, stadium: 'Max-Morlock-Stadion' },
      { id: 'st-pauli', name: 'FC St. Pauli', city: 'Hamburg', founded: 1910, stadium: 'Millerntor-Stadion' },
      { id: 'fortuna-dusseldorf', name: 'Fortuna Düsseldorf', city: 'Düsseldorf', founded: 1895, stadium: 'Merkur Spiel-Arena' },
      { id: 'kaiserslautern', name: '1. FC Kaiserslautern', city: 'Kaiserslautern', founded: 1900, stadium: 'Fritz-Walter-Stadion', notable: true },
      { id: 'karlsruher', name: 'Karlsruher SC', city: 'Karlsruhe', founded: 1894, stadium: 'Wildparkstadion' },
      { id: 'hansa-rostock', name: 'Hansa Rostock', city: 'Rostock', founded: 1965, stadium: 'Ostseestadion' },
      { id: 'magdeburg', name: '1. FC Magdeburg', city: 'Magdeburg', founded: 1965, stadium: 'MDCC-Arena' },
      { id: 'darmstadt', name: 'SV Darmstadt 98', city: 'Darmstadt', founded: 1898, stadium: 'Merck-Stadion am Böllenfalltor' },
      { id: 'paderborn', name: 'SC Paderborn 07', city: 'Paderborn', founded: 1907, stadium: 'Home Deluxe Arena' },
      { id: 'greuther-furth', name: 'SpVgg Greuther Fürth', city: 'Fürth', founded: 1903, stadium: 'Sportpark Ronhof Thomas Sommer' },
      { id: 'osnabruck', name: 'VfL Osnabrück', city: 'Osnabrück', founded: 1899, stadium: 'Stadion an der Bremer Brücke' },
      { id: 'eintracht-braunschweig', name: 'Eintracht Braunschweig', city: 'Braunschweig', founded: 1895, stadium: 'Eintracht-Stadion' },
      { id: 'holstein-kiel', name: 'Holstein Kiel', city: 'Kiel', founded: 1900, stadium: 'Holstein-Stadion' },
      { id: 'elversberg', name: 'SV Elversberg', city: 'Elversberg', founded: 1907, stadium: 'URSAPHARM-Arena an der Kaiserlinde' },
      { id: 'schalke-ii', name: 'FC Schalke 04 II', city: 'Gelsenkirchen', founded: 1924, stadium: 'Parkstadion' },
      { id: 'wehen', name: 'SV Wehen Wiesbaden', city: 'Wiesbaden', founded: 1926, stadium: 'BRITA-Arena' }
    ]
  },

  {
    id: 'lig-1-turkey',
    name: '1. Lig',
    country: 'Turkey',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'bandirmaspor', name: 'Bandırmaspor', city: 'Bandırma', founded: 1965, stadium: '17 Eylül Stadium' },
      { id: 'bodrumspor', name: 'Bodrumspor', city: 'Bodrum', founded: 1931, stadium: 'Bodrum City Stadium' },
      { id: 'celik-zenica', name: 'Çelik Zenica', city: 'Zenica', founded: 1894, stadium: 'Bilino Polje Stadium' },
      { id: 'denizlispor', name: 'Denizlispor', city: 'Denizli', founded: 1966, stadium: 'Denizli Atatürk Stadium' },
      { id: 'erzurumspor', name: 'Erzurumspor', city: 'Erzurum', founded: 1967, stadium: 'Kazım Karabekir Stadium' },
      { id: 'genclerbirligi', name: 'Gençlerbirliği', city: 'Ankara', founded: 1923, stadium: 'Eryaman Stadium' },
      { id: 'goztepe', name: 'Göztepe', city: 'İzmir', founded: 1925, stadium: 'Gürsel Aksel Stadium' },
      { id: 'istanbulspor', name: 'İstanbulspor', city: 'Istanbul', founded: 1926, stadium: 'Necmi Kadıoğlu Stadium' },
      { id: 'kecioren', name: 'Keçiörengücü', city: 'Ankara', founded: 1945, stadium: 'Aktepe Stadium' },
      { id: 'manisa-fk', name: 'Manisa FK', city: 'Manisa', founded: 1931, stadium: 'Manisa 19 Mayıs Stadium' },
      { id: 'pendikspor', name: 'Pendikspor', city: 'Istanbul', founded: 1950, stadium: 'Pendik Stadium' },
      { id: 'sakaryaspor', name: 'Sakaryaspor', city: 'Sakarya', founded: 1965, stadium: 'Sakarya Atatürk Stadium' },
      { id: 'sanliurfaspor', name: 'Şanlıurfaspor', city: 'Şanlıurfa', founded: 1969, stadium: 'Şanlıurfa GAP Stadium' },
      { id: 'tuzlaspor', name: 'Tuzlaspor', city: 'Istanbul', founded: 1954, stadium: 'Tuzla Belediyesi Stadium' },
      { id: 'yeni-malatyaspor', name: 'Yeni Malatyaspor', city: 'Malatya', founded: 1986, stadium: 'Malatya İnönü Stadium' },
      { id: 'eyupspor', name: 'Eyüpspor', city: 'Istanbul', founded: 1919, stadium: 'Eyüp Stadium' },
      { id: 'kocaelispor', name: 'Kocaelispor', city: 'İzmit', founded: 1966, stadium: 'İsmet Paşa Stadium' },
      { id: 'altinordu', name: 'Altınordu FK', city: 'İzmir', founded: 1923, stadium: 'Bornova Stadium' }
    ]
  },

  // ===================
  // AFRICA - TIER 1
  // ===================

  {
    id: 'dstv-premiership',
    name: 'DStv Premiership',
    country: 'South Africa',
    continent: 'Africa',
    tier: 1,
    clubs: [
      { id: 'kaizer-chiefs', name: 'Kaizer Chiefs', city: 'Johannesburg', founded: 1970, stadium: 'FNB Stadium', notable: true },
      { id: 'orlando-pirates', name: 'Orlando Pirates', city: 'Johannesburg', founded: 1937, stadium: 'Orlando Stadium', notable: true },
      { id: 'mamelodi-sundowns', name: 'Mamelodi Sundowns', city: 'Pretoria', founded: 1970, stadium: 'Loftus Versfeld Stadium', notable: true },
      { id: 'supersport-united', name: 'SuperSport United', city: 'Atteridgeville', founded: 1994, stadium: 'Lucas Moripe Stadium' },
      { id: 'cape-town-city', name: 'Cape Town City', city: 'Cape Town', founded: 2016, stadium: 'DHL Stadium' },
      { id: 'amazulu', name: 'AmaZulu FC', city: 'Durban', founded: 1932, stadium: 'King Goodwill Zwelithini Stadium' },
      { id: 'golden-arrows', name: 'Golden Arrows', city: 'Durban', founded: 1943, stadium: 'Princess Magogo Stadium' },
      { id: 'stellenbosch', name: 'Stellenbosch FC', city: 'Stellenbosch', founded: 2016, stadium: 'Danie Craven Stadium' },
      { id: 'sekhukhune-united', name: 'Sekhukhune United', city: 'Makhudu', founded: 2016, stadium: 'New Peter Mokaba Stadium' },
      { id: 'royal-am', name: 'Royal AM', city: 'Pietermaritzburg', founded: 1998, stadium: 'Chatsworth Stadium' },
      { id: 'chippa-united', name: 'Chippa United', city: 'Port Elizabeth', founded: 2010, stadium: 'Nelson Mandela Bay Stadium' },
      { id: 'swallows', name: 'Swallows FC', city: 'Johannesburg', founded: 1947, stadium: 'Dobsonville Stadium' },
      { id: 'ts-galaxy', name: 'TS Galaxy', city: 'Kameelrivier', founded: 2015, stadium: 'Mbombela Stadium' },
      { id: 'maritzburg-united', name: 'Maritzburg United', city: 'Pietermaritzburg', founded: 1979, stadium: 'Harry Gwala Stadium' },
      { id: 'baroka', name: 'Baroka FC', city: 'Ga-Mphahlele', founded: 2007, stadium: 'Old Peter Mokaba Stadium' },
      { id: 'moroka-swallows', name: 'Moroka Swallows', city: 'Johannesburg', founded: 1947, stadium: 'Dobsonville Stadium' }
    ]
  },

  {
    id: 'egyptian-premier-league',
    name: 'Egyptian Premier League',
    country: 'Egypt',
    continent: 'Africa',
    tier: 1,
    clubs: [
      { id: 'al-ahly', name: 'Al Ahly', city: 'Cairo', founded: 1907, stadium: 'Cairo International Stadium', notable: true },
      { id: 'zamalek', name: 'Zamalek SC', city: 'Cairo', founded: 1911, stadium: 'Cairo International Stadium', notable: true },
      { id: 'pyramids', name: 'Pyramids FC', city: '6th of October City', founded: 2008, stadium: '30 June Stadium' },
      { id: 'ismaily', name: 'Ismaily SC', city: 'Ismailia', founded: 1921, stadium: 'Ismailia Stadium' },
      { id: 'al-masry', name: 'Al Masry', city: 'Port Said', founded: 1920, stadium: 'Port Said Stadium' },
      { id: 'future', name: 'Future FC', city: 'Cairo', founded: 2017, stadium: 'Al Salam Stadium' },
      { id: 'ghazl-el-mahalla', name: 'Ghazl El Mahalla', city: 'El Mahalla El Kubra', founded: 1936, stadium: 'Ghazl El Mahalla Stadium' },
      { id: 'el-gaish', name: 'El Gaish', city: 'Cairo', founded: 1945, stadium: 'Gehaz El Reyada Stadium' },
      { id: 'enppi', name: 'ENPPI', city: 'Cairo', founded: 1980, stadium: 'Petrosport Stadium' },
      { id: 'el-mokawloon', name: 'El Mokawloon', city: 'Cairo', founded: 1960, stadium: 'Osman Ahmed Osman Stadium' },
      { id: 'smouha', name: 'Smouha SC', city: 'Alexandria', founded: 2002, stadium: 'Alexandria Stadium' },
      { id: 'ceramica-cleopatra', name: 'Ceramica Cleopatra', city: '6th of October City', founded: 2006, stadium: '6th of October Stadium' },
      { id: 'al-ittihad', name: 'Al Ittihad Alexandria', city: 'Alexandria', founded: 1914, stadium: 'Alexandria Stadium' },
      { id: 'el-gouna', name: 'El Gouna FC', city: 'El Gouna', founded: 2003, stadium: 'El Gouna Stadium' },
      { id: 'national-bank-egypt', name: 'National Bank of Egypt SC', city: 'Cairo', founded: 1955, stadium: 'Arab Contractors Stadium' },
      { id: 'pharco', name: 'Pharco FC', city: 'New Administrative Capital', founded: 2009, stadium: 'New Administrative Capital Stadium' },
      { id: 'eastern-company', name: 'Eastern Company', city: 'Port Said', founded: 1980, stadium: 'Port Said Stadium' },
      { id: 'el-dakhleya', name: 'El Dakhleya', city: 'New Damietta', founded: 2017, stadium: 'New Damietta Stadium' }
    ]
  },

  {
    id: 'botola-pro',
    name: 'Botola Pro',
    country: 'Morocco',
    continent: 'Africa',
    tier: 1,
    clubs: [
      { id: 'raja-casablanca', name: 'Raja CA', city: 'Casablanca', founded: 1949, stadium: 'Mohammed V Stadium', notable: true },
      { id: 'wydad-casablanca', name: 'Wydad AC', city: 'Casablanca', founded: 1937, stadium: 'Mohammed V Stadium', notable: true },
      { id: 'far-rabat', name: 'AS FAR', city: 'Rabat', founded: 1958, stadium: 'Prince Moulay Abdellah Stadium' },
      { id: 'fus-rabat', name: 'FUS Rabat', city: 'Rabat', founded: 1946, stadium: 'Complexe Sportif Moulay Abdellah' },
      { id: 'renaissance-zemamra', name: 'Renaissance Zemamra', city: 'Azemmour', founded: 1966, stadium: 'Stade Marrakech' },
      { id: 'hassania-agadir', name: 'Hassania Agadir', city: 'Agadir', founded: 1946, stadium: 'Stade Al Inbiaath' },
      { id: 'maghreb-fes', name: 'Maghreb de Fès', city: 'Fès', founded: 1946, stadium: 'Complexe Sportif de Fès' },
      { id: 'olympique-safi', name: 'Olympique Safi', city: 'Safi', founded: 1921, stadium: 'Stade El Massira' },
      { id: 'moghreb-tetouan', name: 'Moghreb Tétouan', city: 'Tétouan', founded: 1922, stadium: 'Stade Saniat Rmel' },
      { id: 'ittihad-tanger', name: 'Ittihad Tanger', city: 'Tangier', founded: 1983, stadium: 'Stade Ibn Batouta' },
      { id: 'berkane', name: 'RS Berkane', city: 'Berkane', founded: 1938, stadium: 'Stade Municipal de Berkane' },
      { id: 'difaa-jadida', name: 'Difaâ El Jadida', city: 'El Jadida', founded: 1948, stadium: 'Stade El Abdi' },
      { id: 'khouribga', name: 'Olympic Khouribga', city: 'Khouribga', founded: 1921, stadium: 'Stade OCP' },
      { id: 'youssoufia-berrechid', name: 'Youssoufia Berrechid', city: 'Berrechid', founded: 1995, stadium: 'Stade Municipal de Berrechid' },
      { id: 'union-touarga', name: 'Union Touarga Sport', city: 'Rabat', founded: 1989, stadium: 'Stade Moulay Abdellah' },
      { id: 'chabab-mohammedia', name: 'Chabab Mohammedia', city: 'Mohammedia', founded: 1948, stadium: 'Stade Bachir' }
    ]
  },

  // ===================
  // MIDDLE EAST - TIER 1
  // ===================

  {
    id: 'saudi-pro-league',
    name: 'Saudi Pro League',
    country: 'Saudi Arabia',
    continent: 'Asia',
    tier: 1,
    clubs: [
      { id: 'al-hilal', name: 'Al-Hilal', city: 'Riyadh', founded: 1957, stadium: 'Kingdom Arena', notable: true },
      { id: 'al-nassr', name: 'Al-Nassr', city: 'Riyadh', founded: 1955, stadium: 'Mrsool Park', notable: true },
      { id: 'al-ittihad', name: 'Al-Ittihad', city: 'Jeddah', founded: 1927, stadium: 'King Abdullah Sports City', notable: true },
      { id: 'al-ahli-saudi', name: 'Al-Ahli', city: 'Jeddah', founded: 1937, stadium: 'King Abdullah Sports City', notable: true },
      { id: 'al-shabab', name: 'Al-Shabab', city: 'Riyadh', founded: 1947, stadium: 'Al-Shabab FC Stadium' },
      { id: 'al-taawoun', name: 'Al-Taawoun', city: 'Buraidah', founded: 1956, stadium: 'King Abdullah Sport City Stadium' },
      { id: 'al-ettifaq', name: 'Al-Ettifaq', city: 'Dammam', founded: 1944, stadium: 'Prince Mohamed bin Fahd Stadium' },
      { id: 'al-fateh', name: 'Al-Fateh', city: 'Al-Hasa', founded: 1958, stadium: 'Prince Abdullah bin Jalawi Stadium' },
      { id: 'al-fayha', name: 'Al-Fayha', city: 'Al Majma\'ah', founded: 1954, stadium: 'Al-Majma\'ah Sports City Stadium' },
      { id: 'al-khaleej', name: 'Al-Khaleej', city: 'Saihat', founded: 1945, stadium: 'Prince Saud bin Jalawi Stadium' },
      { id: 'al-okhdood', name: 'Al-Okhdood', city: 'Najran', founded: 1976, stadium: 'Prince Hassan bin Saud Stadium' },
      { id: 'al-raed', name: 'Al-Raed', city: 'Buraidah', founded: 1954, stadium: 'King Abdullah Sport City Stadium' },
      { id: 'al-riyadh', name: 'Al-Riyadh', city: 'Riyadh', founded: 1954, stadium: 'Prince Faisal bin Fahd Stadium' },
      { id: 'al-tai', name: 'Al-Tai', city: 'Ha\'il', founded: 1960, stadium: 'Prince Abdul Aziz bin Musa\'ed Stadium' },
      { id: 'al-wehda', name: 'Al-Wehda', city: 'Mecca', founded: 1945, stadium: 'King Abdul Aziz Stadium' },
      { id: 'damac', name: 'Damac FC', city: 'Khamis Mushait', founded: 1972, stadium: 'Prince Sultan bin Abdul Aziz Stadium' },
      { id: 'abha', name: 'Abha Club', city: 'Abha', founded: 1965, stadium: 'Prince Sultan bin Abdul Aziz Stadium' },
      { id: 'al-hazem', name: 'Al-Hazem', city: 'Ar Rass', founded: 1957, stadium: 'Al-Hazem Club Stadium' }
    ]
  },

  {
    id: 'uae-pro-league',
    name: 'UAE Pro League',
    country: 'UAE',
    continent: 'Asia',
    tier: 1,
    clubs: [
      { id: 'al-ain-uae', name: 'Al Ain FC', city: 'Al Ain', founded: 1968, stadium: 'Hazza bin Zayed Stadium', notable: true },
      { id: 'al-hilal-uae', name: 'Al Hilal', city: 'Al Ain', founded: 1958, stadium: 'Khalifa bin Zayed Stadium' },
      { id: 'al-wahda-uae', name: 'Al Wahda', city: 'Abu Dhabi', founded: 1974, stadium: 'Al Nahyan Stadium', notable: true },
      { id: 'al-nasr-uae', name: 'Al Nasr', city: 'Dubai', founded: 1945, stadium: 'Al Maktoum Stadium', notable: true },
      { id: 'shabab-al-ahli', name: 'Shabab Al Ahli Dubai', city: 'Dubai', founded: 2017, stadium: 'Rashid Stadium', notable: true },
      { id: 'sharjah', name: 'Sharjah FC', city: 'Sharjah', founded: 1966, stadium: 'Sharjah Stadium', notable: true },
      { id: 'ajman-club', name: 'Ajman Club', city: 'Ajman', founded: 1974, stadium: 'Ajman Club Stadium' },
      { id: 'al-jazira', name: 'Al Jazira', city: 'Abu Dhabi', founded: 1974, stadium: 'Mohammed bin Zayed Stadium' },
      { id: 'emirates-club', name: 'Emirates Club', city: 'Ras Al Khaimah', founded: 1969, stadium: 'Emirates Club Stadium' },
      { id: 'al-bataeh', name: 'Al Bataeh Club', city: 'Kalba', founded: 1979, stadium: 'Saqr bin Mohammad Al Qasimi Stadium' },
      { id: 'bani-yas', name: 'Baniyas SC', city: 'Abu Dhabi', founded: 1978, stadium: 'Baniyas Stadium' },
      { id: 'al-wasl', name: 'Al Wasl FC', city: 'Dubai', founded: 1960, stadium: 'Zabeel Stadium', notable: true },
      { id: 'khorfakkan', name: 'Khorfakkan Club', city: 'Khorfakkan', founded: 1981, stadium: 'Khorfakkan Club Stadium' },
      { id: 'al-dhafra', name: 'Al Dhafra FC', city: 'Madinat Zayed', founded: 1974, stadium: 'Hamdan bin Zayed Stadium' }
    ]
  },

  // ===================
  // SCANDINAVIA - TIER 1
  // ===================

  {
    id: 'allsvenskan',
    name: 'Allsvenskan',
    country: 'Sweden',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'malmo-ff', name: 'Malmö FF', city: 'Malmö', founded: 1910, stadium: 'Eleda Stadion', notable: true },
      { id: 'aik', name: 'AIK', city: 'Stockholm', founded: 1891, stadium: 'Friends Arena', notable: true },
      { id: 'hammarby', name: 'Hammarby IF', city: 'Stockholm', founded: 1889, stadium: 'Tele2 Arena', notable: true },
      { id: 'ifk-goteborg', name: 'IFK Göteborg', city: 'Göteborg', founded: 1904, stadium: 'Ullevi', notable: true },
      { id: 'djurgarden', name: 'Djurgårdens IF', city: 'Stockholm', founded: 1891, stadium: 'Tele2 Arena', notable: true },
      { id: 'bk-hacken', name: 'BK Häcken', city: 'Göteborg', founded: 1940, stadium: 'Bravida Arena' },
      { id: 'if-elfsborg', name: 'IF Elfsborg', city: 'Borås', founded: 1904, stadium: 'Borås Arena' },
      { id: 'kalmar-ff', name: 'Kalmar FF', city: 'Kalmar', founded: 1910, stadium: 'Guldfågeln Arena' },
      { id: 'ifk-norrkoping', name: 'IFK Norrköping', city: 'Norrköping', founded: 1897, stadium: 'Platinumcars Arena' },
      { id: 'mjallby-aif', name: 'Mjällby AIF', city: 'Hällevik', founded: 1939, stadium: 'Strandvallen' },
      { id: 'degerfors-if', name: 'Degerfors IF', city: 'Degerfors', founded: 1907, stadium: 'Stora Valla' },
      { id: 'varbergs-bois', name: 'Varbergs BoIS', city: 'Varberg', founded: 1905, stadium: 'Påskbergsvallen' },
      { id: 'ifk-varnamo', name: 'IFK Värnamo', city: 'Värnamo', founded: 1912, stadium: 'Finnvedsvallen' },
      { id: 'goteborg-city', name: 'Göteborg City', city: 'Göteborg', founded: 2001, stadium: 'Valhalla IP' },
      { id: 'sirius', name: 'IK Sirius', city: 'Uppsala', founded: 1907, stadium: 'Studenternas IP' },
      { id: 'halmstads-bk', name: 'Halmstads BK', city: 'Halmstad', founded: 1914, stadium: 'Örjans Vall' }
    ]
  },

  {
    id: 'superettan',
    name: 'Superettan',
    country: 'Sweden',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'orebro-sk', name: 'Örebro SK', city: 'Örebro', founded: 1908, stadium: 'Behrn Arena' },
      { id: 'helsingborgs-if', name: 'Helsingborgs IF', city: 'Helsingborg', founded: 1907, stadium: 'Olympia', notable: true },
      { id: 'gais', name: 'GAIS', city: 'Göteborg', founded: 1894, stadium: 'Gamla Ullevi' },
      { id: 'landskrona-bois', name: 'Landskrona BoIS', city: 'Landskrona', founded: 1915, stadium: 'Landskrona IP' },
      { id: 'ostersunds-fk', name: 'Östersunds FK', city: 'Östersund', founded: 1996, stadium: 'Jämtkraft Arena' },
      { id: 'trelleborgs-ff', name: 'Trelleborgs FF', city: 'Trelleborg', founded: 1926, stadium: 'Vångavallen' },
      { id: 'utsiktens-bk', name: 'Utsiktens BK', city: 'Göteborg', founded: 1907, stadium: 'Bravida Arena' },
      { id: 'sandvikens-if', name: 'Sandvikens IF', city: 'Sandviken', founded: 1918, stadium: 'Jernvallen' },
      { id: 'gefle-if', name: 'Gefle IF', city: 'Gävle', founded: 1882, stadium: 'Strömvallen' },
      { id: 'osters-if', name: 'Östers IF', city: 'Växjö', founded: 1930, stadium: 'Myresjöhus Arena' },
      { id: 'jonkopings-sodra', name: 'Jönköpings Södra IF', city: 'Jönköping', founded: 1922, stadium: 'Stadsparksvallen' },
      { id: 'orgryte-is', name: 'Örgryte IS', city: 'Göteborg', founded: 1887, stadium: 'Gamla Ullevi' },
      { id: 'akropolis-if', name: 'Akropolis IF', city: 'Aten', founded: 2008, stadium: 'Åkeshovs IP' },
      { id: 'falkenbergs-ff', name: 'Falkenbergs FF', city: 'Falkenberg', founded: 1928, stadium: 'Falkenbergs IP' },
      { id: 'vasalunds-if', name: 'Vasalunds IF', city: 'Stockholm', founded: 1934, stadium: 'Skytteholms IP' },
      { id: 'skövde-aik', name: 'Skövde AIK', city: 'Skövde', founded: 1919, stadium: 'Södermalms IP' }
    ]
  },

  {
    id: 'superligaen',
    name: 'Superligaen',
    country: 'Denmark',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'fc-copenhagen', name: 'FC Copenhagen', city: 'Copenhagen', founded: 1992, stadium: 'Parken Stadium', notable: true },
      { id: 'fc-midtjylland', name: 'FC Midtjylland', city: 'Herning', founded: 1999, stadium: 'MCH Arena', notable: true },
      { id: 'brondby-if', name: 'Brøndby IF', city: 'Brøndby', founded: 1964, stadium: 'Brøndby Stadium', notable: true },
      { id: 'agf-aarhus', name: 'AGF Aarhus', city: 'Aarhus', founded: 1880, stadium: 'Ceres Park', notable: true },
      { id: 'fc-nordsjaelland', name: 'FC Nordsjælland', city: 'Farum', founded: 1991, stadium: 'Right to Dream Park' },
      { id: 'randers-fc', name: 'Randers FC', city: 'Randers', founded: 2003, stadium: 'Cepheus Park' },
      { id: 'aab-aalborg', name: 'AaB Aalborg', city: 'Aalborg', founded: 1885, stadium: 'Aalborg Portland Park' },
      { id: 'silkeborg-if', name: 'Silkeborg IF', city: 'Silkeborg', founded: 1917, stadium: 'JYSK Park' },
      { id: 'odense-boldklub', name: 'Odense Boldklub', city: 'Odense', founded: 1887, stadium: 'Nature Energy Park' },
      { id: 'viborg-ff', name: 'Viborg FF', city: 'Viborg', founded: 1896, stadium: 'Energi Viborg Arena' },
      { id: 'lyngby-bk', name: 'Lyngby BK', city: 'Lyngby', founded: 1921, stadium: 'Lyngby Stadion' },
      { id: 'vejle-bk', name: 'Vejle BK', city: 'Vejle', founded: 1891, stadium: 'Vejle Stadion' }
    ]
  },

  {
    id: 'danish-1st-division',
    name: '1. Division',
    country: 'Denmark',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'esbjerg-fb', name: 'Esbjerg fB', city: 'Esbjerg', founded: 1924, stadium: 'Blue Water Arena', notable: true },
      { id: 'hvidovre-if', name: 'Hvidovre IF', city: 'Hvidovre', founded: 1925, stadium: 'Pro Ventilation Arena' },
      { id: 'fc-helsingor', name: 'FC Helsingør', city: 'Helsingør', founded: 2005, stadium: 'Helsingør Stadion' },
      { id: 'kolding-if', name: 'Kolding IF', city: 'Kolding', founded: 1895, stadium: 'Kolding Stadion' },
      { id: 'fredericia-fi', name: 'FC Fredericia', city: 'Fredericia', founded: 1991, stadium: 'Monjasa Park' },
      { id: 'hobro-ik', name: 'Hobro IK', city: 'Hobro', founded: 1913, stadium: 'DS Arena' },
      { id: 'vendsyssel-ff', name: 'Vendsyssel FF', city: 'Hjørring', founded: 1919, stadium: 'Nord Energi Arena' },
      { id: 'hillerod-fodbold', name: 'Hillerød Fodbold', city: 'Hillerød', founded: 2009, stadium: 'Hillerød Stadion' },
      { id: 'naestved-bk', name: 'Næstved BK', city: 'Næstved', founded: 1939, stadium: 'Næstved Stadion' },
      { id: 'thisted-fc', name: 'Thisted FC', city: 'Thisted', founded: 1919, stadium: 'Sparekassen Thy Arena' },
      { id: 'nykoebing-fc', name: 'Nykøbing FC', city: 'Nykøbing Falster', founded: 1968, stadium: 'Nykøbing Stadion' },
      { id: 'fremad-amager', name: 'Fremad Amager', city: 'Copenhagen', founded: 1910, stadium: 'Sundby Idrætspark' }
    ]
  },

  {
    id: 'eliteserien',
    name: 'Eliteserien',
    country: 'Norway',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'molde-fk', name: 'Molde FK', city: 'Molde', founded: 1911, stadium: 'Aker Stadion', notable: true },
      { id: 'rosenborg-bk', name: 'Rosenborg BK', city: 'Trondheim', founded: 1917, stadium: 'Lerkendal Stadion', notable: true },
      { id: 'sk-brann', name: 'SK Brann', city: 'Bergen', founded: 1908, stadium: 'Brann Stadion', notable: true },
      { id: 'valerenga', name: 'Vålerenga', city: 'Oslo', founded: 1913, stadium: 'Intility Arena', notable: true },
      { id: 'bodo-glimt', name: 'Bodø/Glimt', city: 'Bodø', founded: 1916, stadium: 'Aspmyra Stadion', notable: true },
      { id: 'viking-fk', name: 'Viking FK', city: 'Stavanger', founded: 1899, stadium: 'SR-Bank Arena' },
      { id: 'sarpsborg-08', name: 'Sarpsborg 08', city: 'Sarpsborg', founded: 2008, stadium: 'Sarpsborg Stadion' },
      { id: 'stromsgodset', name: 'Strömsgodset', city: 'Drammen', founded: 1876, stadium: 'Marienlyst Stadion' },
      { id: 'kristiansund-bk', name: 'Kristiansund BK', city: 'Kristiansund', founded: 2003, stadium: 'Kristiansund Stadion' },
      { id: 'aalesund-fk', name: 'Aalesunds FK', city: 'Ålesund', founded: 1914, stadium: 'Color Line Stadion' },
      { id: 'lillestrom-sk', name: 'Lillestrøm SK', city: 'Lillestrøm', founded: 1917, stadium: 'Åråsen Stadion' },
      { id: 'haugesund-fk', name: 'FK Haugesund', city: 'Haugesund', founded: 1993, stadium: 'Haugesund Stadion' },
      { id: 'odd-grenland', name: 'Odds BK', city: 'Skien', founded: 1894, stadium: 'Skagerak Arena' },
      { id: 'ham-kam', name: 'HamKam', city: 'Hamar', founded: 1946, stadium: 'Briskeby Arena' },
      { id: 'sandefjord-fotball', name: 'Sandefjord Fotball', city: 'Sandefjord', founded: 1998, stadium: 'Komplett Arena' },
      { id: 'tromso-il', name: 'Tromsø IL', city: 'Tromsø', founded: 1920, stadium: 'Alfheim Stadion' }
    ]
  },

  {
    id: 'norwegian-1st-division',
    name: '1. Division',
    country: 'Norway',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'start-kristiansand', name: 'IK Start', city: 'Kristiansand', founded: 1905, stadium: 'Sør Arena', notable: true },
      { id: 'bryne-fk', name: 'Bryne FK', city: 'Bryne', founded: 1926, stadium: 'Bryne Stadion' },
      { id: 'sandnes-ulf', name: 'Sandnes Ulf', city: 'Sandnes', founded: 1911, stadium: 'Øster Hus Arena' },
      { id: 'raufoss-il', name: 'Raufoss IL', city: 'Raufoss', founded: 1918, stadium: 'Gjemselund Stadion' },
      { id: 'kongsvinger-il', name: 'Kongsvinger IL', city: 'Kongsvinger', founded: 1892, stadium: 'Gjemselund Stadion' },
      { id: 'ranheim-fotball', name: 'Ranheim Fotball', city: 'Trondheim', founded: 1901, stadium: 'Extra Arena' },
      { id: 'jerv', name: 'FK Jerv', city: 'Grimstad', founded: 1921, stadium: 'J.J. Ugland Stadion' },
      { id: 'stjordals-blink', name: 'Stjørdals-Blink', city: 'Stjørdal', founded: 1896, stadium: 'Stjørdals-Blink Stadion' },
      { id: 'aasane-fotball', name: 'Åsane Fotball', city: 'Bergen', founded: 1937, stadium: 'Myrdal Stadion' },
      { id: 'sogndal-fotball', name: 'Sogndal Fotball', city: 'Sogndal', founded: 1926, stadium: 'Fosshaugane Campus' },
      { id: 'mjondalen-if', name: 'Mjøndalen IF', city: 'Mjøndalen', founded: 1910, stadium: 'Consto Arena' },
      { id: 'stabaek-fotball', name: 'Stabæk Fotball', city: 'Bærum', founded: 1912, stadium: 'Nadderud Stadion' },
      { id: 'ullensaker-kisa', name: 'Ullensaker/Kisa', city: 'Jessheim', founded: 2003, stadium: 'Jessheim Stadion' },
      { id: 'egersund-ik', name: 'Egersunds IK', city: 'Egersund', founded: 1917, stadium: 'Eigerøy Stadion' },
      { id: 'levanger-fk', name: 'Levanger FK', city: 'Levanger', founded: 1929, stadium: 'Levanger Stadion' },
      { id: 'lyn-oslo', name: 'Lyn Oslo', city: 'Oslo', founded: 1896, stadium: 'Kringsjå Kunstgressbane' }
    ]
  },

  {
    id: 'veikkausliiga',
    name: 'Veikkausliiga',
    country: 'Finland',
    continent: 'Europe',
    tier: 1,
    clubs: [
      { id: 'hjk-helsinki', name: 'HJK Helsinki', city: 'Helsinki', founded: 1907, stadium: 'Bolt Arena', notable: true },
      { id: 'kups-kuopio', name: 'KuPS', city: 'Kuopio', founded: 1923, stadium: 'Savon Sanomat Areena', notable: true },
      { id: 'fc-lahti', name: 'FC Lahti', city: 'Lahti', founded: 1996, stadium: 'Lahti Stadium' },
      { id: 'fc-inter-turku', name: 'FC Inter Turku', city: 'Turku', founded: 1990, stadium: 'Veritas Stadion' },
      { id: 'seinajoen-jk', name: 'SJK Seinäjoki', city: 'Seinäjoki', founded: 2007, stadium: 'OmaSP Stadion' },
      { id: 'fc-haka', name: 'FC Haka', city: 'Valkeakoski', founded: 1934, stadium: 'Tehtaan kenttä' },
      { id: 'ilves-tampere', name: 'Ilves', city: 'Tampere', founded: 1931, stadium: 'Tampere Stadium' },
      { id: 'mariehamn', name: 'IFK Mariehamn', city: 'Mariehamn', founded: 1919, stadium: 'Wiklöf Holding Arena' },
      { id: 'oulu-palloseura', name: 'AC Oulu', city: 'Oulu', founded: 2002, stadium: 'Raatti Stadium' },
      { id: 'vaasa-ps', name: 'Vaasan Palloseura', city: 'Vaasa', founded: 1924, stadium: 'Elisa Stadion' },
      { id: 'honka-espoo', name: 'FC Honka', city: 'Espoo', founded: 1975, stadium: 'Tapiolan Honka' },
      { id: 'jjk-jyvaskyla', name: 'JJK Jyväskylä', city: 'Jyväskylä', founded: 1923, stadium: 'Harjun Stadion' }
    ]
  },

  {
    id: 'ykkonen',
    name: 'Ykkönen',
    country: 'Finland',
    continent: 'Europe',
    tier: 2,
    clubs: [
      { id: 'tps-turku', name: 'TPS', city: 'Turku', founded: 1922, stadium: 'Veritas Stadion', notable: true },
      { id: 'ff-jaro', name: 'FF Jaro', city: 'Jakobstad', founded: 1965, stadium: 'Jakobstad Centralplan' },
      { id: 'pk-35-vantaa', name: 'PK-35 Vantaa', city: 'Vantaa', founded: 1975, stadium: 'Vantaan urheilupuisto' },
      { id: 'gnistan', name: 'Gnistan', city: 'Helsinki', founded: 1924, stadium: 'Oulunkylän Stadion' },
      { id: 'mps-pori', name: 'MPS', city: 'Pori', founded: 1974, stadium: 'Porin Stadion' },
      { id: 'fc-jazz', name: 'FC Jazz', city: 'Pori', founded: 1992, stadium: 'Porin Stadion' },
      { id: 'ekenas-if', name: 'EkenÄs IF', city: 'Ekenäs', founded: 1905, stadium: 'Ekenäs Centrumplan' },
      { id: 'rovaniemi-ps', name: 'RoPS', city: 'Rovaniemi', founded: 1950, stadium: 'Keskuskenttä' },
      { id: 'jips-helsinki', name: 'JIPS', city: 'Helsinki', founded: 1989, stadium: 'Pirkkolan urheilupuisto' },
      { id: 'klubi-04', name: 'Klubi 04', city: 'Helsinki', founded: 2004, stadium: 'Myllypuro Areena' },
      { id: 'atlantis-helsinki', name: 'Atlantis FC', city: 'Helsinki', founded: 1995, stadium: 'Vuosaaren urheilupuisto' },
      { id: 'mp-mikkeli', name: 'MP', city: 'Mikkeli', founded: 1929, stadium: 'Mikkelin urheilupuisto' }
    ]
  }
]

/**
 * Search clubs by name across all leagues
 */
export function searchClubs(query: string): Club[] {
  if (!query || query.length < 2) return []

  const searchTerm = query.toLowerCase().trim()
  const results: Club[] = []

  FOOTBALL_LEAGUES.forEach(league => {
    league.clubs.forEach(club => {
      if (club.name.toLowerCase().includes(searchTerm) ||
          club.city.toLowerCase().includes(searchTerm)) {
        results.push(club)
      }
    })
  })

  return results.slice(0, 10) // Limit to top 10 results
}

/**
 * Get all clubs from a specific league
 */
export function getClubsByLeague(leagueId: string): Club[] {
  const league = FOOTBALL_LEAGUES.find(l => l.id === leagueId)
  return league ? league.clubs : []
}

/**
 * Get all leagues from a specific country
 */
export function getLeaguesByCountry(country: string): League[] {
  return FOOTBALL_LEAGUES.filter(league =>
    league.country.toLowerCase() === country.toLowerCase()
  )
}

/**
 * Get all leagues from a specific continent
 */
export function getLeaguesByContinent(continent: 'Europe' | 'Africa' | 'Asia'): League[] {
  return FOOTBALL_LEAGUES.filter(league => league.continent === continent)
}

/**
 * Get all clubs from a specific tier
 */
export function getClubsByTier(tier: 1 | 2): Club[] {
  const results: Club[] = []

  FOOTBALL_LEAGUES
    .filter(league => league.tier === tier)
    .forEach(league => {
      results.push(...league.clubs)
    })

  return results
}

/**
 * Get club by ID across all leagues
 */
export function getClubById(clubId: string): Club | undefined {
  for (const league of FOOTBALL_LEAGUES) {
    const club = league.clubs.find(c => c.id === clubId)
    if (club) return club
  }
  return undefined
}

/**
 * Get all club names for autocomplete
 */
export function getAllClubNames(): string[] {
  const names: string[] = []

  FOOTBALL_LEAGUES.forEach(league => {
    league.clubs.forEach(club => {
      names.push(club.name)
    })
  })

  return names.sort()
}

/**
 * Get summary statistics
 */
export function getFootballStats() {
  const stats = {
    totalLeagues: FOOTBALL_LEAGUES.length,
    totalClubs: 0,
    byContinent: {
      Europe: { leagues: 0, clubs: 0 },
      Africa: { leagues: 0, clubs: 0 },
      Asia: { leagues: 0, clubs: 0 }
    },
    byTier: {
      tier1: { leagues: 0, clubs: 0 },
      tier2: { leagues: 0, clubs: 0 }
    }
  }

  FOOTBALL_LEAGUES.forEach(league => {
    stats.totalClubs += league.clubs.length
    stats.byContinent[league.continent].leagues++
    stats.byContinent[league.continent].clubs += league.clubs.length

    if (league.tier === 1) {
      stats.byTier.tier1.leagues++
      stats.byTier.tier1.clubs += league.clubs.length
    } else {
      stats.byTier.tier2.leagues++
      stats.byTier.tier2.clubs += league.clubs.length
    }
  })

  return stats
}