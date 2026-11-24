// Facts for all 50 states, kept by hand. Sources: US Census Bureau (2020 census
// populations, Census regions, land area), USGS (highest points), state government
// sites (capitals, nicknames, admission dates), NPS (landmarks).
//
// One row per state:
//   fips      the outline key in outlines.js
//   tier      1 beginner … 4 master (how well known the place is)
//   region    US Census region: west | south | midwest | northeast
//   nb        neighbouring states (land border; the Four Corners touch counts, as usually taught)
//   borders   foreign countries it shares a land border with
//   coast     pacific | atlantic | gulf | great-lakes
//   capital, largest   cities (English names; translated in packs/i18n/<lang>.js `city`)
//   nick      nickname, kept in English in every language
//   year      year it joined the Union
//   popRank   by 2020 census population (1 = most people)
//   areaRank  by land area (1 = largest)
//   capTz     time zone of the capital: P M C E AK H
//   miss      side of the Mississippi River: west | east | both
//   river     the Mississippi flows through it or along its border
//   high      highest point in metres
//   extra     more facts used by hand-written clues (Four Corners, Rockies, DST)
export const STATES = {
  AL: { fips: '01', tier: 3, region: 'south', nb: ['FL', 'GA', 'MS', 'TN'], borders: [], coast: ['gulf'], capital: 'Montgomery', largest: 'Huntsville', nick: 'Yellowhammer State', year: 1819, popRank: 24, areaRank: 28, capTz: 'C', miss: 'east', river: false, high: 734 },
  AK: { fips: '02', tier: 1, region: 'west', nb: [], borders: ['canada'], coast: ['pacific'], capital: 'Juneau', largest: 'Anchorage', nick: 'The Last Frontier', year: 1959, popRank: 48, areaRank: 1, capTz: 'AK', miss: 'west', river: false, high: 6190 },
  AZ: { fips: '04', tier: 1, region: 'west', nb: ['CA', 'NV', 'UT', 'CO', 'NM'], borders: ['mexico'], coast: [], capital: 'Phoenix', largest: 'Phoenix', nick: 'Grand Canyon State', year: 1912, popRank: 14, areaRank: 6, capTz: 'M', miss: 'west', river: false, high: 3852, extra: { fourCorners: true, dst: false } },
  AR: { fips: '05', tier: 3, region: 'south', nb: ['LA', 'MS', 'MO', 'OK', 'TN', 'TX'], borders: [], coast: [], capital: 'Little Rock', largest: 'Little Rock', nick: 'The Natural State', year: 1836, popRank: 33, areaRank: 27, capTz: 'C', miss: 'west', river: true, high: 839 },
  CA: { fips: '06', tier: 1, region: 'west', nb: ['AZ', 'NV', 'OR'], borders: ['mexico'], coast: ['pacific'], capital: 'Sacramento', largest: 'Los Angeles', nick: 'Golden State', year: 1850, popRank: 1, areaRank: 3, capTz: 'P', miss: 'west', river: false, high: 4421 },
  CO: { fips: '08', tier: 1, region: 'west', nb: ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'], borders: [], coast: [], capital: 'Denver', largest: 'Denver', nick: 'Centennial State', year: 1876, popRank: 21, areaRank: 8, capTz: 'M', miss: 'west', river: false, high: 4401, extra: { fourCorners: true, mountains: ['rockies'] } },
  CT: { fips: '09', tier: 4, region: 'northeast', nb: ['MA', 'NY', 'RI'], borders: [], coast: ['atlantic'], capital: 'Hartford', largest: 'Bridgeport', nick: 'Constitution State', year: 1788, popRank: 29, areaRank: 48, capTz: 'E', miss: 'east', river: false, high: 725 },
  DE: { fips: '10', tier: 4, region: 'south', nb: ['MD', 'NJ', 'PA'], borders: [], coast: ['atlantic'], capital: 'Dover', largest: 'Wilmington', nick: 'The First State', year: 1787, popRank: 45, areaRank: 49, capTz: 'E', miss: 'east', river: false, high: 137 },
  FL: { fips: '12', tier: 1, region: 'south', nb: ['GA', 'AL'], borders: [], coast: ['atlantic', 'gulf'], capital: 'Tallahassee', largest: 'Jacksonville', nick: 'Sunshine State', year: 1845, popRank: 3, areaRank: 26, capTz: 'E', miss: 'east', river: false, high: 105 },
  GA: { fips: '13', tier: 2, region: 'south', nb: ['AL', 'FL', 'NC', 'SC', 'TN'], borders: [], coast: ['atlantic'], capital: 'Atlanta', largest: 'Atlanta', nick: 'Peach State', year: 1788, popRank: 8, areaRank: 21, capTz: 'E', miss: 'east', river: false, high: 1458 },
  HI: { fips: '15', tier: 1, region: 'west', nb: [], borders: [], coast: ['pacific'], capital: 'Honolulu', largest: 'Honolulu', nick: 'Aloha State', year: 1959, popRank: 40, areaRank: 47, capTz: 'H', miss: 'west', river: false, high: 4207, extra: { dst: false } },
  ID: { fips: '16', tier: 3, region: 'west', nb: ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'], borders: ['canada'], coast: [], capital: 'Boise', largest: 'Boise', nick: 'Gem State', year: 1890, popRank: 38, areaRank: 11, capTz: 'M', miss: 'west', river: false, high: 3859, extra: { mountains: ['rockies'] } },
  IL: { fips: '17', tier: 2, region: 'midwest', nb: ['IN', 'IA', 'KY', 'MO', 'WI'], borders: [], coast: ['great-lakes'], capital: 'Springfield', largest: 'Chicago', nick: 'Prairie State', year: 1818, popRank: 6, areaRank: 24, capTz: 'C', miss: 'east', river: true, high: 376 },
  IN: { fips: '18', tier: 4, region: 'midwest', nb: ['IL', 'KY', 'MI', 'OH'], borders: [], coast: ['great-lakes'], capital: 'Indianapolis', largest: 'Indianapolis', nick: 'Hoosier State', year: 1816, popRank: 17, areaRank: 38, capTz: 'E', miss: 'east', river: false, high: 383 },
  IA: { fips: '19', tier: 3, region: 'midwest', nb: ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'], borders: [], coast: [], capital: 'Des Moines', largest: 'Des Moines', nick: 'Hawkeye State', year: 1846, popRank: 31, areaRank: 23, capTz: 'C', miss: 'west', river: true, high: 509 },
  KS: { fips: '20', tier: 3, region: 'midwest', nb: ['CO', 'MO', 'NE', 'OK'], borders: [], coast: [], capital: 'Topeka', largest: 'Wichita', nick: 'Sunflower State', year: 1861, popRank: 35, areaRank: 13, capTz: 'C', miss: 'west', river: false, high: 1232 },
  KY: { fips: '21', tier: 3, region: 'south', nb: ['IL', 'IN', 'MO', 'OH', 'TN', 'VA', 'WV'], borders: [], coast: [], capital: 'Frankfort', largest: 'Louisville', nick: 'Bluegrass State', year: 1792, popRank: 26, areaRank: 36, capTz: 'E', miss: 'east', river: true, high: 1263 },
  LA: { fips: '22', tier: 1, region: 'south', nb: ['TX', 'AR', 'MS'], borders: [], coast: ['gulf'], capital: 'Baton Rouge', largest: 'New Orleans', nick: 'Pelican State', year: 1812, popRank: 25, areaRank: 33, capTz: 'C', miss: 'both', river: true, high: 163 },
  ME: { fips: '23', tier: 4, region: 'northeast', nb: ['NH'], borders: ['canada'], coast: ['atlantic'], capital: 'Augusta', largest: 'Portland', nick: 'Pine Tree State', year: 1820, popRank: 42, areaRank: 39, capTz: 'E', miss: 'east', river: false, high: 1606 },
  MD: { fips: '24', tier: 4, region: 'south', nb: ['DE', 'PA', 'VA', 'WV'], borders: [], coast: ['atlantic'], capital: 'Annapolis', largest: 'Baltimore', nick: 'Old Line State', year: 1788, popRank: 18, areaRank: 42, capTz: 'E', miss: 'east', river: false, high: 1024 },
  MA: { fips: '25', tier: 2, region: 'northeast', nb: ['CT', 'NH', 'NY', 'RI', 'VT'], borders: [], coast: ['atlantic'], capital: 'Boston', largest: 'Boston', nick: 'Bay State', year: 1788, popRank: 15, areaRank: 45, capTz: 'E', miss: 'east', river: false, high: 1063 },
  MI: { fips: '26', tier: 1, region: 'midwest', nb: ['OH', 'IN', 'WI'], borders: [], coast: ['great-lakes'], capital: 'Lansing', largest: 'Detroit', nick: 'Great Lakes State', year: 1837, popRank: 10, areaRank: 22, capTz: 'E', miss: 'east', river: false, high: 603 },
  MN: { fips: '27', tier: 2, region: 'midwest', nb: ['IA', 'ND', 'SD', 'WI'], borders: ['canada'], coast: ['great-lakes'], capital: 'Saint Paul', largest: 'Minneapolis', nick: 'North Star State', year: 1858, popRank: 22, areaRank: 14, capTz: 'C', miss: 'both', river: true, high: 701 },
  MS: { fips: '28', tier: 3, region: 'south', nb: ['AL', 'AR', 'LA', 'TN'], borders: [], coast: ['gulf'], capital: 'Jackson', largest: 'Jackson', nick: 'Magnolia State', year: 1817, popRank: 34, areaRank: 31, capTz: 'C', miss: 'east', river: true, high: 246 },
  MO: { fips: '29', tier: 3, region: 'midwest', nb: ['AR', 'IL', 'IA', 'KS', 'KY', 'NE', 'OK', 'TN'], borders: [], coast: [], capital: 'Jefferson City', largest: 'Kansas City', nick: 'Show-Me State', year: 1821, popRank: 19, areaRank: 18, capTz: 'C', miss: 'west', river: true, high: 540 },
  MT: { fips: '30', tier: 3, region: 'west', nb: ['ID', 'ND', 'SD', 'WY'], borders: ['canada'], coast: [], capital: 'Helena', largest: 'Billings', nick: 'Treasure State', year: 1889, popRank: 44, areaRank: 4, capTz: 'M', miss: 'west', river: false, high: 3904, extra: { mountains: ['rockies'] } },
  NE: { fips: '31', tier: 3, region: 'midwest', nb: ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'], borders: [], coast: [], capital: 'Lincoln', largest: 'Omaha', nick: 'Cornhusker State', year: 1867, popRank: 37, areaRank: 15, capTz: 'C', miss: 'west', river: false, high: 1654 },
  NV: { fips: '32', tier: 1, region: 'west', nb: ['AZ', 'CA', 'ID', 'OR', 'UT'], borders: [], coast: [], capital: 'Carson City', largest: 'Las Vegas', nick: 'Silver State', year: 1864, popRank: 32, areaRank: 7, capTz: 'P', miss: 'west', river: false, high: 4007 },
  NH: { fips: '33', tier: 4, region: 'northeast', nb: ['ME', 'MA', 'VT'], borders: ['canada'], coast: ['atlantic'], capital: 'Concord', largest: 'Manchester', nick: 'Granite State', year: 1788, popRank: 41, areaRank: 44, capTz: 'E', miss: 'east', river: false, high: 1917 },
  NJ: { fips: '34', tier: 2, region: 'northeast', nb: ['DE', 'NY', 'PA'], borders: [], coast: ['atlantic'], capital: 'Trenton', largest: 'Newark', nick: 'Garden State', year: 1787, popRank: 11, areaRank: 46, capTz: 'E', miss: 'east', river: false, high: 550 },
  NM: { fips: '35', tier: 2, region: 'west', nb: ['AZ', 'CO', 'OK', 'TX', 'UT'], borders: ['mexico'], coast: [], capital: 'Santa Fe', largest: 'Albuquerque', nick: 'Land of Enchantment', year: 1912, popRank: 36, areaRank: 5, capTz: 'M', miss: 'west', river: false, high: 4011, extra: { fourCorners: true, mountains: ['rockies'] } },
  NY: { fips: '36', tier: 1, region: 'northeast', nb: ['VT', 'MA', 'CT', 'NJ', 'PA'], borders: ['canada'], coast: ['atlantic', 'great-lakes'], capital: 'Albany', largest: 'New York City', nick: 'Empire State', year: 1788, popRank: 4, areaRank: 30, capTz: 'E', miss: 'east', river: false, high: 1629 },
  NC: { fips: '37', tier: 2, region: 'south', nb: ['GA', 'SC', 'TN', 'VA'], borders: [], coast: ['atlantic'], capital: 'Raleigh', largest: 'Charlotte', nick: 'Tar Heel State', year: 1789, popRank: 9, areaRank: 29, capTz: 'E', miss: 'east', river: false, high: 2037 },
  ND: { fips: '38', tier: 3, region: 'midwest', nb: ['MN', 'MT', 'SD'], borders: ['canada'], coast: [], capital: 'Bismarck', largest: 'Fargo', nick: 'Peace Garden State', year: 1889, popRank: 47, areaRank: 17, capTz: 'C', miss: 'west', river: false, high: 1069 },
  OH: { fips: '39', tier: 2, region: 'midwest', nb: ['IN', 'KY', 'MI', 'PA', 'WV'], borders: [], coast: ['great-lakes'], capital: 'Columbus', largest: 'Columbus', nick: 'Buckeye State', year: 1803, popRank: 7, areaRank: 35, capTz: 'E', miss: 'east', river: false, high: 472 },
  OK: { fips: '40', tier: 2, region: 'south', nb: ['AR', 'CO', 'KS', 'MO', 'NM', 'TX'], borders: [], coast: [], capital: 'Oklahoma City', largest: 'Oklahoma City', nick: 'Sooner State', year: 1907, popRank: 28, areaRank: 19, capTz: 'C', miss: 'west', river: false, high: 1516 },
  OR: { fips: '41', tier: 2, region: 'west', nb: ['CA', 'ID', 'NV', 'WA'], borders: [], coast: ['pacific'], capital: 'Salem', largest: 'Portland', nick: 'Beaver State', year: 1859, popRank: 27, areaRank: 10, capTz: 'P', miss: 'west', river: false, high: 3429 },
  PA: { fips: '42', tier: 2, region: 'northeast', nb: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'], borders: [], coast: ['great-lakes'], capital: 'Harrisburg', largest: 'Philadelphia', nick: 'Keystone State', year: 1787, popRank: 5, areaRank: 32, capTz: 'E', miss: 'east', river: false, high: 979 },
  RI: { fips: '44', tier: 4, region: 'northeast', nb: ['CT', 'MA'], borders: [], coast: ['atlantic'], capital: 'Providence', largest: 'Providence', nick: 'Ocean State', year: 1790, popRank: 43, areaRank: 50, capTz: 'E', miss: 'east', river: false, high: 247 },
  SC: { fips: '45', tier: 3, region: 'south', nb: ['GA', 'NC'], borders: [], coast: ['atlantic'], capital: 'Columbia', largest: 'Charleston', nick: 'Palmetto State', year: 1788, popRank: 23, areaRank: 40, capTz: 'E', miss: 'east', river: false, high: 1085 },
  SD: { fips: '46', tier: 3, region: 'midwest', nb: ['IA', 'MN', 'MT', 'NE', 'ND', 'WY'], borders: [], coast: [], capital: 'Pierre', largest: 'Sioux Falls', nick: 'Mount Rushmore State', year: 1889, popRank: 46, areaRank: 16, capTz: 'C', miss: 'west', river: false, high: 2208 },
  TN: { fips: '47', tier: 2, region: 'south', nb: ['AL', 'AR', 'GA', 'KY', 'MS', 'MO', 'NC', 'VA'], borders: [], coast: [], capital: 'Nashville', largest: 'Nashville', nick: 'Volunteer State', year: 1796, popRank: 16, areaRank: 34, capTz: 'C', miss: 'east', river: true, high: 2025 },
  TX: { fips: '48', tier: 1, region: 'south', nb: ['NM', 'OK', 'AR', 'LA'], borders: ['mexico'], coast: ['gulf'], capital: 'Austin', largest: 'Houston', nick: 'Lone Star State', year: 1845, popRank: 2, areaRank: 2, capTz: 'C', miss: 'west', river: false, high: 2667 },
  UT: { fips: '49', tier: 2, region: 'west', nb: ['AZ', 'CO', 'ID', 'NV', 'NM', 'WY'], borders: [], coast: [], capital: 'Salt Lake City', largest: 'Salt Lake City', nick: 'Beehive State', year: 1896, popRank: 30, areaRank: 12, capTz: 'M', miss: 'west', river: false, high: 4123, extra: { fourCorners: true, mountains: ['rockies'] } },
  VT: { fips: '50', tier: 4, region: 'northeast', nb: ['MA', 'NH', 'NY'], borders: ['canada'], coast: [], capital: 'Montpelier', largest: 'Burlington', nick: 'Green Mountain State', year: 1791, popRank: 49, areaRank: 43, capTz: 'E', miss: 'east', river: false, high: 1339 },
  VA: { fips: '51', tier: 2, region: 'south', nb: ['KY', 'MD', 'NC', 'TN', 'WV'], borders: [], coast: ['atlantic'], capital: 'Richmond', largest: 'Virginia Beach', nick: 'Old Dominion', year: 1788, popRank: 12, areaRank: 37, capTz: 'E', miss: 'east', river: false, high: 1746 },
  WA: { fips: '53', tier: 1, region: 'west', nb: ['ID', 'OR'], borders: ['canada'], coast: ['pacific'], capital: 'Olympia', largest: 'Seattle', nick: 'Evergreen State', year: 1889, popRank: 13, areaRank: 20, capTz: 'P', miss: 'west', river: false, high: 4392 },
  WV: { fips: '54', tier: 4, region: 'south', nb: ['KY', 'MD', 'OH', 'PA', 'VA'], borders: [], coast: [], capital: 'Charleston', largest: 'Charleston', nick: 'Mountain State', year: 1863, popRank: 39, areaRank: 41, capTz: 'E', miss: 'east', river: false, high: 1482 },
  WI: { fips: '55', tier: 3, region: 'midwest', nb: ['IL', 'IA', 'MI', 'MN'], borders: [], coast: ['great-lakes'], capital: 'Madison', largest: 'Milwaukee', nick: 'Badger State', year: 1848, popRank: 20, areaRank: 25, capTz: 'C', miss: 'east', river: true, high: 595 },
  WY: { fips: '56', tier: 3, region: 'west', nb: ['CO', 'ID', 'MT', 'NE', 'SD', 'UT'], borders: [], coast: [], capital: 'Cheyenne', largest: 'Cheyenne', nick: 'Equality State', year: 1890, popRank: 50, areaRank: 9, capTz: 'M', miss: 'west', river: false, high: 4209, extra: { mountains: ['rockies'] } },
};

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });

/* Names, a landmark (for the give-away clue "You can visit … here") and a fun fact
   for the 40 states added to the 10 of the starter set. The other eight languages
   live in packs/i18n/<lang>.js (us: 'XX.names', 'vocab.landmark.XX', 'XX.fact'). */
export const MORE = {
  AL: {
    names: t('Alabama', 'Alabama', 'Alabama', 'Alabama', 'Alabama'),
    landmark: t('the U.S. Space & Rocket Center', 'das U.S. Space & Rocket Center', 'lo U.S. Space & Rocket Center', 'el U.S. Space & Rocket Center', 'l’U.S. Space & Rocket Center'),
    fact: t('The Saturn V rocket that carried astronauts to the Moon was designed in its city of Huntsville.', 'Die Saturn-V-Rakete, die Astronauten zum Mond brachte, wurde in seiner Stadt Huntsville entwickelt.', 'Il razzo Saturn V che portò gli astronauti sulla Luna fu progettato nella sua città di Huntsville.', 'El cohete Saturno V que llevó a los astronautas a la Luna se diseñó en su ciudad de Huntsville.', 'La fusée Saturn V qui emmena les astronautes sur la Lune fut conçue dans sa ville de Huntsville.'),
  },
  AK: {
    names: t('Alaska', 'Alaska', 'Alaska', 'Alaska', 'Alaska'),
    landmark: t('Denali, North America’s highest peak', 'den Denali, den höchsten Berg Nordamerikas', 'il Denali, la vetta più alta del Nord America', 'el Denali, la cumbre más alta de América del Norte', 'le Denali, plus haut sommet d’Amérique du Nord'),
    fact: t('It is more than twice the size of Texas.', 'Es ist mehr als doppelt so groß wie Texas.', 'È più di due volte più grande del Texas.', 'Es más del doble de grande que Texas.', 'Il est plus de deux fois plus grand que le Texas.'),
  },
  AR: {
    names: t('Arkansas', 'Arkansas', 'Arkansas', 'Arkansas', 'Arkansas'),
    landmark: t('Hot Springs National Park', 'den Hot-Springs-Nationalpark', 'il parco nazionale di Hot Springs', 'el parque nacional Hot Springs', 'le parc national de Hot Springs'),
    fact: t('At Crater of Diamonds State Park, visitors may keep any diamond they find.', 'Im Crater of Diamonds State Park dürfen Besucher jeden Diamanten behalten, den sie finden.', 'Al Crater of Diamonds State Park i visitatori possono tenere ogni diamante che trovano.', 'En el parque Crater of Diamonds, los visitantes pueden quedarse con los diamantes que encuentren.', 'Au parc Crater of Diamonds, les visiteurs peuvent garder les diamants qu’ils trouvent.'),
  },
  CT: {
    names: t('Connecticut', 'Connecticut', 'Connecticut', 'Connecticut', 'Connecticut'),
    landmark: t('Yale University', 'die Yale University', 'l’Università Yale', 'la Universidad Yale', 'l’université Yale'),
    fact: t('The Hartford Courant, published since 1764, is the oldest newspaper in the US still printed today.', 'Der Hartford Courant erscheint seit 1764 und ist die älteste noch gedruckte Zeitung der USA.', 'L’Hartford Courant, pubblicato dal 1764, è il più antico giornale degli Stati Uniti ancora in stampa.', 'El Hartford Courant, publicado desde 1764, es el periódico más antiguo de EE. UU. que aún se imprime.', 'Le Hartford Courant, publié depuis 1764, est le plus ancien journal des États-Unis encore imprimé.'),
  },
  DE: {
    names: t('Delaware', 'Delaware', 'Delaware', 'Delaware', 'Delaware'),
    landmark: t('Rehoboth Beach', 'Rehoboth Beach', 'Rehoboth Beach', 'Rehoboth Beach', 'Rehoboth Beach'),
    fact: t('In 1787 it became the first state to approve the US Constitution.', '1787 stimmte es als erster Staat der US-Verfassung zu.', 'Nel 1787 fu il primo stato ad approvare la Costituzione degli Stati Uniti.', 'En 1787 fue el primer estado en aprobar la Constitución de EE. UU.', 'En 1787, il fut le premier État à approuver la Constitution américaine.'),
  },
  GA: {
    names: t('Georgia', 'Georgia', 'Georgia', 'Georgia', 'Géorgie'),
    landmark: t('Stone Mountain', 'den Stone Mountain', 'lo Stone Mountain', 'Stone Mountain', 'Stone Mountain'),
    fact: t('It grows more peanuts than any other state.', 'Kein anderer Staat baut so viele Erdnüsse an.', 'Nessun altro stato coltiva tante arachidi.', 'Ningún otro estado cultiva tantos cacahuetes.', 'Aucun autre État ne cultive autant d’arachides.'),
  },
  HI: {
    names: t('Hawaii', 'Hawaii', 'Hawaii', 'Hawái', 'Hawaï'),
    landmark: t('Pearl Harbor', 'Pearl Harbor', 'Pearl Harbor', 'Pearl Harbor', 'Pearl Harbor'),
    fact: t('It is the only state made up entirely of islands.', 'Es ist der einzige Staat, der nur aus Inseln besteht.', 'È l’unico stato formato soltanto da isole.', 'Es el único estado formado solo por islas.', 'C’est le seul État formé uniquement d’îles.'),
  },
  ID: {
    names: t('Idaho', 'Idaho', 'Idaho', 'Idaho', 'Idaho'),
    landmark: t('Craters of the Moon', 'das Lavafeld Craters of the Moon', 'il campo lavico di Craters of the Moon', 'el campo de lava Craters of the Moon', 'le champ de lave de Craters of the Moon'),
    fact: t('It grows about a third of all the potatoes in the United States.', 'Hier wächst etwa ein Drittel aller Kartoffeln der USA.', 'Qui si coltiva circa un terzo di tutte le patate degli Stati Uniti.', 'Aquí se cultiva cerca de un tercio de todas las papas de EE. UU.', 'On y cultive environ un tiers de toutes les pommes de terre des États-Unis.'),
  },
  IL: {
    names: t('Illinois', 'Illinois', 'Illinois', 'Illinois', 'Illinois'),
    landmark: t('the Willis Tower', 'den Willis Tower', 'la Willis Tower', 'la Torre Willis', 'la Willis Tower'),
    fact: t('The world’s first skyscraper was built in Chicago in 1885.', 'Der erste Wolkenkratzer der Welt wurde 1885 in Chicago gebaut.', 'Il primo grattacielo del mondo fu costruito a Chicago nel 1885.', 'El primer rascacielos del mundo se construyó en Chicago en 1885.', 'Le premier gratte-ciel du monde fut construit à Chicago en 1885.'),
  },
  IN: {
    names: t('Indiana', 'Indiana', 'Indiana', 'Indiana', 'Indiana'),
    landmark: t('the Indianapolis Motor Speedway', 'den Indianapolis Motor Speedway', 'l’Indianapolis Motor Speedway', 'el Indianapolis Motor Speedway', 'l’Indianapolis Motor Speedway'),
    fact: t('The Indianapolis 500 draws more spectators than any other one-day sporting event in the world.', 'Das Indianapolis 500 zieht mehr Zuschauer an als jedes andere eintägige Sportereignis der Welt.', 'La 500 Miglia di Indianapolis attira più spettatori di qualsiasi altro evento sportivo di un giorno al mondo.', 'Las 500 Millas de Indianápolis reúnen más público que cualquier otro evento deportivo de un día en el mundo.', 'Les 500 miles d’Indianapolis attirent plus de spectateurs que tout autre événement sportif d’un jour au monde.'),
  },
  IA: {
    names: t('Iowa', 'Iowa', 'Iowa', 'Iowa', 'Iowa'),
    landmark: t('the Field of Dreams movie site', 'den Drehort von „Feld der Träume“', 'il luogo delle riprese di «L’uomo dei sogni»', 'el lugar de rodaje de «Campo de sueños»', 'le lieu de tournage de « Jusqu’au bout du rêve »'),
    fact: t('It grows more corn than any other state.', 'Kein anderer Staat erntet so viel Mais.', 'Nessun altro stato produce tanto mais.', 'Ningún otro estado produce tanto maíz.', 'Aucun autre État ne produit autant de maïs.'),
  },
  KS: {
    names: t('Kansas', 'Kansas', 'Kansas', 'Kansas', 'Kansas'),
    landmark: t('Monument Rocks', 'die Monument Rocks', 'le Monument Rocks', 'las Monument Rocks', 'les Monument Rocks'),
    fact: t('The geographic centre of the 48 contiguous states lies here, near the town of Lebanon.', 'Hier, nahe dem Ort Lebanon, liegt der geografische Mittelpunkt der 48 zusammenhängenden Staaten.', 'Qui, vicino al paese di Lebanon, si trova il centro geografico dei 48 stati contigui.', 'Aquí, cerca del pueblo de Lebanon, está el centro geográfico de los 48 estados contiguos.', 'Le centre géographique des 48 États contigus se trouve ici, près du village de Lebanon.'),
  },
  KY: {
    names: t('Kentucky', 'Kentucky', 'Kentucky', 'Kentucky', 'Kentucky'),
    landmark: t('Mammoth Cave', 'die Mammoth Cave', 'la Mammoth Cave', 'la cueva Mammoth', 'Mammoth Cave'),
    fact: t('Mammoth Cave is the longest known cave system in the world.', 'Die Mammoth Cave ist das längste bekannte Höhlensystem der Welt.', 'La Mammoth Cave è il sistema di grotte più lungo conosciuto al mondo.', 'La cueva Mammoth es el sistema de cuevas conocido más largo del mundo.', 'Mammoth Cave est le plus long réseau de grottes connu au monde.'),
  },
  ME: {
    names: t('Maine', 'Maine', 'Maine', 'Maine', 'Maine'),
    landmark: t('Acadia National Park', 'den Acadia-Nationalpark', 'il parco nazionale di Acadia', 'el parque nacional Acadia', 'le parc national d’Acadia'),
    fact: t('It is the only state that borders just one other state.', 'Es ist der einzige Staat, der nur an einen anderen Staat grenzt.', 'È l’unico stato che confina con un solo altro stato.', 'Es el único estado que limita con un solo estado.', 'C’est le seul État qui ne touche qu’un seul autre État.'),
  },
  MD: {
    names: t('Maryland', 'Maryland', 'Maryland', 'Maryland', 'Maryland'),
    landmark: t('Fort McHenry', 'Fort McHenry', 'Fort McHenry', 'el fuerte McHenry', 'le fort McHenry'),
    fact: t('The words of the US national anthem were written after the British attack on Fort McHenry in 1814.', 'Der Text der US-Nationalhymne entstand nach dem britischen Angriff auf Fort McHenry 1814.', 'Il testo dell’inno nazionale statunitense fu scritto dopo l’attacco britannico a Fort McHenry nel 1814.', 'La letra del himno de EE. UU. se escribió tras el ataque británico al fuerte McHenry en 1814.', 'Les paroles de l’hymne américain furent écrites après l’attaque britannique du fort McHenry en 1814.'),
  },
  MA: {
    names: t('Massachusetts', 'Massachusetts', 'Massachusetts', 'Massachusetts', 'Massachusetts'),
    landmark: t('Plymouth Rock', 'den Plymouth Rock', 'la Plymouth Rock', 'la roca de Plymouth', 'le rocher de Plymouth'),
    fact: t('The Pilgrims held the first Thanksgiving harvest feast at Plymouth in 1621.', 'Die Pilgerväter feierten 1621 in Plymouth das erste Thanksgiving-Erntefest.', 'I Padri Pellegrini celebrarono il primo Thanksgiving a Plymouth nel 1621.', 'Los peregrinos celebraron el primer Día de Acción de Gracias en Plymouth en 1621.', 'Les Pères pèlerins célébrèrent le premier Thanksgiving à Plymouth en 1621.'),
  },
  MN: {
    names: t('Minnesota', 'Minnesota', 'Minnesota', 'Minnesota', 'Minnesota'),
    landmark: t('the Mall of America', 'die Mall of America', 'il Mall of America', 'el Mall of America', 'le Mall of America'),
    fact: t('It has more than 10,000 lakes, as its car number plates proudly say.', 'Es hat mehr als 10.000 Seen, wie seine Autokennzeichen stolz verkünden.', 'Ha più di 10.000 laghi, come dicono con orgoglio le sue targhe.', 'Tiene más de 10.000 lagos, como presumen sus matrículas.', 'Il compte plus de 10 000 lacs, comme le disent fièrement ses plaques d’immatriculation.'),
  },
  MS: {
    names: t('Mississippi', 'Mississippi', 'Mississippi', 'Misisipi', 'Mississippi'),
    landmark: t('the Vicksburg battlefield', 'das Schlachtfeld von Vicksburg', 'il campo di battaglia di Vicksburg', 'el campo de batalla de Vicksburg', 'le champ de bataille de Vicksburg'),
    fact: t('The teddy bear is named after President Theodore Roosevelt, who refused to shoot a bear on a hunt here in 1902.', 'Der Teddybär ist nach Präsident Theodore Roosevelt benannt, der hier 1902 auf der Jagd einen Bären verschonte.', 'L’orsacchiotto (teddy bear) prende il nome dal presidente Theodore Roosevelt, che qui nel 1902 si rifiutò di sparare a un orso.', 'El osito de peluche (teddy bear) debe su nombre al presidente Theodore Roosevelt, que aquí en 1902 se negó a disparar a un oso.', 'Le nounours (teddy bear) doit son nom au président Theodore Roosevelt, qui refusa ici en 1902 de tirer sur un ours.'),
  },
  MO: {
    names: t('Missouri', 'Missouri', 'Missouri', 'Misuri', 'Missouri'),
    landmark: t('the Gateway Arch', 'den Gateway Arch', 'il Gateway Arch', 'el Arco Gateway', 'la Gateway Arch'),
    fact: t('The Gateway Arch in St. Louis is the tallest arch in the world, at 192 metres.', 'Der Gateway Arch in St. Louis ist mit 192 Metern der höchste Bogen der Welt.', 'Il Gateway Arch di St. Louis, alto 192 metri, è l’arco più alto del mondo.', 'El Arco Gateway de San Luis, de 192 metros, es el arco más alto del mundo.', 'La Gateway Arch de Saint-Louis, haute de 192 mètres, est l’arche la plus haute du monde.'),
  },
  MT: {
    names: t('Montana', 'Montana', 'Montana', 'Montana', 'Montana'),
    landmark: t('Glacier National Park', 'den Glacier-Nationalpark', 'il parco nazionale Glacier', 'el parque nacional de los Glaciares', 'le parc national de Glacier'),
    fact: t('Its name comes from the Spanish word for “mountainous”.', 'Sein Name kommt vom spanischen Wort für „bergig“.', 'Il suo nome viene dalla parola spagnola per «montuoso».', 'Su nombre viene de la palabra española «montaña».', 'Son nom vient du mot espagnol signifiant « montagneux ».'),
  },
  NE: {
    names: t('Nebraska', 'Nebraska', 'Nebraska', 'Nebraska', 'Nebraska'),
    landmark: t('Chimney Rock', 'den Chimney Rock', 'Chimney Rock', 'Chimney Rock', 'Chimney Rock'),
    fact: t('It is the only state whose parliament has just one chamber.', 'Es ist der einzige Staat, dessen Parlament nur eine Kammer hat.', 'È l’unico stato il cui parlamento ha una sola camera.', 'Es el único estado cuyo parlamento tiene una sola cámara.', 'C’est le seul État dont le parlement n’a qu’une chambre.'),
  },
  NV: {
    names: t('Nevada', 'Nevada', 'Nevada', 'Nevada', 'Nevada'),
    landmark: t('the Las Vegas Strip', 'den Las Vegas Strip', 'la Strip di Las Vegas', 'el Strip de Las Vegas', 'le Strip de Las Vegas'),
    fact: t('About 80% of its land belongs to the federal government.', 'Rund 80 % seines Landes gehören der Bundesregierung.', 'Circa l’80% del suo territorio appartiene al governo federale.', 'Cerca del 80 % de su territorio pertenece al gobierno federal.', 'Environ 80 % de ses terres appartiennent au gouvernement fédéral.'),
  },
  NH: {
    names: t('New Hampshire', 'New Hampshire', 'New Hampshire', 'Nuevo Hampshire', 'New Hampshire'),
    landmark: t('Mount Washington', 'den Mount Washington', 'il monte Washington', 'el monte Washington', 'le mont Washington'),
    fact: t('In January 1776 it became the first colony to adopt its own constitution, months before the Declaration of Independence.', 'Im Januar 1776 gab es sich als erste Kolonie eine eigene Verfassung, Monate vor der Unabhängigkeitserklärung.', 'Nel gennaio 1776 fu la prima colonia a darsi una propria costituzione, mesi prima della Dichiarazione d’indipendenza.', 'En enero de 1776 fue la primera colonia en adoptar su propia constitución, meses antes de la Declaración de Independencia.', 'En janvier 1776, ce fut la première colonie à adopter sa propre constitution, des mois avant la Déclaration d’indépendance.'),
  },
  NJ: {
    names: t('New Jersey', 'New Jersey', 'New Jersey', 'Nueva Jersey', 'New Jersey'),
    landmark: t('the Atlantic City boardwalk', 'die Strandpromenade von Atlantic City', 'il lungomare di Atlantic City', 'el paseo marítimo de Atlantic City', 'la promenade d’Atlantic City'),
    fact: t('It is the most densely populated state.', 'Es ist der am dichtesten besiedelte Staat.', 'È lo stato più densamente popolato.', 'Es el estado más densamente poblado.', 'C’est l’État le plus densément peuplé.'),
  },
  NM: {
    names: t('New Mexico', 'New Mexico', 'Nuovo Messico', 'Nuevo México', 'Nouveau-Mexique'),
    landmark: t('Carlsbad Caverns', 'die Carlsbad Caverns', 'le Carlsbad Caverns', 'las cavernas de Carlsbad', 'les grottes de Carlsbad'),
    fact: t('Its capital, Santa Fe, founded in 1610, is the oldest state capital in the United States.', 'Seine Hauptstadt Santa Fe, gegründet 1610, ist die älteste Hauptstadt eines US-Bundesstaats.', 'La sua capitale, Santa Fe, fondata nel 1610, è la capitale statale più antica degli Stati Uniti.', 'Su capital, Santa Fe, fundada en 1610, es la capital estatal más antigua de EE. UU.', 'Sa capitale, Santa Fe, fondée en 1610, est la plus ancienne capitale d’État des États-Unis.'),
  },
  NC: {
    names: t('North Carolina', 'North Carolina', 'Carolina del Nord', 'Carolina del Norte', 'Caroline du Nord'),
    landmark: t('the Wright Brothers National Memorial', 'das Wright Brothers National Memorial', 'il Wright Brothers National Memorial', 'el Monumento Nacional a los Hermanos Wright', 'le mémorial national des frères Wright'),
    fact: t('The Wright brothers made the first powered aeroplane flight here, near Kitty Hawk, in 1903.', 'Die Brüder Wright gelang hier, bei Kitty Hawk, 1903 der erste Motorflug.', 'Qui, vicino a Kitty Hawk, i fratelli Wright compirono nel 1903 il primo volo a motore.', 'Aquí, cerca de Kitty Hawk, los hermanos Wright hicieron el primer vuelo a motor en 1903.', 'C’est ici, près de Kitty Hawk, que les frères Wright réussirent le premier vol motorisé en 1903.'),
  },
  ND: {
    names: t('North Dakota', 'North Dakota', 'Dakota del Nord', 'Dakota del Norte', 'Dakota du Nord'),
    landmark: t('Theodore Roosevelt National Park', 'den Theodore-Roosevelt-Nationalpark', 'il parco nazionale Theodore Roosevelt', 'el parque nacional Theodore Roosevelt', 'le parc national Theodore Roosevelt'),
    fact: t('It grows more sunflowers than any other state.', 'Kein anderer Staat baut so viele Sonnenblumen an.', 'Nessun altro stato coltiva tanti girasoli.', 'Ningún otro estado cultiva tantos girasoles.', 'Aucun autre État ne cultive autant de tournesols.'),
  },
  OH: {
    names: t('Ohio', 'Ohio', 'Ohio', 'Ohio', 'Ohio'),
    landmark: t('the Rock and Roll Hall of Fame', 'die Rock and Roll Hall of Fame', 'la Rock and Roll Hall of Fame', 'el Salón de la Fama del Rock and Roll', 'le Rock and Roll Hall of Fame'),
    fact: t('Seven US presidents were born here.', 'Sieben US-Präsidenten wurden hier geboren.', 'Qui sono nati sette presidenti degli Stati Uniti.', 'Aquí nacieron siete presidentes de EE. UU.', 'Sept présidents américains y sont nés.'),
  },
  OK: {
    names: t('Oklahoma', 'Oklahoma', 'Oklahoma', 'Oklahoma', 'Oklahoma'),
    landmark: t('the Blue Whale of Catoosa on Route 66', 'den Blue Whale of Catoosa an der Route 66', 'la Blue Whale of Catoosa sulla Route 66', 'la Blue Whale of Catoosa de la Ruta 66', 'la Blue Whale of Catoosa sur la Route 66'),
    fact: t('Its name comes from Choctaw words meaning “red people”.', 'Sein Name stammt aus der Sprache der Choctaw und bedeutet „rote Menschen“.', 'Il suo nome viene da parole choctaw che significano «gente rossa».', 'Su nombre viene de palabras choctaw que significan «gente roja».', 'Son nom vient de mots choctaws signifiant « peuple rouge ».'),
  },
  OR: {
    names: t('Oregon', 'Oregon', 'Oregon', 'Oregón', 'Oregon'),
    landmark: t('Crater Lake', 'den Crater Lake', 'il Crater Lake', 'el lago del Cráter', 'Crater Lake'),
    fact: t('Crater Lake, about 590 metres deep, is the deepest lake in the United States.', 'Der Crater Lake ist mit rund 590 Metern der tiefste See der USA.', 'Il Crater Lake, profondo circa 590 metri, è il lago più profondo degli Stati Uniti.', 'El lago del Cráter, de unos 590 metros, es el lago más profundo de EE. UU.', 'Crater Lake, profond d’environ 590 mètres, est le lac le plus profond des États-Unis.'),
  },
  RI: {
    names: t('Rhode Island', 'Rhode Island', 'Rhode Island', 'Rhode Island', 'Rhode Island'),
    landmark: t('the Newport mansions', 'die Villen von Newport', 'le ville di Newport', 'las mansiones de Newport', 'les demeures de Newport'),
    fact: t('It is the smallest state by area.', 'Es ist der flächenmäßig kleinste Staat.', 'È lo stato più piccolo per superficie.', 'Es el estado más pequeño por superficie.', 'C’est le plus petit État par sa superficie.'),
  },
  SC: {
    names: t('South Carolina', 'South Carolina', 'Carolina del Sud', 'Carolina del Sur', 'Caroline du Sud'),
    landmark: t('Fort Sumter', 'Fort Sumter', 'Fort Sumter', 'el fuerte Sumter', 'le fort Sumter'),
    fact: t('The first shots of the American Civil War were fired at Fort Sumter in 1861.', 'Die ersten Schüsse des Amerikanischen Bürgerkriegs fielen 1861 in Fort Sumter.', 'I primi colpi della guerra civile americana furono sparati a Fort Sumter nel 1861.', 'Los primeros disparos de la guerra de Secesión se hicieron en el fuerte Sumter en 1861.', 'Les premiers coups de feu de la guerre de Sécession furent tirés au fort Sumter en 1861.'),
  },
  SD: {
    names: t('South Dakota', 'South Dakota', 'Dakota del Sud', 'Dakota del Sur', 'Dakota du Sud'),
    landmark: t('Mount Rushmore', 'den Mount Rushmore', 'il monte Rushmore', 'el monte Rushmore', 'le mont Rushmore'),
    fact: t('Each president’s face on Mount Rushmore is about 18 metres tall.', 'Jedes Präsidentengesicht am Mount Rushmore ist etwa 18 Meter hoch.', 'Ogni volto di presidente sul monte Rushmore è alto circa 18 metri.', 'Cada rostro presidencial del monte Rushmore mide unos 18 metros.', 'Chaque visage de président du mont Rushmore mesure environ 18 mètres.'),
  },
  TN: {
    names: t('Tennessee', 'Tennessee', 'Tennessee', 'Tennessee', 'Tennessee'),
    landmark: t('Graceland, Elvis Presley’s home', 'Graceland, das Anwesen von Elvis Presley', 'Graceland, la casa di Elvis Presley', 'Graceland, la casa de Elvis Presley', 'Graceland, la demeure d’Elvis Presley'),
    fact: t('Its capital, Nashville, is known around the world as the home of country music.', 'Seine Hauptstadt Nashville ist weltweit als Heimat der Countrymusik bekannt.', 'La sua capitale, Nashville, è famosa nel mondo come patria della musica country.', 'Su capital, Nashville, es famosa en todo el mundo como la cuna de la música country.', 'Sa capitale, Nashville, est connue dans le monde entier comme la patrie de la musique country.'),
  },
  UT: {
    names: t('Utah', 'Utah', 'Utah', 'Utah', 'Utah'),
    landmark: t('Arches National Park', 'den Arches-Nationalpark', 'il parco nazionale degli Arches', 'el parque nacional Arches', 'le parc national des Arches'),
    fact: t('The Great Salt Lake is the largest saltwater lake in the Western Hemisphere.', 'Der Große Salzsee ist der größte Salzsee der westlichen Hemisphäre.', 'Il Gran Lago Salato è il più grande lago salato dell’emisfero occidentale.', 'El Gran Lago Salado es el mayor lago de agua salada del hemisferio occidental.', 'Le Grand Lac Salé est le plus grand lac salé de l’hémisphère occidental.'),
  },
  VT: {
    names: t('Vermont', 'Vermont', 'Vermont', 'Vermont', 'Vermont'),
    landmark: t('the Ben & Jerry’s ice cream factory', 'die Eisfabrik von Ben & Jerry’s', 'la fabbrica di gelati Ben & Jerry’s', 'la fábrica de helados Ben & Jerry’s', 'l’usine de glaces Ben & Jerry’s'),
    fact: t('It produces more maple syrup than any other state.', 'Kein anderer Staat produziert so viel Ahornsirup.', 'Nessun altro stato produce tanto sciroppo d’acero.', 'Ningún otro estado produce tanto jarabe de arce.', 'Aucun autre État ne produit autant de sirop d’érable.'),
  },
  VA: {
    names: t('Virginia', 'Virginia', 'Virginia', 'Virginia', 'Virginie'),
    landmark: t('Mount Vernon, George Washington’s home', 'Mount Vernon, den Landsitz George Washingtons', 'Mount Vernon, la tenuta di George Washington', 'Mount Vernon, la finca de George Washington', 'Mount Vernon, le domaine de George Washington'),
    fact: t('Eight US presidents were born here, more than in any other state.', 'Acht US-Präsidenten wurden hier geboren, mehr als in jedem anderen Staat.', 'Qui sono nati otto presidenti degli Stati Uniti, più che in qualsiasi altro stato.', 'Aquí nacieron ocho presidentes de EE. UU., más que en ningún otro estado.', 'Huit présidents américains y sont nés, plus que dans tout autre État.'),
  },
  WV: {
    names: t('West Virginia', 'West Virginia', 'Virginia Occidentale', 'Virginia Occidental', 'Virginie-Occidentale'),
    landmark: t('the New River Gorge Bridge', 'die New River Gorge Bridge', 'il New River Gorge Bridge', 'el puente New River Gorge', 'le pont de la New River Gorge'),
    fact: t('It is the only state that lies entirely within the Appalachian Mountains.', 'Es ist der einzige Staat, der ganz in den Appalachen liegt.', 'È l’unico stato che si trova interamente sui monti Appalachi.', 'Es el único estado situado por completo en los montes Apalaches.', 'C’est le seul État entièrement situé dans les Appalaches.'),
  },
  WI: {
    names: t('Wisconsin', 'Wisconsin', 'Wisconsin', 'Wisconsin', 'Wisconsin'),
    landmark: t('Lambeau Field, home of the Green Bay Packers', 'das Lambeau Field der Green Bay Packers', 'il Lambeau Field dei Green Bay Packers', 'el Lambeau Field de los Green Bay Packers', 'le Lambeau Field des Packers de Green Bay'),
    fact: t('It makes more cheese than any other state.', 'Kein anderer Staat stellt so viel Käse her.', 'Nessun altro stato produce tanto formaggio.', 'Ningún otro estado produce tanto queso.', 'Aucun autre État ne fabrique autant de fromage.'),
  },
  WY: {
    names: t('Wyoming', 'Wyoming', 'Wyoming', 'Wyoming', 'Wyoming'),
    landmark: t('the Old Faithful geyser', 'den Geysir Old Faithful', 'il geyser Old Faithful', 'el géiser Old Faithful', 'le geyser Old Faithful'),
    fact: t('In 1869 it became the first territory to give women the right to vote.', '1869 gab es als erstes Territorium den Frauen das Wahlrecht.', 'Nel 1869 fu il primo territorio a dare il voto alle donne.', 'En 1869 fue el primer territorio en dar el voto a las mujeres.', 'En 1869, ce fut le premier territoire à accorder le droit de vote aux femmes.'),
  },
};
