// Clue pools: Portugal, Spain, France, Italy, Germany. 20 clues each, 4 per tier
// (1 = hardest … 5 = gives it away). Each round shows one clue per tier.
// [tier, 'template', param] uses templates.js; [tier, 'slug', text] is written out.

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });

export default {
  PRT: {
    facts: { capital: 'lisbon', currency: 'euro', eu: true, monarchy: false, cities: ['lisbon', 'porto'] },
    clues: [
      [1, 'drive_right'], [1, 'republic'], [1, 'north'], [1, 'continent', 'europe'],
      [2, 'eu'], [2, 'currency', 'euro'], [2, 'coast', 'atlantic'],
      [2, 'navigators', t('Its navigators were the first Europeans to reach India by sea.', 'Seine Seefahrer erreichten als erste Europäer Indien auf dem Seeweg.', 'I suoi navigatori furono i primi europei a raggiungere l’India per mare.', 'Sus navegantes fueron los primeros europeos en llegar a la India por mar.', 'Ses navigateurs furent les premiers Européens à atteindre l’Inde par la mer.')],
      [3, 'one_border'], [3, 'lang', 'portuguese'],
      [3, 'cork', t('It produces about half of all the world’s cork.', 'Es produziert etwa die Hälfte des Korks der Welt.', 'Produce circa la metà del sughero di tutto il mondo.', 'Produce cerca de la mitad del corcho del mundo.', 'Il produit environ la moitié du liège mondial.')],
      [3, 'fado', t('Fado, a melancholic style of song, was born here.', 'Hier entstand der Fado, ein melancholischer Gesangsstil.', 'Qui è nato il fado, un genere di canto malinconico.', 'Aquí nació el fado, un estilo de canción melancólico.', 'Le fado, un chant mélancolique, est né ici.')],
      [4, 'border', 'ESP'], [4, 'city', 'porto'],
      [4, 'nata', t('Custard tarts called pastéis de nata come from here.', 'Die Puddingtörtchen Pastéis de Nata stammen von hier.', 'Da qui vengono le tortine alla crema chiamate pastéis de nata.', 'De aquí son los pastelitos de crema llamados pastéis de nata.', 'Les tartelettes à la crème appelées pastéis de nata viennent d’ici.')],
      [4, 'madeira-ronaldo', t('Cristiano Ronaldo was born on its island of Madeira.', 'Cristiano Ronaldo wurde auf seiner Insel Madeira geboren.', 'Cristiano Ronaldo è nato sulla sua isola di Madera.', 'Cristiano Ronaldo nació en su isla de Madeira.', 'Cristiano Ronaldo est né sur son île de Madère.')],
      [5, 'capital', 'lisbon'],
      [5, 'azores', t('The Azores, islands far out in the Atlantic, belong to it.', 'Die Azoren, Inseln weit draußen im Atlantik, gehören zu ihm.', 'Le Azzorre, isole in pieno Atlantico, gli appartengono.', 'Las Azores, islas en pleno Atlántico, le pertenecen.', 'Les Açores, des îles en plein Atlantique, lui appartiennent.')],
      [5, 'belem', t('The Belém Tower stands on the river Tagus here.', 'Hier steht der Turm von Belém am Fluss Tejo.', 'Qui la Torre di Belém sorge sul fiume Tago.', 'Aquí la Torre de Belém se alza sobre el río Tajo.', 'Ici, la tour de Belém se dresse sur le Tage.')],
      [5, 'algarve', t('Its sunny southern coast is called the Algarve.', 'Seine sonnige Südküste heißt Algarve.', 'La sua soleggiata costa meridionale si chiama Algarve.', 'Su soleada costa sur se llama el Algarve.', 'Sa côte sud ensoleillée s’appelle l’Algarve.')],
    ],
  },
  ESP: {
    facts: { capital: 'madrid', currency: 'euro', eu: true, monarchy: true, summerOlympics: true, worldCup: true, cities: ['madrid', 'barcelona', 'seville'] },
    clues: [
      [1, 'drive_right'], [1, 'monarchy'], [1, 'olympics'], [1, 'north'],
      [2, 'eu'], [2, 'currency', 'euro'], [2, 'worldcup'], [2, 'coast', 'mediterranean'],
      [3, 'borders_n', 4], [3, 'lang', 'spanish'],
      [3, 'tomatina', t('A town here holds a festival where people pelt each other with tomatoes.', 'Eine Stadt hier feiert ein Fest, bei dem sich alle mit Tomaten bewerfen.', 'Una cittadina qui celebra una festa in cui ci si tira pomodori.', 'Un pueblo de aquí celebra una fiesta en la que la gente se lanza tomates.', 'Une ville d’ici fête un festival où l’on se bombarde de tomates.')],
      [3, 'canaries', t('Its Canary Islands lie off the coast of Africa.', 'Seine Kanarischen Inseln liegen vor der Küste Afrikas.', 'Le sue isole Canarie si trovano al largo dell’Africa.', 'Sus islas Canarias están frente a la costa de África.', 'Ses îles Canaries se trouvent au large de l’Afrique.')],
      [4, 'border', 'AND'], [4, 'city', 'barcelona'], [4, 'city', 'seville'],
      [4, 'paella', t('Paella, the rice dish from Valencia, comes from here.', 'Die Paella, das Reisgericht aus Valencia, stammt von hier.', 'La paella, il piatto di riso di Valencia, viene da qui.', 'La paella, el plato de arroz valenciano, es de aquí.', 'La paella, le plat de riz de Valence, vient d’ici.')],
      [5, 'capital', 'madrid'],
      [5, 'alhambra', t('The Alhambra palace in Granada is here.', 'Hier steht die Alhambra in Granada.', 'Qui si trova l’Alhambra di Granada.', 'Aquí está la Alhambra de Granada.', 'L’Alhambra de Grenade se trouve ici.')],
      [5, 'sagrada', t('Gaudí’s Sagrada Família basilica stands here.', 'Hier steht Gaudís Basilika Sagrada Família.', 'Qui sorge la basilica della Sagrada Família di Gaudí.', 'Aquí se alza la basílica de la Sagrada Familia de Gaudí.', 'La basilique de la Sagrada Família de Gaudí se dresse ici.')],
      [5, 'flamenco', t('Flamenco music and dance come from its south.', 'Flamenco-Musik und -Tanz stammen aus seinem Süden.', 'La musica e la danza flamenco vengono dal suo sud.', 'El cante y el baile flamenco vienen de su sur.', 'La musique et la danse flamenco viennent de son sud.')],
    ],
  },
  FRA: {
    facts: { capital: 'paris', currency: 'euro', eu: true, monarchy: false, summerOlympics: true, worldCup: true, cities: ['paris', 'marseille', 'lyon'] },
    clues: [
      [1, 'drive_right'], [1, 'republic'], [1, 'olympics'], [1, 'worldcup'],
      [2, 'eu'], [2, 'currency', 'euro'], [2, 'coast', 'mediterranean'], [2, 'flag_is', ['blue', 'white', 'red']],
      [3, 'border', 'BRA'], [3, 'lang', 'french'],
      [3, 'tour-de-france', t('The world’s most famous cycling race is named after it.', 'Das berühmteste Radrennen der Welt ist nach ihm benannt.', 'La corsa ciclistica più famosa del mondo porta il suo nome.', 'La carrera ciclista más famosa del mundo lleva su nombre.', 'La course cycliste la plus célèbre du monde porte son nom.')],
      [3, 'champagne', t('Sparkling wine may only be called champagne if it comes from a region here.', 'Schaumwein darf nur Champagner heißen, wenn er aus einer Region hier stammt.', 'Uno spumante può chiamarsi champagne solo se viene da una sua regione.', 'Un vino espumoso solo puede llamarse champán si viene de una región de aquí.', 'Un vin mousseux ne peut s’appeler champagne que s’il vient d’une de ses régions.')],
      [4, 'border', 'BEL'], [4, 'city', 'marseille'], [4, 'city', 'lyon'],
      [4, 'mont-saint-michel', t('The island abbey of Mont-Saint-Michel is here.', 'Hier liegt die Inselabtei Mont-Saint-Michel.', 'Qui si trova l’abbazia sull’isola di Mont-Saint-Michel.', 'Aquí está la abadía insular del Mont-Saint-Michel.', 'L’abbaye du Mont-Saint-Michel se trouve ici.')],
      [5, 'capital', 'paris'],
      [5, 'eiffel', t('The Eiffel Tower stands here.', 'Hier steht der Eiffelturm.', 'Qui si trova la Torre Eiffel.', 'Aquí está la Torre Eiffel.', 'La tour Eiffel se dresse ici.')],
      [5, 'louvre', t('The Louvre, home of the Mona Lisa, is here.', 'Hier ist der Louvre, das Museum der Mona Lisa.', 'Qui si trova il Louvre, dove è esposta la Gioconda.', 'Aquí está el Louvre, hogar de la Mona Lisa.', 'Le Louvre, où est exposée la Joconde, se trouve ici.')],
      [5, 'versailles', t('The Palace of Versailles is here.', 'Hier steht das Schloss Versailles.', 'Qui si trova la Reggia di Versailles.', 'Aquí está el Palacio de Versalles.', 'Le château de Versailles se trouve ici.')],
    ],
  },
  ITA: {
    facts: { capital: 'rome', currency: 'euro', eu: true, monarchy: false, summerOlympics: true, worldCup: true, cities: ['rome', 'milan', 'naples', 'venice'] },
    clues: [
      [1, 'drive_right'], [1, 'republic'], [1, 'olympics'], [1, 'coast', 'mediterranean'],
      [2, 'eu'], [2, 'currency', 'euro'], [2, 'worldcup'], [2, 'flag_is', ['green', 'white', 'red']],
      [3, 'two-enclaves', t('Two independent countries lie entirely within its borders.', 'Zwei unabhängige Staaten liegen vollständig in seinem Gebiet.', 'Due stati indipendenti si trovano interamente al suo interno.', 'Dos países independientes se encuentran completamente dentro de él.', 'Deux pays indépendants sont entièrement enclavés dans son territoire.')],
      [3, 'lang', 'italian'], [3, 'border', 'AUT'],
      [3, 'opera', t('Opera as an art form was born here.', 'Die Oper als Kunstform entstand hier.', 'L’opera lirica come forma d’arte è nata qui.', 'La ópera como arte nació aquí.', 'L’opéra en tant qu’art est né ici.')],
      [4, 'city', 'milan'], [4, 'city', 'naples'],
      [4, 'etna', t('The volcanoes Etna and Vesuvius are here.', 'Hier liegen die Vulkane Ätna und Vesuv.', 'Qui si trovano i vulcani Etna e Vesuvio.', 'Aquí están los volcanes Etna y Vesubio.', 'Les volcans Etna et Vésuve se trouvent ici.')],
      [4, 'pizza', t('Pizza comes from here.', 'Die Pizza stammt von hier.', 'La pizza viene da qui.', 'La pizza es de aquí.', 'La pizza vient d’ici.')],
      [5, 'capital', 'rome'], [5, 'city', 'venice'],
      [5, 'colosseum', t('The Colosseum stands in its capital.', 'Das Kolosseum steht in seiner Hauptstadt.', 'Il Colosseo si trova nella sua capitale.', 'El Coliseo está en su capital.', 'Le Colisée se dresse dans sa capitale.')],
      [5, 'pisa', t('The Leaning Tower of Pisa is here.', 'Hier steht der Schiefe Turm von Pisa.', 'Qui si trova la Torre pendente di Pisa.', 'Aquí está la torre inclinada de Pisa.', 'La tour penchée de Pise se trouve ici.')],
    ],
  },
  DEU: {
    facts: { capital: 'berlin', currency: 'euro', eu: true, monarchy: false, summerOlympics: true, worldCup: true, cities: ['berlin', 'munich', 'hamburg'] },
    clues: [
      [1, 'drive_right'], [1, 'republic'], [1, 'olympics'], [1, 'worldcup'],
      [2, 'eu'], [2, 'currency', 'euro'], [2, 'borders_n', 9], [2, 'coast', 'baltic'],
      [3, 'flag-brg', t('Its flag is black, red and gold.', 'Seine Flagge ist schwarz, rot und gold.', 'La sua bandiera è nera, rossa e oro.', 'Su bandera es negra, roja y dorada.', 'Son drapeau est noir, rouge et or.')],
      [3, 'lang', 'german'], [3, 'coast', 'north-sea'],
      [3, 'autobahn', t('Long stretches of its motorways have no general speed limit.', 'Auf langen Abschnitten seiner Autobahnen gibt es kein allgemeines Tempolimit.', 'Lunghi tratti delle sue autostrade non hanno un limite di velocità generale.', 'Largos tramos de sus autopistas no tienen límite general de velocidad.', 'De longs tronçons de ses autoroutes n’ont pas de limitation générale de vitesse.')],
      [4, 'border', 'POL'], [4, 'city', 'munich'], [4, 'city', 'hamburg'],
      [4, 'oktoberfest', t('Oktoberfest is held here every year.', 'Hier findet jedes Jahr das Oktoberfest statt.', 'Qui si tiene ogni anno l’Oktoberfest.', 'Aquí se celebra cada año el Oktoberfest.', 'L’Oktoberfest a lieu ici chaque année.')],
      [5, 'capital', 'berlin'],
      [5, 'brandenburg', t('The Brandenburg Gate stands in its capital.', 'Das Brandenburger Tor steht in seiner Hauptstadt.', 'La Porta di Brandeburgo si trova nella sua capitale.', 'La Puerta de Brandeburgo está en su capital.', 'La porte de Brandebourg se dresse dans sa capitale.')],
      [5, 'neuschwanstein', t('Neuschwanstein, the fairy-tale castle, is here.', 'Hier steht das Märchenschloss Neuschwanstein.', 'Qui si trova Neuschwanstein, il castello delle fiabe.', 'Aquí está Neuschwanstein, el castillo de cuento de hadas.', 'Neuschwanstein, le château de conte de fées, se trouve ici.')],
      [5, 'berlin-wall', t('A wall once divided its capital into East and West.', 'Eine Mauer teilte einst seine Hauptstadt in Ost und West.', 'Un muro un tempo divideva la sua capitale in Est e Ovest.', 'Un muro dividió una vez su capital en Este y Oeste.', 'Un mur divisait autrefois sa capitale en Est et Ouest.')],
    ],
  },
};
