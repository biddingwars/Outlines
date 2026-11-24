// US States pack (starter set). Same structure as the World pack.
//
// facts keys
//   region       'west' | 'south' | 'midwest' | 'northeast' (US Census regions)
//   neighbours   postal codes of states it shares a land border with
//   landBorders  foreign countries it shares a land border with
//   coast        'pacific' | 'atlantic' | 'gulf' | 'great-lakes'
//   fourCorners  true for the four states that meet at one point
//   capital      state capital
//   nickname     official or customary nickname (slug)
//   other keys   culture, food, landmarks, mountains: slugs unique per place

import { localize } from '../i18n/localize.js';

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });

const MEXICO = {
  text: t('It shares a border with Mexico.', 'Es grenzt an Mexiko.', 'Confina con il Messico.', 'Limita con México.', 'Il a une frontière avec le Mexique.'),
  test: { f: 'landBorders', has: 'mexico' },
};
const CANADA = {
  text: t('It shares a land border with Canada.', 'Es hat eine Landgrenze mit Kanada.', 'Ha un confine terrestre con il Canada.', 'Tiene frontera terrestre con Canadá.', 'Il a une frontière terrestre avec le Canada.'),
  test: { f: 'landBorders', has: 'canada' },
};
const PACIFIC = {
  text: t('It has a Pacific coastline.', 'Es hat eine Pazifikküste.', 'Ha una costa sul Pacifico.', 'Tiene costa en el Pacífico.', 'Il a une côte sur le Pacifique.'),
  test: { f: 'coast', has: 'pacific' },
};
const GULF = {
  text: t('It has a coastline on the Gulf of Mexico.', 'Es hat eine Küste am Golf von Mexiko.', 'Ha una costa sul Golfo del Messico.', 'Tiene costa en el golfo de México.', 'Il a une côte sur le golfe du Mexique.'),
  test: { f: 'coast', has: 'gulf' },
};
const LAKES = {
  text: t('It has a shoreline on the Great Lakes.', 'Es hat ein Ufer an den Großen Seen.', 'Si affaccia sui Grandi Laghi.', 'Tiene costa en los Grandes Lagos.', 'Il a une rive sur les Grands Lacs.'),
  test: { f: 'coast', has: 'great-lakes' },
};
const FOUR_CORNERS = {
  text: t('Four states meet at a single point on its border.', 'An seiner Grenze treffen sich vier Staaten in einem Punkt.', 'Sul suo confine quattro stati si incontrano in un solo punto.', 'En su frontera, cuatro estados se tocan en un solo punto.', 'Sur sa frontière, quatre États se rejoignent en un seul point.'),
  test: { f: 'fourCorners', eq: true },
};
const nickname = (en, de, it, es, fr, slug) => ({
  text: t(`Its nickname is the ${en}.`, `Sein Spitzname ist „${en}“ (${de}).`, `Il suo soprannome è «${en}» (${it}).`, `Su apodo es «${en}» (${es}).`, `Son surnom est « ${en} » (${fr}).`),
  test: { f: 'nickname', eq: slug },
});
const capital = (city) => ({
  text: t(`Its capital is ${city}.`, `Seine Hauptstadt ist ${city}.`, `La sua capitale è ${city}.`, `Su capital es ${city}.`, `Sa capitale est ${city}.`),
  test: { f: 'capital', eq: city },
});

const raw = {
  id: 'us-states',
  version: 1,
  title: t('US States', 'US-Bundesstaaten', 'Stati USA', 'Estados de EE. UU.', 'États américains'),
  outlines: 'us-states',
  sources: [
    'Outlines: US Census Bureau Cartographic Boundary Files 1:10m (public domain), via the us-atlas npm package.',
    'Facts: US Census Bureau regions; official state government sites; National Park Service.',
  ],
  settings: {
    rounds: { min: 5, max: 30, default: 8 },
    clueSeconds: 15,
    drawSeconds: 20,
  },
  difficulties: {
    beginner: { maxTier: 1, label: t('Beginner', 'Einsteiger', 'Principiante', 'Principiante', 'Débutant') },
    standard: { maxTier: 2, label: t('Standard', 'Standard', 'Standard', 'Estándar', 'Standard') },
  },
  taunts: {
    early: [
      t('{place}. I could find it blindfolded.', '{place}. Finde ich mit verbundenen Augen.', '{place}. Lo troverei a occhi chiusi.', '{place}. Lo encontraría con los ojos vendados.', '{place}. Je le trouverais les yeux bandés.'),
      t('{place}, obviously. Next!', '{place}, klar. Weiter!', '{place}, ovvio. Avanti!', '{place}, obvio. ¡Siguiente!', '{place}, évidemment. Suivant !'),
    ],
    late: [
      t('{place}. I was just warming up.', '{place}. Ich habe mich nur aufgewärmt.', '{place}. Mi stavo solo scaldando.', '{place}. Solo estaba calentando.', '{place}. Je m’échauffais.'),
      t('Fine, {place}. Happy now?', 'Na gut, {place}. Zufrieden?', 'Va bene, {place}. Contento?', 'Vale, {place}. ¿Contento?', 'Bon, {place}. Content ?'),
    ],
    miss: [
      t('Fifty states. How was I supposed to know?', 'Fünfzig Staaten. Woher soll ich das wissen?', 'Cinquanta stati. Come facevo a saperlo?', 'Cincuenta estados. ¿Cómo iba a saberlo?', 'Cinquante États. Comment j’étais censé savoir ?'),
      t('{place}? That one never sticks.', '{place}? Den merke ich mir nie.', '{place}? Quello non me lo ricordo mai.', '¿{place}? Nunca me acuerdo de ese.', '{place} ? Celui-là, je l’oublie toujours.'),
    ],
    drawGood: [
      t('Surveyor-grade lines.', 'Linien wie vom Landvermesser.', 'Linee da geometra.', 'Líneas de topógrafo.', 'Des lignes de géomètre.'),
      t('Every border, every bend.', 'Jede Grenze, jede Kurve.', 'Ogni confine, ogni curva.', 'Cada frontera, cada curva.', 'Chaque frontière, chaque courbe.'),
    ],
    drawBad: [
      t('Borders move. Mine just moved more.', 'Grenzen verschieben sich. Meine eben etwas mehr.', 'I confini si spostano. I miei un po’ di più.', 'Las fronteras se mueven. Las mías, un poco más.', 'Les frontières bougent. Les miennes un peu plus.'),
      t('That was a rough draft.', 'Das war nur ein Entwurf.', 'Era solo una bozza.', 'Era solo un borrador.', 'C’était un brouillon.'),
    ],
  },
  items: [
    {
      id: 'CA',
      geo: '06',
      tier: 1,
      names: t('California', 'Kalifornien', 'California', 'California', 'Californie'),
      facts: { region: 'west', neighbours: ['OR', 'NV', 'AZ'], landBorders: ['mexico'], coast: ['pacific'], capital: 'Sacramento', nickname: 'golden-state', landmarks: ['golden-gate-bridge', 'yosemite'] },
      clues: [
        MEXICO,
        PACIFIC,
        nickname('Golden State', 'Goldener Staat', 'Stato d’oro', 'Estado Dorado', 'État doré', 'golden-state'),
        {
          text: t('The Golden Gate Bridge and Yosemite are here.', 'Hier liegen die Golden Gate Bridge und Yosemite.', 'Qui si trovano il Golden Gate Bridge e Yosemite.', 'Aquí están el puente Golden Gate y Yosemite.', 'Le Golden Gate Bridge et Yosemite se trouvent ici.'),
          test: { f: 'landmarks', has: 'golden-gate-bridge' },
        },
        capital('Sacramento'),
      ],
      fact: t(
        'It holds both the highest and the lowest points of the contiguous United States: Mount Whitney and Death Valley.',
        'Hier liegen der höchste und der tiefste Punkt der zusammenhängenden USA: Mount Whitney und Death Valley.',
        'Qui si trovano il punto più alto e il più basso degli Stati Uniti continentali: il Monte Whitney e la Death Valley.',
        'Aquí están el punto más alto y el más bajo de los Estados Unidos contiguos: el monte Whitney y el Valle de la Muerte.',
        'On y trouve le point le plus haut et le plus bas des États-Unis contigus : le mont Whitney et la vallée de la Mort.',
      ),
    },
    {
      id: 'TX',
      geo: '48',
      tier: 1,
      names: t('Texas', 'Texas', 'Texas', 'Texas', 'Texas'),
      facts: { region: 'south', neighbours: ['NM', 'OK', 'AR', 'LA'], landBorders: ['mexico'], coast: ['gulf'], capital: 'Austin', nickname: 'lone-star-state', landmarks: ['alamo'] },
      clues: [
        MEXICO,
        GULF,
        nickname('Lone Star State', 'Staat des einsamen Sterns', 'Stato della stella solitaria', 'Estado de la Estrella Solitaria', 'État de l’étoile solitaire', 'lone-star-state'),
        {
          text: t('The Alamo mission, site of a famous battle, is here.', 'Hier steht die Alamo-Mission, Schauplatz einer berühmten Schlacht.', 'Qui si trova la missione di Alamo, teatro di una celebre battaglia.', 'Aquí está la misión de El Álamo, escenario de una famosa batalla.', 'La mission Fort Alamo, théâtre d’une bataille célèbre, se trouve ici.'),
          test: { f: 'landmarks', has: 'alamo' },
        },
        capital('Austin'),
      ],
      fact: t(
        'It was an independent republic for nearly ten years before joining the United States.',
        'Es war fast zehn Jahre lang eine unabhängige Republik, bevor es den USA beitrat.',
        'Fu una repubblica indipendente per quasi dieci anni prima di entrare negli Stati Uniti.',
        'Fue una república independiente durante casi diez años antes de unirse a Estados Unidos.',
        'Il fut une république indépendante pendant près de dix ans avant de rejoindre les États-Unis.',
      ),
    },
    {
      id: 'FL',
      geo: '12',
      tier: 1,
      names: t('Florida', 'Florida', 'Florida', 'Florida', 'Floride'),
      facts: { region: 'south', neighbours: ['GA', 'AL'], landBorders: [], coast: ['atlantic', 'gulf'], capital: 'Tallahassee', nickname: 'sunshine-state', landmarks: ['everglades', 'kennedy-space-center'] },
      clues: [
        {
          text: t('It has coasts on both the Atlantic and the Gulf of Mexico.', 'Es hat Küsten am Atlantik und am Golf von Mexiko.', 'Ha coste sia sull’Atlantico sia sul Golfo del Messico.', 'Tiene costas en el Atlántico y en el golfo de México.', 'Il a des côtes sur l’Atlantique et sur le golfe du Mexique.'),
          test: { f: 'coast', all: ['atlantic', 'gulf'] },
        },
        {
          text: t('It borders only two other states.', 'Es grenzt nur an zwei andere Staaten.', 'Confina solo con altri due stati.', 'Solo limita con otros dos estados.', 'Il ne touche que deux autres États.'),
          test: { f: 'neighbours', count: 2 },
        },
        nickname('Sunshine State', 'Sonnenscheinstaat', 'Stato del sole', 'Estado del Sol', 'État du soleil', 'sunshine-state'),
        {
          text: t('The Everglades and the Kennedy Space Center are here.', 'Hier liegen die Everglades und das Kennedy Space Center.', 'Qui si trovano le Everglades e il Kennedy Space Center.', 'Aquí están los Everglades y el Centro Espacial Kennedy.', 'Les Everglades et le centre spatial Kennedy se trouvent ici.'),
          test: { f: 'landmarks', has: 'everglades' },
        },
        capital('Tallahassee'),
      ],
      fact: t(
        'St. Augustine, founded by Spain, is the oldest continuously inhabited European-founded city in the contiguous United States.',
        'St. Augustine, von Spanien gegründet, ist die älteste durchgehend bewohnte europäische Stadtgründung der zusammenhängenden USA.',
        'St. Augustine, fondata dalla Spagna, è la più antica città di fondazione europea abitata ininterrottamente negli Stati Uniti continentali.',
        'San Agustín, fundada por España, es la ciudad de fundación europea habitada sin interrupción más antigua de los Estados Unidos contiguos.',
        'Saint Augustine, fondée par l’Espagne, est la plus ancienne ville d’origine européenne habitée sans interruption des États-Unis contigus.',
      ),
    },
    {
      id: 'NY',
      geo: '36',
      tier: 1,
      names: t('New York', 'New York', 'New York', 'Nueva York', 'New York'),
      aliases: ['New York State', 'NYS'],
      facts: { region: 'northeast', neighbours: ['VT', 'MA', 'CT', 'NJ', 'PA'], landBorders: ['canada'], coast: ['atlantic', 'great-lakes'], capital: 'Albany', nickname: 'empire-state', landmarks: ['niagara-falls', 'statue-of-liberty'] },
      clues: [
        CANADA,
        {
          text: t('It has an Atlantic coastline.', 'Es hat eine Atlantikküste.', 'Ha una costa sull’Atlantico.', 'Tiene costa en el Atlántico.', 'Il a une côte sur l’Atlantique.'),
          test: { f: 'coast', has: 'atlantic' },
        },
        nickname('Empire State', 'Imperiumsstaat', 'Stato imperiale', 'Estado Imperio', 'État impérial', 'empire-state'),
        {
          text: t('Niagara Falls and the Statue of Liberty are here.', 'Hier liegen die Niagarafälle und die Freiheitsstatue.', 'Qui si trovano le cascate del Niagara e la Statua della Libertà.', 'Aquí están las cataratas del Niágara y la Estatua de la Libertad.', 'Les chutes du Niagara et la statue de la Liberté se trouvent ici.'),
          test: { f: 'landmarks', has: 'niagara-falls' },
        },
        capital('Albany'),
      ],
      fact: t(
        'Its largest city was the first capital of the United States under the Constitution.',
        'Seine größte Stadt war die erste Hauptstadt der USA unter der Verfassung.',
        'La sua città più grande fu la prima capitale degli Stati Uniti sotto la Costituzione.',
        'Su ciudad más grande fue la primera capital de Estados Unidos bajo la Constitución.',
        'Sa plus grande ville fut la première capitale des États-Unis sous la Constitution.',
      ),
    },
    {
      id: 'WA',
      geo: '53',
      tier: 1,
      names: t('Washington', 'Washington', 'Washington', 'Washington', 'Washington'),
      aliases: ['Washington State'],
      facts: { region: 'west', neighbours: ['ID', 'OR'], landBorders: ['canada'], coast: ['pacific'], capital: 'Olympia', nickname: 'evergreen-state', landmarks: ['space-needle', 'mount-rainier'] },
      clues: [
        CANADA,
        PACIFIC,
        nickname('Evergreen State', 'Immergrüner Staat', 'Stato sempreverde', 'Estado Siempreverde', 'État toujours vert', 'evergreen-state'),
        {
          text: t('The Space Needle and Mount Rainier are here.', 'Hier stehen die Space Needle und der Mount Rainier.', 'Qui si trovano lo Space Needle e il Monte Rainier.', 'Aquí están la Space Needle y el monte Rainier.', 'La Space Needle et le mont Rainier se trouvent ici.'),
          test: { f: 'landmarks', has: 'space-needle' },
        },
        capital('Olympia'),
      ],
      fact: t(
        'It is the only state named after a president.',
        'Es ist der einzige Bundesstaat, der nach einem Präsidenten benannt ist.',
        'È l’unico stato che porta il nome di un presidente.',
        'Es el único estado con el nombre de un presidente.',
        'C’est le seul État qui porte le nom d’un président.',
      ),
    },
    {
      id: 'AZ',
      geo: '04',
      tier: 1,
      names: t('Arizona', 'Arizona', 'Arizona', 'Arizona', 'Arizona'),
      facts: { region: 'west', neighbours: ['CA', 'NV', 'UT', 'NM', 'CO'], landBorders: ['mexico'], coast: [], fourCorners: true, dst: false, capital: 'Phoenix', nickname: 'grand-canyon-state', landmarks: ['grand-canyon'] },
      clues: [
        MEXICO,
        FOUR_CORNERS,
        {
          text: t('Most of it does not use daylight saving time.', 'Der größte Teil stellt nicht auf Sommerzeit um.', 'In gran parte non adotta l’ora legale.', 'La mayor parte no usa el horario de verano.', 'La majeure partie n’applique pas l’heure d’été.'),
          test: { f: 'dst', eq: false },
        },
        nickname('Grand Canyon State', 'Grand-Canyon-Staat', 'Stato del Grand Canyon', 'Estado del Gran Cañón', 'État du Grand Canyon', 'grand-canyon-state'),
        capital('Phoenix'),
      ],
      fact: t(
        'In 1912 it became the last of the 48 contiguous states to join the Union.',
        '1912 trat es als letzter der 48 zusammenhängenden Staaten der Union bei.',
        'Nel 1912 fu l’ultimo dei 48 stati continentali a entrare nell’Unione.',
        'En 1912 fue el último de los 48 estados contiguos en unirse a la Unión.',
        'En 1912, il fut le dernier des 48 États contigus à rejoindre l’Union.',
      ),
    },
    {
      id: 'CO',
      geo: '08',
      tier: 2,
      names: t('Colorado', 'Colorado', 'Colorado', 'Colorado', 'Colorado'),
      facts: { region: 'west', neighbours: ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'], landBorders: [], coast: [], fourCorners: true, capital: 'Denver', nickname: 'centennial-state', mountains: ['rockies'] },
      clues: [
        {
          text: t('It has no coastline at all.', 'Es hat überhaupt keine Küste.', 'Non ha alcuna costa.', 'No tiene ninguna costa.', 'Il n’a aucune côte.'),
          test: { f: 'coast', count: 0 },
        },
        FOUR_CORNERS,
        {
          text: t('The Rocky Mountains run through it.', 'Die Rocky Mountains verlaufen durch den Staat.', 'Le Montagne Rocciose lo attraversano.', 'Las Montañas Rocosas lo atraviesan.', 'Les montagnes Rocheuses le traversent.'),
          test: { f: 'mountains', has: 'rockies' },
        },
        {
          text: t('Its nickname is the Centennial State: it joined the Union a hundred years after the Declaration of Independence.', 'Sein Spitzname ist „Centennial State“: Es trat hundert Jahre nach der Unabhängigkeitserklärung der Union bei.', 'Il suo soprannome è «Centennial State»: entrò nell’Unione cent’anni dopo la Dichiarazione d’indipendenza.', 'Su apodo es «Centennial State»: se unió a la Unión cien años después de la Declaración de Independencia.', 'Son surnom est « Centennial State » : il a rejoint l’Union cent ans après la Déclaration d’indépendance.'),
          test: { f: 'nickname', eq: 'centennial-state' },
        },
        capital('Denver'),
      ],
      fact: t(
        'Its borders look straight, but surveying errors gave them hundreds of small kinks.',
        'Seine Grenzen wirken gerade, doch Vermessungsfehler gaben ihnen Hunderte kleiner Knicke.',
        'I suoi confini sembrano dritti, ma errori di misurazione vi hanno creato centinaia di piccole pieghe.',
        'Sus fronteras parecen rectas, pero errores de medición les dieron cientos de pequeños quiebres.',
        'Ses frontières semblent droites, mais des erreurs d’arpentage y ont créé des centaines de petits coudes.',
      ),
    },
    {
      id: 'MI',
      geo: '26',
      tier: 2,
      names: t('Michigan', 'Michigan', 'Michigan', 'Míchigan', 'Michigan'),
      mainlandOnly: true,
      facts: { region: 'midwest', neighbours: ['OH', 'IN', 'WI'], landBorders: [], coast: ['great-lakes'], peninsulas: 2, capital: 'Lansing', nickname: 'great-lakes-state', culture: ['motor-city'] },
      clues: [
        LAKES,
        {
          text: t('It is made of two large peninsulas.', 'Es besteht aus zwei großen Halbinseln.', 'È formato da due grandi penisole.', 'Está formado por dos grandes penínsulas.', 'Il est formé de deux grandes péninsules.'),
          test: { f: 'peninsulas', eq: 2 },
        },
        nickname('Great Lakes State', 'Staat der Großen Seen', 'Stato dei Grandi Laghi', 'Estado de los Grandes Lagos', 'État des Grands Lacs', 'great-lakes-state'),
        {
          text: t('Its largest city is known as the Motor City.', 'Seine größte Stadt ist als „Motor City“ bekannt.', 'La sua città più grande è nota come la «Motor City».', 'Su ciudad más grande es conocida como la «Motor City».', 'Sa plus grande ville est surnommée « Motor City ».'),
          test: { f: 'culture', has: 'motor-city' },
        },
        capital('Lansing'),
      ],
      fact: t(
        'It touches four of the five Great Lakes.',
        'Es grenzt an vier der fünf Großen Seen.',
        'Si affaccia su quattro dei cinque Grandi Laghi.',
        'Toca cuatro de los cinco Grandes Lagos.',
        'Il touche quatre des cinq Grands Lacs.',
      ),
    },
    {
      id: 'LA',
      geo: '22',
      tier: 2,
      names: t('Louisiana', 'Louisiana', 'Louisiana', 'Luisiana', 'Louisiane'),
      facts: { region: 'south', neighbours: ['TX', 'AR', 'MS'], landBorders: [], coast: ['gulf'], capital: 'Baton Rouge', nickname: 'pelican-state', culture: ['parishes', 'mardi-gras'], food: ['gumbo', 'jambalaya'] },
      clues: [
        GULF,
        {
          text: t('It is divided into parishes instead of counties.', 'Es ist in Parishes statt in Countys gegliedert.', 'È diviso in parrocchie invece che in contee.', 'Se divide en parroquias en lugar de condados.', 'Il est divisé en paroisses plutôt qu’en comtés.'),
          test: { f: 'culture', has: 'parishes' },
        },
        {
          text: t('Gumbo and jambalaya are signature dishes here.', 'Gumbo und Jambalaya sind hier typische Gerichte.', 'Gumbo e jambalaya sono i suoi piatti tipici.', 'El gumbo y la jambalaya son sus platos típicos.', 'Le gumbo et le jambalaya sont ses plats emblématiques.'),
          test: { f: 'food', has: 'gumbo' },
        },
        {
          text: t('Mardi Gras in its largest city is world-famous.', 'Der Mardi Gras in seiner größten Stadt ist weltberühmt.', 'Il Mardi Gras della sua città più grande è famoso nel mondo.', 'El Mardi Gras de su ciudad más grande es famoso en todo el mundo.', 'Le Mardi gras de sa plus grande ville est célèbre dans le monde entier.'),
          test: { f: 'culture', has: 'mardi-gras' },
        },
        capital('Baton Rouge'),
      ],
      fact: t(
        'It is named after the French king Louis XIV.',
        'Es ist nach dem französischen König Ludwig XIV. benannt.',
        'Prende il nome dal re di Francia Luigi XIV.',
        'Debe su nombre al rey francés Luis XIV.',
        'Il doit son nom au roi de France Louis XIV.',
      ),
    },
    {
      id: 'PA',
      geo: '42',
      tier: 2,
      names: t('Pennsylvania', 'Pennsylvania', 'Pennsylvania', 'Pensilvania', 'Pennsylvanie'),
      facts: { region: 'northeast', neighbours: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'], landBorders: [], coast: ['great-lakes'], capital: 'Harrisburg', nickname: 'keystone-state', food: ['cheesesteak'], landmarks: ['liberty-bell', 'independence-hall'] },
      clues: [
        LAKES,
        nickname('Keystone State', 'Schlussstein-Staat', 'Stato chiave di volta', 'Estado Piedra Angular', 'État clé de voûte', 'keystone-state'),
        {
          text: t('The cheesesteak sandwich comes from its largest city.', 'Das Cheesesteak-Sandwich stammt aus seiner größten Stadt.', 'Il panino cheesesteak viene dalla sua città più grande.', 'El sándwich cheesesteak viene de su ciudad más grande.', 'Le sandwich cheesesteak vient de sa plus grande ville.'),
          test: { f: 'food', has: 'cheesesteak' },
        },
        {
          text: t('The Liberty Bell and Independence Hall are here.', 'Hier stehen die Liberty Bell und die Independence Hall.', 'Qui si trovano la Liberty Bell e l’Independence Hall.', 'Aquí están la Campana de la Libertad y el Independence Hall.', 'La cloche de la Liberté et l’Independence Hall se trouvent ici.'),
          test: { f: 'landmarks', has: 'liberty-bell' },
        },
        capital('Harrisburg'),
      ],
      fact: t(
        'It is the only one of the original thirteen states without an Atlantic coastline.',
        'Es ist der einzige der dreizehn Gründungsstaaten ohne Atlantikküste.',
        'È l’unico dei tredici stati originari senza costa atlantica.',
        'Es el único de los trece estados originales sin costa atlántica.',
        'C’est le seul des treize États fondateurs sans côte atlantique.',
      ),
    },
  ],
};

/** Texts still missing a translation; tools/i18n.mjs prints them. */
export const missing = [];
export default localize(raw, 'us', missing);
