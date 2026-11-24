// World Countries pack: base data (names, outlines, fun facts, taunts, settings).
// The clue pools live in clues-*.js and are merged in by pack.js.
//
// Each clue has prose in five languages plus a `test` over the place's
// `facts`. The pack validator proves every test is true of its own place and
// that the five tests together identify it, so a clue can't quietly be wrong
// or ambiguous. Facts are checked against the sources listed below.
//
// facts keys
//   continent   'europe' | 'asia' | 'africa' | 'oceania' | 'north-america' | 'south-america'
//   hemisphere  'north' | 'south' | 'both'
//   drive       'left' | 'right'
//   flag        colours of the flag field (emblems excluded)
//   lang        official / national languages
//   neighbours  ISO 3166-1 alpha-3 codes of land neighbours (incl. via overseas regions)
//   enclaves    countries entirely surrounded by this one
//   coast       seas and oceans it has a coast on
//   capital     capital city (English) — array when a country has several
//   other keys  culture, food, landmarks, symbols: short slugs, unique per place

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });

const DRIVE_LEFT = {
  text: t(
    'Cars drive on the left here.',
    'Hier fährt man auf der linken Straßenseite.',
    'Qui si guida a sinistra.',
    'Aquí se conduce por la izquierda.',
    'Ici, on roule à gauche.',
  ),
  test: { f: 'drive', eq: 'left' },
};
const SOUTH = {
  text: t(
    'It lies entirely in the Southern Hemisphere.',
    'Es liegt vollständig auf der Südhalbkugel.',
    "Si trova interamente nell'emisfero australe.",
    'Se encuentra totalmente en el hemisferio sur.',
    "Il se trouve entièrement dans l'hémisphère sud.",
  ),
  test: { f: 'hemisphere', eq: 'south' },
};
const SPANISH = {
  text: t(
    'Spanish is its official language.',
    'Seine Amtssprache ist Spanisch.',
    'La sua lingua ufficiale è lo spagnolo.',
    'Su idioma oficial es el español.',
    'Sa langue officielle est l’espagnol.',
  ),
  test: { f: 'lang', has: 'spanish' },
};
const EQUATOR = {
  text: t(
    'The equator runs through it.',
    'Der Äquator verläuft durch das Land.',
    "L'equatore lo attraversa.",
    'La línea del ecuador lo atraviesa.',
    "L'équateur le traverse.",
  ),
  test: { f: 'equator', eq: true },
};
const NO_BORDERS = {
  text: t(
    'It has no land border with any other country.',
    'Es hat keine Landgrenze zu einem anderen Land.',
    'Non ha confini terrestri con nessun altro paese.',
    'No tiene frontera terrestre con ningún otro país.',
    'Il n’a aucune frontière terrestre avec un autre pays.',
  ),
  test: { f: 'neighbours', count: 0 },
};
const PORTUGUESE = {
  text: t(
    'Its official language is Portuguese.',
    'Seine Amtssprache ist Portugiesisch.',
    'La sua lingua ufficiale è il portoghese.',
    'Su idioma oficial es el portugués.',
    'Sa langue officielle est le portugais.',
  ),
  test: { f: 'lang', has: 'portuguese' },
};
const capital = (city, de, it, es, fr, f = { f: 'capital', eq: city }) => ({
  text: t(`Its capital is ${city}.`, `Seine Hauptstadt ist ${de}.`, `La sua capitale è ${it}.`, `Su capital es ${es}.`, `Sa capitale est ${fr}.`),
  test: f,
});

export default {
  id: 'world',
  version: 1,
  title: t('Countries', 'Länder', 'Paesi', 'Países', 'Pays'),
  outlines: 'world',
  sources: [
    'Outlines: Natural Earth 1:50m Admin 0 Countries (public domain), via the world-atlas npm package.',
    'Facts: CIA World Factbook (public domain); UNESCO World Heritage List; national government sites.',
  ],
  settings: {
    rounds: { min: 5, max: 30, default: 10 },
    clueSeconds: 15,
    drawSeconds: 20,
  },
  difficulties: {
    beginner: { maxTier: 1, label: t('Beginner', 'Einsteiger', 'Principiante', 'Principiante', 'Débutant') },
    standard: { maxTier: 2, label: t('Standard', 'Standard', 'Standard', 'Estándar', 'Standard') },
  },
  taunts: {
    early: [
      t('{place}? Too easy.', '{place}? Zu einfach.', '{place}? Troppo facile.', '¿{place}? Demasiado fácil.', '{place} ? Trop facile.'),
      t('I had {place} before you finished reading.', 'Ich hatte {place}, bevor du fertig gelesen hattest.', 'Avevo già capito {place} prima che finissi di leggere.', 'Ya sabía que era {place} antes de que terminaras de leer.', 'J’avais trouvé {place} avant que tu finisses de lire.'),
    ],
    late: [
      t('{place}. Took me a while, I admit.', '{place}. Hat etwas gedauert, zugegeben.', '{place}. Ci ho messo un po’, lo ammetto.', '{place}. Me costó un poco, lo admito.', '{place}. J’ai mis du temps, je l’avoue.'),
      t('Ah, {place}. Of course. Obviously.', 'Ah, {place}. Natürlich. Klar doch.', 'Ah, {place}. Ovvio. Ovviamente.', 'Ah, {place}. Claro. Evidentemente.', 'Ah, {place}. Bien sûr. Évidemment.'),
    ],
    miss: [
      t('{place}? Let’s pretend that didn’t happen.', '{place}? Tun wir so, als wäre das nie passiert.', '{place}? Facciamo finta che non sia successo.', '¿{place}? Hagamos como si no hubiera pasado.', '{place} ? Faisons comme si de rien n’était.'),
      t('I was thinking of somewhere else entirely.', 'Ich dachte an ein ganz anderes Land.', 'Pensavo a tutt’altro posto.', 'Estaba pensando en otro sitio totalmente distinto.', 'Je pensais à un tout autre endroit.'),
    ],
    drawGood: [
      t('Look at that coastline. Frame it.', 'Schau dir diese Küste an. Einrahmen!', 'Guarda che costa. Da incorniciare.', 'Mira esa costa. Para enmarcar.', 'Regarde-moi cette côte. À encadrer.'),
      t('Steady hand, clear mind.', 'Ruhige Hand, klarer Kopf.', 'Mano ferma, mente lucida.', 'Pulso firme, mente clara.', 'Main sûre, esprit clair.'),
    ],
    drawBad: [
      t('My hand slipped. That’s my story.', 'Mir ist die Hand ausgerutscht. Dabei bleibe ich.', 'Mi è scivolata la mano. Questa è la mia versione.', 'Se me resbaló la mano. Esa es mi versión.', 'Ma main a glissé. C’est ma version.'),
      t('Modern art. You wouldn’t understand.', 'Moderne Kunst. Das verstehst du nicht.', 'Arte moderna. Non capiresti.', 'Arte moderno. No lo entenderías.', 'Art moderne. Tu ne comprendrais pas.'),
    ],
  },
  items: [
    {
      id: 'PRT',
      geo: '620',
      tier: 2,
      names: t('Portugal', 'Portugal', 'Portogallo', 'Portugal', 'Portugal'),
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['green', 'red'], lang: ['portuguese'], neighbours: ['ESP'], coast: ['atlantic'], capital: 'Lisbon', culture: ['fado'] },
      clues: [
        {
          text: t('It shares a land border with only one country.', 'Es grenzt an Land nur an ein einziges Land.', 'Confina via terra con un solo paese.', 'Solo comparte frontera terrestre con un país.', 'Il ne partage de frontière terrestre qu’avec un seul pays.'),
          test: { f: 'neighbours', count: 1 },
        },
        PORTUGUESE,
        {
          text: t('Its flag is green and red.', 'Seine Flagge ist grün und rot.', 'La sua bandiera è verde e rossa.', 'Su bandera es verde y roja.', 'Son drapeau est vert et rouge.'),
          test: { f: 'flag', all: ['green', 'red'] },
        },
        {
          text: t('Fado, a melancholic style of song, was born here.', 'Hier entstand der Fado, ein melancholischer Gesangsstil.', 'Qui è nato il fado, un genere di canto malinconico.', 'Aquí nació el fado, un estilo de canción melancólico.', 'Le fado, un chant mélancolique, est né ici.'),
          test: { f: 'culture', has: 'fado' },
        },
        capital('Lisbon', 'Lissabon', 'Lisbona', 'Lisboa', 'Lisbonne'),
      ],
      fact: t(
        'Its border with Spain is one of the oldest in Europe, largely unchanged since the 13th century.',
        'Seine Grenze zu Spanien gehört zu den ältesten Europas und ist seit dem 13. Jahrhundert weitgehend unverändert.',
        'Il suo confine con la Spagna è tra i più antichi d’Europa, quasi invariato dal XIII secolo.',
        'Su frontera con España es una de las más antiguas de Europa, casi sin cambios desde el siglo XIII.',
        'Sa frontière avec l’Espagne est l’une des plus anciennes d’Europe, presque inchangée depuis le XIIIe siècle.',
      ),
    },
    {
      id: 'ESP',
      geo: '724',
      tier: 1,
      names: t('Spain', 'Spanien', 'Spagna', 'España', 'Espagne'),
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['red', 'yellow'], lang: ['spanish'], neighbours: ['PRT', 'FRA', 'AND', 'MAR'], coast: ['atlantic', 'mediterranean'], capital: 'Madrid', food: ['paella'], landmarks: ['alhambra', 'sagrada-familia'] },
      clues: [
        {
          text: t('It has coasts on both the Atlantic and the Mediterranean.', 'Es hat Küsten am Atlantik und am Mittelmeer.', 'Ha coste sia sull’Atlantico sia sul Mediterraneo.', 'Tiene costas en el Atlántico y en el Mediterráneo.', 'Il a des côtes sur l’Atlantique et sur la Méditerranée.'),
          test: { f: 'coast', all: ['atlantic', 'mediterranean'] },
        },
        {
          text: t('Its flag is red and yellow.', 'Seine Flagge ist rot und gelb.', 'La sua bandiera è rossa e gialla.', 'Su bandera es roja y amarilla.', 'Son drapeau est rouge et jaune.'),
          test: { f: 'flag', all: ['red', 'yellow'] },
        },
        {
          text: t('Paella, the rice dish from Valencia, comes from here.', 'Die Paella, das Reisgericht aus Valencia, stammt von hier.', 'La paella, il piatto di riso di Valencia, viene da qui.', 'La paella, el plato de arroz valenciano, es de aquí.', 'La paella, le plat de riz de Valence, vient d’ici.'),
          test: { f: 'food', has: 'paella' },
        },
        {
          text: t('The Alhambra palace and the Sagrada Família basilica are here.', 'Hier stehen die Alhambra und die Sagrada Família.', 'Qui si trovano l’Alhambra e la Sagrada Família.', 'Aquí están la Alhambra y la Sagrada Familia.', 'L’Alhambra et la Sagrada Família se trouvent ici.'),
          test: { f: 'landmarks', has: 'alhambra' },
        },
        capital('Madrid', 'Madrid', 'Madrid', 'Madrid', 'Madrid'),
      ],
      fact: t(
        'Its Canary Islands lie off the coast of Africa.',
        'Seine Kanarischen Inseln liegen vor der Küste Afrikas.',
        'Le sue isole Canarie si trovano al largo dell’Africa.',
        'Sus islas Canarias están frente a la costa de África.',
        'Ses îles Canaries se trouvent au large de l’Afrique.',
      ),
    },
    {
      id: 'FRA',
      geo: '250',
      tier: 1,
      names: t('France', 'Frankreich', 'Francia', 'Francia', 'France'),
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['blue', 'white', 'red'], lang: ['french'], neighbours: ['BEL', 'LUX', 'DEU', 'CHE', 'ITA', 'MCO', 'AND', 'ESP', 'BRA', 'SUR'], coast: ['atlantic', 'mediterranean', 'english-channel'], capital: 'Paris', culture: ['tour-de-france'], landmarks: ['eiffel-tower', 'mont-saint-michel'] },
      clues: [
        {
          text: t('Through an overseas region in South America, it shares a land border with Brazil.', 'Über eine Überseeregion in Südamerika grenzt es an Brasilien.', 'Grazie a una regione d’oltremare in Sud America, confina con il Brasile.', 'Gracias a una región de ultramar en Sudamérica, limita con Brasil.', 'Grâce à une région d’outre-mer en Amérique du Sud, il a une frontière avec le Brésil.'),
          test: { f: 'neighbours', has: 'BRA' },
        },
        {
          text: t('Its flag has three vertical stripes: blue, white and red.', 'Seine Flagge hat drei senkrechte Streifen: Blau, Weiß und Rot.', 'La sua bandiera ha tre bande verticali: blu, bianca e rossa.', 'Su bandera tiene tres franjas verticales: azul, blanca y roja.', 'Son drapeau a trois bandes verticales : bleu, blanc et rouge.'),
          test: { f: 'flag', all: ['blue', 'white', 'red'] },
        },
        {
          text: t('The world’s most famous cycling race is named after it.', 'Das berühmteste Radrennen der Welt ist nach ihm benannt.', 'La corsa ciclistica più famosa del mondo porta il suo nome.', 'La carrera ciclista más famosa del mundo lleva su nombre.', 'La course cycliste la plus célèbre du monde porte son nom.'),
          test: { f: 'culture', has: 'tour-de-france' },
        },
        {
          text: t('Mont-Saint-Michel and the Eiffel Tower are here.', 'Hier stehen der Mont-Saint-Michel und der Eiffelturm.', 'Qui si trovano Mont-Saint-Michel e la Torre Eiffel.', 'Aquí están el Mont-Saint-Michel y la Torre Eiffel.', 'Le Mont-Saint-Michel et la tour Eiffel se trouvent ici.'),
          test: { f: 'landmarks', has: 'mont-saint-michel' },
        },
        capital('Paris', 'Paris', 'Parigi', 'París', 'Paris'),
      ],
      fact: t(
        'Thanks to its overseas territories, it spans more time zones than any other country.',
        'Dank seiner Überseegebiete erstreckt es sich über mehr Zeitzonen als jedes andere Land.',
        'Grazie ai territori d’oltremare, copre più fusi orari di qualsiasi altro paese.',
        'Gracias a sus territorios de ultramar, abarca más husos horarios que ningún otro país.',
        'Grâce à ses territoires d’outre-mer, il s’étend sur plus de fuseaux horaires que tout autre pays.',
      ),
    },
    {
      id: 'ITA',
      geo: '380',
      tier: 1,
      names: t('Italy', 'Italien', 'Italia', 'Italia', 'Italie'),
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['green', 'white', 'red'], lang: ['italian'], neighbours: ['FRA', 'CHE', 'AUT', 'SVN', 'SMR', 'VAT'], enclaves: ['SMR', 'VAT'], coast: ['mediterranean', 'adriatic'], capital: 'Rome', landmarks: ['etna', 'vesuvius', 'colosseum'], food: ['pizza'] },
      clues: [
        {
          text: t('Two independent countries lie entirely within its borders.', 'Zwei unabhängige Staaten liegen vollständig in seinem Gebiet.', 'Due stati indipendenti si trovano interamente al suo interno.', 'Dos países independientes se encuentran completamente dentro de él.', 'Deux pays indépendants sont entièrement enclavés dans son territoire.'),
          test: { f: 'enclaves', count: 2 },
        },
        {
          text: t('Its flag is green, white and red.', 'Seine Flagge ist grün, weiß und rot.', 'La sua bandiera è verde, bianca e rossa.', 'Su bandera es verde, blanca y roja.', 'Son drapeau est vert, blanc et rouge.'),
          test: { f: 'flag', all: ['green', 'white', 'red'] },
        },
        {
          text: t('The volcanoes Etna and Vesuvius are here.', 'Hier liegen die Vulkane Ätna und Vesuv.', 'Qui si trovano i vulcani Etna e Vesuvio.', 'Aquí están los volcanes Etna y Vesubio.', 'Les volcans Etna et Vésuve se trouvent ici.'),
          test: { f: 'landmarks', has: 'etna' },
        },
        {
          text: t('Pizza and the Colosseum both come from here.', 'Pizza und Kolosseum stammen beide von hier.', 'La pizza e il Colosseo vengono entrambi da qui.', 'La pizza y el Coliseo son de aquí.', 'La pizza et le Colisée viennent d’ici.'),
          test: { f: 'food', has: 'pizza' },
        },
        capital('Rome', 'Rom', 'Roma', 'Roma', 'Rome'),
      ],
      fact: t(
        'It has more UNESCO World Heritage Sites than almost any other country.',
        'Es hat mehr UNESCO-Welterbestätten als fast jedes andere Land.',
        'Ha più siti Patrimonio dell’UNESCO di quasi ogni altro paese.',
        'Tiene más sitios Patrimonio de la Humanidad que casi cualquier otro país.',
        'Il compte plus de sites du patrimoine mondial de l’UNESCO que presque tout autre pays.',
      ),
    },
    {
      id: 'DEU',
      geo: '276',
      tier: 1,
      names: t('Germany', 'Deutschland', 'Germania', 'Alemania', 'Allemagne'),
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['black', 'red', 'yellow'], lang: ['german'], neighbours: ['DNK', 'POL', 'CZE', 'AUT', 'CHE', 'FRA', 'LUX', 'BEL', 'NLD'], coast: ['north-sea', 'baltic'], capital: 'Berlin', culture: ['oktoberfest'] },
      clues: [
        {
          text: t('It borders nine countries.', 'Es grenzt an neun Länder.', 'Confina con nove paesi.', 'Limita con nueve países.', 'Il a neuf pays voisins.'),
          test: { f: 'neighbours', count: 9 },
        },
        {
          text: t('It has coasts on both the North Sea and the Baltic Sea.', 'Es hat Küsten an Nord- und Ostsee.', 'Ha coste sia sul Mare del Nord sia sul Mar Baltico.', 'Tiene costas en el mar del Norte y en el mar Báltico.', 'Il a des côtes sur la mer du Nord et sur la mer Baltique.'),
          test: { f: 'coast', all: ['north-sea', 'baltic'] },
        },
        {
          text: t('Its flag is black, red and gold.', 'Seine Flagge ist schwarz, rot und gold.', 'La sua bandiera è nera, rossa e oro.', 'Su bandera es negra, roja y dorada.', 'Son drapeau est noir, rouge et or.'),
          test: { f: 'flag', all: ['black', 'red', 'yellow'] },
        },
        {
          text: t('Oktoberfest is held here every year.', 'Hier findet jedes Jahr das Oktoberfest statt.', 'Qui si tiene ogni anno l’Oktoberfest.', 'Aquí se celebra cada año el Oktoberfest.', 'L’Oktoberfest a lieu ici chaque année.'),
          test: { f: 'culture', has: 'oktoberfest' },
        },
        capital('Berlin', 'Berlin', 'Berlino', 'Berlín', 'Berlin'),
      ],
      fact: t(
        'Johannes Gutenberg printed Europe’s first books with movable metal type here, in Mainz.',
        'Johannes Gutenberg druckte hier, in Mainz, die ersten Bücher Europas mit beweglichen Metalllettern.',
        'Qui, a Magonza, Gutenberg stampò i primi libri europei a caratteri mobili in metallo.',
        'Aquí, en Maguncia, Gutenberg imprimió los primeros libros de Europa con tipos móviles de metal.',
        'C’est ici, à Mayence, que Gutenberg imprima les premiers livres européens en caractères mobiles métalliques.',
      ),
    },
    {
      id: 'GBR',
      geo: '826',
      tier: 1,
      names: t('United Kingdom', 'Vereinigtes Königreich', 'Regno Unito', 'Reino Unido', 'Royaume-Uni'),
      aliases: ['UK', 'Great Britain', 'Britain', 'England', 'Großbritannien', 'Gran Bretagna', 'Gran Bretaña', 'Grande-Bretagne', 'Angleterre', 'Inghilterra', 'Inglaterra'],
      facts: { continent: 'europe', hemisphere: 'north', drive: 'left', flag: ['red', 'white', 'blue'], lang: ['english'], neighbours: ['IRL'], coast: ['atlantic', 'north-sea', 'english-channel'], capital: 'London', food: ['fish-and-chips'], landmarks: ['stonehenge'] },
      clues: [
        DRIVE_LEFT,
        {
          text: t('Its flag is red, white and blue.', 'Seine Flagge ist rot, weiß und blau.', 'La sua bandiera è rossa, bianca e blu.', 'Su bandera es roja, blanca y azul.', 'Son drapeau est rouge, blanc et bleu.'),
          test: { f: 'flag', all: ['red', 'white', 'blue'] },
        },
        {
          text: t('Fish and chips is a classic dish here.', 'Fish and Chips ist hier ein Klassiker.', 'Il fish and chips è un piatto classico qui.', 'El fish and chips es un plato clásico aquí.', 'Le fish and chips est un plat classique ici.'),
          test: { f: 'food', has: 'fish-and-chips' },
        },
        {
          text: t('Stonehenge stands here.', 'Hier steht Stonehenge.', 'Qui si trova Stonehenge.', 'Aquí se alza Stonehenge.', 'Stonehenge se dresse ici.'),
          test: { f: 'landmarks', has: 'stonehenge' },
        },
        capital('London', 'London', 'Londra', 'Londres', 'Londres'),
      ],
      fact: t(
        'No point on the island of Great Britain is more than about 115 km from the sea.',
        'Kein Ort auf der Insel Großbritannien ist mehr als etwa 115 km vom Meer entfernt.',
        'Nessun punto dell’isola di Gran Bretagna dista più di circa 115 km dal mare.',
        'Ningún punto de la isla de Gran Bretaña está a más de unos 115 km del mar.',
        'Aucun point de l’île de Grande-Bretagne n’est à plus d’environ 115 km de la mer.',
      ),
    },
    {
      id: 'IRL',
      geo: '372',
      tier: 2,
      names: t('Ireland', 'Irland', 'Irlanda', 'Irlanda', 'Irlande'),
      aliases: ['Eire', 'Éire', 'Republic of Ireland'],
      facts: { continent: 'europe', hemisphere: 'north', drive: 'left', flag: ['green', 'white', 'orange'], lang: ['irish', 'english'], neighbours: ['GBR'], coast: ['atlantic', 'irish-sea'], capital: 'Dublin', symbols: ['harp', 'shamrock'] },
      clues: [
        DRIVE_LEFT,
        {
          text: t('Its first official language is a Celtic language.', 'Seine erste Amtssprache ist eine keltische Sprache.', 'La sua prima lingua ufficiale è una lingua celtica.', 'Su primera lengua oficial es una lengua celta.', 'Sa première langue officielle est une langue celtique.'),
          test: { f: 'lang', has: 'irish' },
        },
        {
          text: t('Its flag is green, white and orange.', 'Seine Flagge ist grün, weiß und orange.', 'La sua bandiera è verde, bianca e arancione.', 'Su bandera es verde, blanca y naranja.', 'Son drapeau est vert, blanc et orange.'),
          test: { f: 'flag', all: ['green', 'white', 'orange'] },
        },
        {
          text: t('Its national symbol is the harp, which also appears on its euro coins.', 'Sein Nationalsymbol ist die Harfe, die auch auf seinen Euromünzen zu sehen ist.', 'Il suo simbolo nazionale è l’arpa, presente anche sulle sue monete in euro.', 'Su símbolo nacional es el arpa, que también aparece en sus monedas de euro.', 'Son symbole national est la harpe, qui figure aussi sur ses pièces en euros.'),
          test: { f: 'symbols', has: 'harp' },
        },
        capital('Dublin', 'Dublin', 'Dublino', 'Dublín', 'Dublin'),
      ],
      fact: t(
        'The state harp faces left; the harp on Guinness bottles faces right.',
        'Die Staatsharfe zeigt nach links, die Harfe auf Guinness-Flaschen nach rechts.',
        'L’arpa di Stato è rivolta a sinistra; quella sulle bottiglie di Guinness a destra.',
        'El arpa del Estado mira a la izquierda; la de las botellas de Guinness, a la derecha.',
        'La harpe de l’État est tournée vers la gauche ; celle des bouteilles de Guinness, vers la droite.',
      ),
    },
    {
      id: 'NOR',
      geo: '578',
      tier: 2,
      names: t('Norway', 'Norwegen', 'Norvegia', 'Noruega', 'Norvège'),
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['red', 'white', 'blue'], lang: ['norwegian'], neighbours: ['SWE', 'FIN', 'RUS'], coast: ['north-sea', 'atlantic', 'arctic'], capital: 'Oslo', culture: ['nobel-peace-prize'], landmarks: ['geirangerfjord'] },
      clues: [
        {
          text: t('Part of its coastline faces the Arctic Ocean.', 'Ein Teil seiner Küste liegt am Nordpolarmeer.', 'Parte della sua costa si affaccia sul Mar Glaciale Artico.', 'Parte de su costa da al océano Ártico.', 'Une partie de sa côte donne sur l’océan Arctique.'),
          test: { f: 'coast', has: 'arctic' },
        },
        {
          text: t('Its flag is red with a blue cross outlined in white.', 'Seine Flagge ist rot mit einem weiß umrandeten blauen Kreuz.', 'La sua bandiera è rossa con una croce blu bordata di bianco.', 'Su bandera es roja con una cruz azul bordeada de blanco.', 'Son drapeau est rouge avec une croix bleue bordée de blanc.'),
          test: { f: 'flag', all: ['red', 'white', 'blue'] },
        },
        {
          text: t('The Nobel Peace Prize is awarded here each year.', 'Hier wird jedes Jahr der Friedensnobelpreis verliehen.', 'Qui viene assegnato ogni anno il Premio Nobel per la pace.', 'Aquí se entrega cada año el Premio Nobel de la Paz.', 'Le prix Nobel de la paix y est remis chaque année.'),
          test: { f: 'culture', has: 'nobel-peace-prize' },
        },
        {
          text: t('Its west coast is cut by deep fjords such as the Geirangerfjord.', 'Seine Westküste ist von tiefen Fjorden wie dem Geirangerfjord zerschnitten.', 'La sua costa occidentale è solcata da fiordi profondi come il Geirangerfjord.', 'Su costa oeste está surcada por fiordos profundos como el Geirangerfjord.', 'Sa côte ouest est découpée par de profonds fjords comme le Geirangerfjord.'),
          test: { f: 'landmarks', has: 'geirangerfjord' },
        },
        capital('Oslo', 'Oslo', 'Oslo', 'Oslo', 'Oslo'),
      ],
      fact: t(
        'Every year since 1947 it has given London the Christmas tree in Trafalgar Square.',
        'Seit 1947 schenkt es London jedes Jahr den Weihnachtsbaum am Trafalgar Square.',
        'Dal 1947 regala ogni anno a Londra l’albero di Natale di Trafalgar Square.',
        'Desde 1947 regala cada año a Londres el árbol de Navidad de Trafalgar Square.',
        'Depuis 1947, il offre chaque année à Londres le sapin de Noël de Trafalgar Square.',
      ),
    },
    {
      id: 'GRC',
      geo: '300',
      tier: 2,
      names: t('Greece', 'Griechenland', 'Grecia', 'Grecia', 'Grèce'),
      aliases: ['Hellas', 'Ellada'],
      mainlandOnly: true,
      facts: { continent: 'europe', hemisphere: 'north', drive: 'right', flag: ['blue', 'white'], lang: ['greek'], neighbours: ['ALB', 'MKD', 'BGR', 'TUR'], coast: ['mediterranean', 'aegean', 'ionian'], capital: 'Athens', culture: ['ancient-olympics'], landmarks: ['parthenon'] },
      clues: [
        {
          text: t('Its coast faces the Aegean Sea.', 'Seine Küste liegt an der Ägäis.', 'La sua costa si affaccia sul Mar Egeo.', 'Su costa da al mar Egeo.', 'Sa côte donne sur la mer Égée.'),
          test: { f: 'coast', has: 'aegean' },
        },
        {
          text: t('Its flag has blue and white stripes and a white cross.', 'Seine Flagge hat blau-weiße Streifen und ein weißes Kreuz.', 'La sua bandiera ha strisce blu e bianche e una croce bianca.', 'Su bandera tiene franjas azules y blancas y una cruz blanca.', 'Son drapeau a des bandes bleues et blanches et une croix blanche.'),
          test: { f: 'flag', all: ['blue', 'white'] },
        },
        {
          text: t('The ancient Olympic Games were held here.', 'Hier fanden die antiken Olympischen Spiele statt.', 'Qui si svolgevano gli antichi Giochi olimpici.', 'Aquí se celebraban los antiguos Juegos Olímpicos.', 'Les Jeux olympiques antiques se tenaient ici.'),
          test: { f: 'culture', has: 'ancient-olympics' },
        },
        {
          text: t('The Parthenon stands on a hill in its capital.', 'Der Parthenon steht auf einem Hügel in seiner Hauptstadt.', 'Il Partenone sorge su una collina della sua capitale.', 'El Partenón se alza sobre una colina de su capital.', 'Le Parthénon se dresse sur une colline de sa capitale.'),
          test: { f: 'landmarks', has: 'parthenon' },
        },
        capital('Athens', 'Athen', 'Atene', 'Atenas', 'Athènes'),
      ],
      fact: t(
        'It has thousands of islands, but only around two hundred are inhabited.',
        'Es hat Tausende Inseln, aber nur etwa zweihundert sind bewohnt.',
        'Ha migliaia di isole, ma solo circa duecento sono abitate.',
        'Tiene miles de islas, pero solo unas doscientas están habitadas.',
        'Il compte des milliers d’îles, mais seules quelque deux cents sont habitées.',
      ),
    },
    {
      id: 'EGY',
      geo: '818',
      tier: 1,
      names: t('Egypt', 'Ägypten', 'Egitto', 'Egipto', 'Égypte'),
      facts: { continent: 'africa', hemisphere: 'north', drive: 'right', flag: ['red', 'white', 'black'], lang: ['arabic'], neighbours: ['LBY', 'SDN', 'ISR', 'PSE'], coast: ['mediterranean', 'red-sea'], capital: 'Cairo', climate: ['desert'], transcontinental: true, landmarks: ['pyramids-of-giza', 'suez-canal'] },
      clues: [
        {
          text: t('Most of it is desert.', 'Der größte Teil ist Wüste.', 'È in gran parte deserto.', 'La mayor parte es desierto.', 'Il est en grande partie désertique.'),
          test: { f: 'climate', has: 'desert' },
        },
        {
          text: t('Its flag is red, white and black, with a golden eagle.', 'Seine Flagge ist rot, weiß und schwarz, mit einem goldenen Adler.', 'La sua bandiera è rossa, bianca e nera, con un’aquila dorata.', 'Su bandera es roja, blanca y negra, con un águila dorada.', 'Son drapeau est rouge, blanc et noir, avec un aigle doré.'),
          test: { f: 'flag', all: ['red', 'white', 'black'] },
        },
        {
          text: t('It spans two continents: the Sinai Peninsula lies in Asia.', 'Es liegt auf zwei Kontinenten: Die Sinai-Halbinsel gehört zu Asien.', 'Si estende su due continenti: la penisola del Sinai è in Asia.', 'Se extiende por dos continentes: la península del Sinaí está en Asia.', 'Il s’étend sur deux continents : la péninsule du Sinaï est en Asie.'),
          test: { f: 'transcontinental', eq: true },
        },
        {
          text: t('The Suez Canal crosses it.', 'Der Suezkanal verläuft durch das Land.', 'Il canale di Suez lo attraversa.', 'El canal de Suez lo atraviesa.', 'Le canal de Suez le traverse.'),
          test: { f: 'landmarks', has: 'suez-canal' },
        },
        capital('Cairo', 'Kairo', 'Il Cairo', 'El Cairo', 'Le Caire'),
      ],
      fact: t(
        'The Great Pyramid of Giza was the tallest human-made structure on Earth for thousands of years.',
        'Die Cheops-Pyramide war Jahrtausende lang das höchste Bauwerk der Welt.',
        'La Grande Piramide di Giza è stata per millenni la costruzione più alta del mondo.',
        'La Gran Pirámide de Guiza fue durante milenios la construcción más alta del mundo.',
        'La grande pyramide de Gizeh fut pendant des millénaires la plus haute construction du monde.',
      ),
    },
    {
      id: 'ZAF',
      geo: '710',
      tier: 1,
      names: t('South Africa', 'Südafrika', 'Sudafrica', 'Sudáfrica', 'Afrique du Sud'),
      facts: { continent: 'africa', hemisphere: 'south', drive: 'left', flag: ['red', 'blue', 'green', 'black', 'yellow', 'white'], lang: ['afrikaans', 'english', 'ndebele', 'sepedi', 'sesotho', 'swati', 'tsonga', 'tswana', 'venda', 'xhosa', 'zulu', 'sign'], neighbours: ['NAM', 'BWA', 'ZWE', 'MOZ', 'SWZ', 'LSO'], enclaves: ['LSO'], coast: ['atlantic', 'indian'], capital: ['Pretoria', 'Cape Town', 'Bloemfontein'], landmarks: ['table-mountain'] },
      clues: [
        {
          text: t('Its coasts face both the Atlantic and the Indian Ocean.', 'Seine Küsten liegen am Atlantik und am Indischen Ozean.', 'Le sue coste si affacciano sia sull’Atlantico sia sull’Oceano Indiano.', 'Sus costas dan al Atlántico y al océano Índico.', 'Ses côtes donnent sur l’Atlantique et sur l’océan Indien.'),
          test: { f: 'coast', all: ['atlantic', 'indian'] },
        },
        {
          text: t('Its flag has six colours.', 'Seine Flagge hat sechs Farben.', 'La sua bandiera ha sei colori.', 'Su bandera tiene seis colores.', 'Son drapeau compte six couleurs.'),
          test: { f: 'flag', count: 6 },
        },
        {
          text: t('Another country, Lesotho, lies entirely inside it.', 'Ein anderes Land, Lesotho, liegt vollständig in seinem Gebiet.', 'Un altro paese, il Lesotho, si trova interamente al suo interno.', 'Otro país, Lesoto, se encuentra completamente dentro de él.', 'Un autre pays, le Lesotho, est entièrement enclavé dans son territoire.'),
          test: { f: 'enclaves', has: 'LSO' },
        },
        {
          text: t('Table Mountain overlooks one of its cities.', 'Der Tafelberg überragt eine seiner Städte.', 'La Table Mountain domina una delle sue città.', 'La Montaña de la Mesa domina una de sus ciudades.', 'La montagne de la Table domine l’une de ses villes.'),
          test: { f: 'landmarks', has: 'table-mountain' },
        },
        {
          text: t('It has three capitals: Pretoria, Cape Town and Bloemfontein.', 'Es hat drei Hauptstädte: Pretoria, Kapstadt und Bloemfontein.', 'Ha tre capitali: Pretoria, Città del Capo e Bloemfontein.', 'Tiene tres capitales: Pretoria, Ciudad del Cabo y Bloemfontein.', 'Il a trois capitales : Pretoria, Le Cap et Bloemfontein.'),
          test: { f: 'capital', has: 'Pretoria' },
        },
      ],
      fact: t(
        'It has twelve official languages, including South African Sign Language.',
        'Es hat zwölf Amtssprachen, darunter die Südafrikanische Gebärdensprache.',
        'Ha dodici lingue ufficiali, tra cui la lingua dei segni sudafricana.',
        'Tiene doce lenguas oficiales, entre ellas la lengua de signos sudafricana.',
        'Il compte douze langues officielles, dont la langue des signes sud-africaine.',
      ),
    },
    {
      id: 'KEN',
      geo: '404',
      tier: 2,
      names: t('Kenya', 'Kenia', 'Kenya', 'Kenia', 'Kenya'),
      facts: { continent: 'africa', hemisphere: 'both', equator: true, drive: 'left', flag: ['black', 'red', 'green', 'white'], lang: ['swahili', 'english'], neighbours: ['TZA', 'UGA', 'SSD', 'ETH', 'SOM'], coast: ['indian'], capital: 'Nairobi', landmarks: ['maasai-mara', 'mount-kenya'] },
      clues: [
        EQUATOR,
        DRIVE_LEFT,
        {
          text: t('Its flag is black, red and green, with a shield and two spears.', 'Seine Flagge ist schwarz, rot und grün, mit einem Schild und zwei Speeren.', 'La sua bandiera è nera, rossa e verde, con uno scudo e due lance.', 'Su bandera es negra, roja y verde, con un escudo y dos lanzas.', 'Son drapeau est noir, rouge et vert, avec un bouclier et deux lances.'),
          test: { f: 'flag', all: ['black', 'red', 'green'] },
        },
        {
          text: t('The great wildebeest migration crosses into its Maasai Mara reserve.', 'Die große Gnuwanderung zieht in sein Maasai-Mara-Reservat.', 'La grande migrazione degli gnu arriva nella sua riserva del Masai Mara.', 'La gran migración de ñus llega a su reserva de Masái Mara.', 'La grande migration des gnous traverse sa réserve du Masai Mara.'),
          test: { f: 'landmarks', has: 'maasai-mara' },
        },
        capital('Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Nairobi'),
      ],
      fact: t(
        'The country is named after Mount Kenya, its highest peak.',
        'Das Land ist nach dem Mount Kenya benannt, seinem höchsten Berg.',
        'Il paese prende il nome dal Monte Kenya, la sua vetta più alta.',
        'El país debe su nombre al monte Kenia, su pico más alto.',
        'Le pays doit son nom au mont Kenya, son plus haut sommet.',
      ),
    },
    {
      id: 'IND',
      geo: '356',
      tier: 1,
      names: t('India', 'Indien', 'India', 'India', 'Inde'),
      aliases: ['Bharat'],
      facts: { continent: 'asia', hemisphere: 'north', drive: 'left', flag: ['orange', 'white', 'green'], lang: ['hindi', 'english'], neighbours: ['PAK', 'CHN', 'NPL', 'BTN', 'BGD', 'MMR'], coast: ['indian', 'arabian-sea', 'bay-of-bengal'], capital: 'New Delhi', timezones: 1, culture: ['diwali'], landmarks: ['taj-mahal'] },
      clues: [
        DRIVE_LEFT,
        {
          text: t('Its flag is saffron, white and green, with a blue wheel in the centre.', 'Seine Flagge ist safrangelb, weiß und grün, mit einem blauen Rad in der Mitte.', 'La sua bandiera è zafferano, bianca e verde, con una ruota blu al centro.', 'Su bandera es azafrán, blanca y verde, con una rueda azul en el centro.', 'Son drapeau est safran, blanc et vert, avec une roue bleue au centre.'),
          test: { f: 'flag', all: ['orange', 'white', 'green'] },
        },
        {
          text: t('Diwali, the festival of lights, is one of its biggest celebrations.', 'Diwali, das Lichterfest, ist eines seiner größten Feste.', 'Il Diwali, la festa delle luci, è una delle sue feste più grandi.', 'Diwali, la fiesta de las luces, es una de sus mayores celebraciones.', 'Diwali, la fête des lumières, est l’une de ses plus grandes célébrations.'),
          test: { f: 'culture', has: 'diwali' },
        },
        {
          text: t('The Taj Mahal is here.', 'Hier steht das Taj Mahal.', 'Qui si trova il Taj Mahal.', 'Aquí está el Taj Mahal.', 'Le Taj Mahal se trouve ici.'),
          test: { f: 'landmarks', has: 'taj-mahal' },
        },
        capital('New Delhi', 'Neu-Delhi', 'Nuova Delhi', 'Nueva Delhi', 'New Delhi'),
      ],
      fact: t(
        'According to UN estimates, it overtook China as the world’s most populous country in 2023.',
        'Laut UN-Schätzungen hat es 2023 China als bevölkerungsreichstes Land der Welt überholt.',
        'Secondo le stime dell’ONU, nel 2023 ha superato la Cina come paese più popoloso del mondo.',
        'Según estimaciones de la ONU, en 2023 superó a China como el país más poblado del mundo.',
        'Selon les estimations de l’ONU, il a dépassé la Chine en 2023 comme pays le plus peuplé du monde.',
      ),
    },
    {
      id: 'CHN',
      geo: '156',
      tier: 1,
      names: t('China', 'China', 'Cina', 'China', 'Chine'),
      aliases: ["People's Republic of China", 'PRC'],
      facts: { continent: 'asia', hemisphere: 'north', drive: 'right', flag: ['red', 'yellow'], lang: ['chinese'], neighbours: ['AFG', 'BTN', 'IND', 'KAZ', 'PRK', 'KGZ', 'LAO', 'MNG', 'MMR', 'NPL', 'PAK', 'RUS', 'TJK', 'VNM'], coast: ['pacific', 'yellow-sea', 'east-china-sea', 'south-china-sea'], capital: 'Beijing', timezones: 1, landmarks: ['great-wall', 'forbidden-city'] },
      clues: [
        {
          text: t('The whole country runs on a single time zone.', 'Das ganze Land hat nur eine einzige Zeitzone.', 'Tutto il paese segue un unico fuso orario.', 'Todo el país usa un único huso horario.', 'Tout le pays vit à l’heure d’un seul fuseau horaire.'),
          test: { f: 'timezones', eq: 1 },
        },
        {
          text: t('Its flag is red with five yellow stars.', 'Seine Flagge ist rot mit fünf gelben Sternen.', 'La sua bandiera è rossa con cinque stelle gialle.', 'Su bandera es roja con cinco estrellas amarillas.', 'Son drapeau est rouge avec cinq étoiles jaunes.'),
          test: { f: 'flag', all: ['red', 'yellow'] },
        },
        {
          text: t('It borders fourteen countries, tied for the most in the world.', 'Es grenzt an vierzehn Länder – ein Weltrekord, den es sich mit einem anderen Land teilt.', 'Confina con quattordici paesi, il massimo al mondo a pari merito.', 'Limita con catorce países, empatado con el que más tiene del mundo.', 'Il a quatorze voisins, un record mondial qu’il partage.'),
          test: { f: 'neighbours', count: 14 },
        },
        {
          text: t('The Great Wall winds across it.', 'Die Große Mauer zieht sich durch das Land.', 'La Grande Muraglia lo attraversa.', 'La Gran Muralla lo recorre.', 'La Grande Muraille le traverse.'),
          test: { f: 'landmarks', has: 'great-wall' },
        },
        capital('Beijing', 'Peking', 'Pechino', 'Pekín', 'Pékin'),
      ],
      fact: t(
        'Giant pandas live in the wild only here.',
        'Große Pandas leben nur hier in freier Wildbahn.',
        'I panda giganti vivono allo stato selvatico solo qui.',
        'Los pandas gigantes solo viven en libertad aquí.',
        'Les pandas géants ne vivent à l’état sauvage qu’ici.',
      ),
    },
    {
      id: 'JPN',
      geo: '392',
      tier: 1,
      names: t('Japan', 'Japan', 'Giappone', 'Japón', 'Japon'),
      mainlandOnly: true,
      facts: { continent: 'asia', hemisphere: 'north', drive: 'left', flag: ['white', 'red'], lang: ['japanese'], neighbours: [], coast: ['pacific', 'sea-of-japan'], capital: 'Tokyo', landmarks: ['mount-fuji'] },
      clues: [
        DRIVE_LEFT,
        NO_BORDERS,
        {
          text: t('Its flag is a red disc on a white field.', 'Seine Flagge zeigt eine rote Scheibe auf weißem Grund.', 'La sua bandiera è un disco rosso su sfondo bianco.', 'Su bandera es un disco rojo sobre fondo blanco.', 'Son drapeau est un disque rouge sur fond blanc.'),
          test: { f: 'flag', all: ['white', 'red'] },
        },
        {
          text: t('Mount Fuji is its highest peak.', 'Der Fuji ist sein höchster Berg.', 'Il monte Fuji è la sua vetta più alta.', 'El monte Fuji es su pico más alto.', 'Le mont Fuji est son plus haut sommet.'),
          test: { f: 'landmarks', has: 'mount-fuji' },
        },
        capital('Tokyo', 'Tokio', 'Tokyo', 'Tokio', 'Tokyo'),
      ],
      fact: t(
        'A 2023 government survey counted more than 14,000 islands.',
        'Eine Regierungszählung von 2023 ergab mehr als 14.000 Inseln.',
        'Un censimento governativo del 2023 ha contato più di 14.000 isole.',
        'Un recuento oficial de 2023 contó más de 14.000 islas.',
        'Un recensement officiel de 2023 a dénombré plus de 14 000 îles.',
      ),
    },
    {
      id: 'AUS',
      geo: '036',
      tier: 1,
      names: t('Australia', 'Australien', 'Australia', 'Australia', 'Australie'),
      facts: { continent: 'oceania', hemisphere: 'south', drive: 'left', flag: ['blue', 'red', 'white'], lang: ['english'], neighbours: [], coast: ['indian', 'pacific', 'southern'], capital: 'Canberra', landmarks: ['uluru', 'sydney-opera-house'] },
      clues: [
        SOUTH,
        NO_BORDERS,
        DRIVE_LEFT,
        {
          text: t('Uluru, a huge red sandstone rock, rises from its outback.', 'Uluru, ein riesiger roter Sandsteinfelsen, ragt aus seinem Outback.', 'Uluru, un’enorme roccia di arenaria rossa, si erge nel suo outback.', 'Uluru, una enorme roca de arenisca roja, se alza en su interior desértico.', 'Uluru, un immense rocher de grès rouge, se dresse dans son outback.'),
          test: { f: 'landmarks', has: 'uluru' },
        },
        capital('Canberra', 'Canberra', 'Canberra', 'Canberra', 'Canberra'),
      ],
      fact: t(
        'It is wider from east to west than the Moon is across.',
        'Von Ost nach West ist es breiter als der Durchmesser des Mondes.',
        'Da est a ovest è più largo del diametro della Luna.',
        'De este a oeste es más ancho que el diámetro de la Luna.',
        'D’est en ouest, il est plus large que le diamètre de la Lune.',
      ),
    },
    {
      id: 'BRA',
      geo: '076',
      tier: 1,
      names: t('Brazil', 'Brasilien', 'Brasile', 'Brasil', 'Brésil'),
      aliases: ['Brasil'],
      facts: { continent: 'south-america', hemisphere: 'both', equator: true, drive: 'right', flag: ['green', 'yellow', 'blue', 'white'], lang: ['portuguese'], neighbours: ['ARG', 'BOL', 'COL', 'FRA', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'], coast: ['atlantic'], capital: 'Brasília', landmarks: ['christ-the-redeemer', 'amazon'] },
      clues: [
        EQUATOR,
        PORTUGUESE,
        {
          text: t('Its flag is green and yellow with a blue, star-filled globe.', 'Seine Flagge ist grün und gelb mit einer blauen, sternenbesetzten Kugel.', 'La sua bandiera è verde e gialla con un globo blu pieno di stelle.', 'Su bandera es verde y amarilla con un globo azul lleno de estrellas.', 'Son drapeau est vert et jaune avec un globe bleu étoilé.'),
          test: { f: 'flag', all: ['green', 'yellow', 'blue'] },
        },
        {
          text: t('The Christ the Redeemer statue looks out over one of its cities.', 'Die Christusstatue Cristo Redentor blickt über eine seiner Städte.', 'La statua del Cristo Redentore domina una delle sue città.', 'La estatua del Cristo Redentor domina una de sus ciudades.', 'La statue du Christ Rédempteur domine l’une de ses villes.'),
          test: { f: 'landmarks', has: 'christ-the-redeemer' },
        },
        capital('Brasília', 'Brasília', 'Brasília', 'Brasilia', 'Brasilia'),
      ],
      fact: t(
        'It borders every South American country except Chile and Ecuador.',
        'Es grenzt an jedes Land Südamerikas außer Chile und Ecuador.',
        'Confina con tutti i paesi del Sud America tranne Cile ed Ecuador.',
        'Limita con todos los países de Sudamérica excepto Chile y Ecuador.',
        'Il borde tous les pays d’Amérique du Sud sauf le Chili et l’Équateur.',
      ),
    },
    {
      id: 'ARG',
      geo: '032',
      tier: 1,
      names: t('Argentina', 'Argentinien', 'Argentina', 'Argentina', 'Argentine'),
      facts: { continent: 'south-america', hemisphere: 'south', drive: 'right', flag: ['blue', 'white'], lang: ['spanish'], neighbours: ['CHL', 'BOL', 'PRY', 'BRA', 'URY'], coast: ['atlantic'], capital: 'Buenos Aires', culture: ['tango'], landmarks: ['iguazu-falls'] },
      clues: [
        SOUTH,
        SPANISH,
        {
          text: t('Its flag has light blue and white stripes with a golden sun.', 'Seine Flagge hat hellblaue und weiße Streifen mit einer goldenen Sonne.', 'La sua bandiera ha strisce azzurre e bianche con un sole dorato.', 'Su bandera tiene franjas celestes y blancas con un sol dorado.', 'Son drapeau a des bandes bleu ciel et blanches avec un soleil doré.'),
          test: { f: 'flag', all: ['blue', 'white'] },
        },
        {
          text: t('Tango was born along the Río de la Plata, here and in neighbouring Uruguay.', 'Der Tango entstand am Río de la Plata, hier und im benachbarten Uruguay.', 'Il tango è nato sul Río de la Plata, qui e nel vicino Uruguay.', 'El tango nació en el Río de la Plata, aquí y en el vecino Uruguay.', 'Le tango est né sur le Río de la Plata, ici et dans l’Uruguay voisin.'),
          test: { f: 'culture', has: 'tango' },
        },
        capital('Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires'),
      ],
      fact: t(
        'Aconcagua, the highest mountain outside Asia, is here.',
        'Hier steht der Aconcagua, der höchste Berg außerhalb Asiens.',
        'Qui si trova l’Aconcagua, la montagna più alta fuori dall’Asia.',
        'Aquí está el Aconcagua, la montaña más alta fuera de Asia.',
        'L’Aconcagua, la plus haute montagne hors d’Asie, se trouve ici.',
      ),
    },
    {
      id: 'CHL',
      geo: '152',
      tier: 2,
      names: t('Chile', 'Chile', 'Cile', 'Chile', 'Chili'),
      facts: { continent: 'south-america', hemisphere: 'south', drive: 'right', flag: ['white', 'red', 'blue'], lang: ['spanish'], neighbours: ['PER', 'BOL', 'ARG'], coast: ['pacific'], capital: 'Santiago', landmarks: ['easter-island', 'atacama'] },
      clues: [
        SOUTH,
        SPANISH,
        {
          text: t('Its flag has a white star on a blue square, over white and red.', 'Seine Flagge hat einen weißen Stern auf blauem Feld, über Weiß und Rot.', 'La sua bandiera ha una stella bianca su un quadrato blu, sopra bianco e rosso.', 'Su bandera tiene una estrella blanca sobre un cuadrado azul, sobre blanco y rojo.', 'Son drapeau porte une étoile blanche sur un carré bleu, au-dessus du blanc et du rouge.'),
          test: { f: 'flag', all: ['white', 'red', 'blue'] },
        },
        {
          text: t('Easter Island, with its giant moai statues, belongs to it.', 'Die Osterinsel mit ihren riesigen Moai-Statuen gehört zu ihm.', 'L’Isola di Pasqua, con le sue enormi statue moai, gli appartiene.', 'La isla de Pascua, con sus enormes moáis, le pertenece.', 'L’île de Pâques et ses immenses statues moaï lui appartiennent.'),
          test: { f: 'landmarks', has: 'easter-island' },
        },
        capital('Santiago', 'Santiago de Chile', 'Santiago del Cile', 'Santiago', 'Santiago'),
      ],
      fact: t(
        'It is more than 4,000 km long but on average less than 200 km wide.',
        'Es ist über 4.000 km lang, aber im Schnitt keine 200 km breit.',
        'È lungo più di 4.000 km ma largo in media meno di 200 km.',
        'Mide más de 4.000 km de largo pero de media menos de 200 km de ancho.',
        'Il s’étire sur plus de 4 000 km mais fait en moyenne moins de 200 km de large.',
      ),
    },
    {
      id: 'MEX',
      geo: '484',
      tier: 1,
      names: t('Mexico', 'Mexiko', 'Messico', 'México', 'Mexique'),
      facts: { continent: 'north-america', hemisphere: 'north', drive: 'right', flag: ['green', 'white', 'red'], lang: ['spanish'], neighbours: ['USA', 'GTM', 'BLZ'], coast: ['pacific', 'gulf-of-mexico', 'caribbean'], capital: 'Mexico City', culture: ['day-of-the-dead'], landmarks: ['chichen-itza'] },
      clues: [
        {
          text: t('It shares a long land border with the United States.', 'Es hat eine lange Landgrenze mit den Vereinigten Staaten.', 'Ha un lungo confine terrestre con gli Stati Uniti.', 'Comparte una larga frontera terrestre con Estados Unidos.', 'Il partage une longue frontière terrestre avec les États-Unis.'),
          test: { f: 'neighbours', has: 'USA' },
        },
        SPANISH,
        {
          text: t('Its flag shows an eagle eating a snake, on green, white and red.', 'Seine Flagge zeigt einen Adler, der eine Schlange frisst, auf Grün, Weiß und Rot.', 'La sua bandiera mostra un’aquila che mangia un serpente, su verde, bianco e rosso.', 'Su bandera muestra un águila devorando una serpiente, sobre verde, blanco y rojo.', 'Son drapeau montre un aigle dévorant un serpent, sur vert, blanc et rouge.'),
          test: { f: 'flag', all: ['green', 'white', 'red'] },
        },
        {
          text: t('The Day of the Dead is one of its most famous celebrations.', 'Der Tag der Toten ist eines seiner berühmtesten Feste.', 'Il Giorno dei Morti è una delle sue feste più famose.', 'El Día de Muertos es una de sus celebraciones más famosas.', 'Le jour des Morts est l’une de ses fêtes les plus célèbres.'),
          test: { f: 'culture', has: 'day-of-the-dead' },
        },
        capital('Mexico City', 'Mexiko-Stadt', 'Città del Messico', 'Ciudad de México', 'Mexico'),
      ],
      fact: t(
        'Its capital is built on the bed of a former lake, Lake Texcoco.',
        'Seine Hauptstadt steht auf dem Grund eines ehemaligen Sees, des Texcoco-Sees.',
        'La sua capitale sorge sul fondo di un antico lago, il lago Texcoco.',
        'Su capital está construida sobre el lecho de un antiguo lago, el lago de Texcoco.',
        'Sa capitale est bâtie sur le lit d’un ancien lac, le lac Texcoco.',
      ),
    },
  ],
};
