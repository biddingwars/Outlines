// Hand-kept facts the open data set does not carry (ISO 3166-1 alpha-2 codes).
// Each list is public record; keep it current (sources in docs/SOURCES.md).

// Countries that drive on the left.
export const DRIVE_LEFT = ['GB', 'IE', 'MT', 'CY', 'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'TH', 'MY', 'SG', 'BN', 'ID', 'TL', 'JP', 'AU', 'NZ', 'PG', 'FJ', 'SB', 'TO', 'WS', 'TV', 'KI', 'NR', 'ZA', 'LS', 'SZ', 'BW', 'NA', 'ZW', 'ZM', 'MW', 'MZ', 'TZ', 'KE', 'UG', 'MU', 'SC', 'JM', 'BS', 'BB', 'TT', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'GY', 'SR'];

// Head of state is a monarch (including the realms of King Charles III).
export const MONARCHY = ['GB', 'NO', 'SE', 'DK', 'NL', 'BE', 'LU', 'LI', 'MC', 'ES', 'JP', 'TH', 'MY', 'BN', 'KH', 'BT', 'JO', 'SA', 'KW', 'BH', 'QA', 'OM', 'MA', 'SZ', 'LS', 'TO', 'AU', 'NZ', 'CA', 'JM', 'BS', 'BZ', 'AG', 'GD', 'KN', 'LC', 'VC', 'PG', 'SB', 'TV'];
// Neither a plain monarchy nor a republic: no clue either way.
export const GOV_UNCLEAR = ['AD', 'VA', 'AE'];

export const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

// Hosts of the Summer Olympic Games (Moscow 1980 counted for Russia).
export const SUMMER_OLYMPICS = ['GR', 'FR', 'US', 'GB', 'SE', 'BE', 'NL', 'DE', 'FI', 'AU', 'IT', 'JP', 'MX', 'CA', 'RU', 'KR', 'ES', 'CN', 'BR'];

// Winners of the men's football World Cup.
export const WORLD_CUP = ['BR', 'DE', 'IT', 'AR', 'FR', 'UY', 'ES'];

// Capitals the data set gets wrong (it lists the seat of government or the
// largest city). Official capitals, from the national constitutions.
const same = (n) => ({ en: n, de: n, it: n, es: n, fr: n });
export const CAPITAL_FIX = {
  BEN: same('Porto-Novo'),
  BDI: same('Gitega'),
  CIV: same('Yamoussoukro'),
  NLD: { en: 'Amsterdam', de: 'Amsterdam', it: 'Amsterdam', es: 'Ámsterdam', fr: 'Amsterdam' },
  PLW: same('Ngerulmud'),
};
// Split, disputed or unofficial capitals: no capital clue at all.
export const NO_CAPITAL = ['BOL', 'LKA', 'ISR', 'SWZ', 'NRU'];

// Names players type that the data does not list: abbreviations, old and short names
// (bug hunt, Nov 2026: "USA", "UAE", "DRC", "Czech Republic" were not recognised).
export const ALIASES = {
  USA: ['USA', 'U.S.A.', 'US', 'United States of America', 'America'],
  ARE: ['UAE', 'Emirates'],
  COD: ['DRC', 'DR Congo', 'Congo-Kinshasa', 'Zaire'],
  COG: ['Republic of the Congo', 'Republic of Congo', 'Congo-Brazzaville', 'Congo Republic'],
  CZE: ['Czech Republic', 'Czechia'],
  VAT: ['Holy See', 'Vatican'],
  PNG: ['PNG'],
  NZL: ['NZ', 'Aotearoa'],
  SAU: ['KSA', 'Saudi'],
  IRN: ['Persia'],
  LKA: ['Ceylon'],
  THA: ['Siam'],
  JPN: ['Nippon', 'Nihon'],
  MMR: ['Burma'],
  SWZ: ['Swaziland'],
  MKD: ['Macedonia'],
  TLS: ['East Timor'],
  CPV: ['Cape Verde'],
  CIV: ['Ivory Coast'],
  TUR: ['Turkiye', 'Türkiye'],
  BLR: ['Byelorussia'],
  KOR: ['Korea', 'Republic of Korea'],
  PRK: ['DPRK'],
  GBR: ['UK', 'U.K.'],
  CAF: ['CAR'],
  BIH: ['Bosnia'],
  TTO: ['Trinidad'],
  ATG: ['Antigua'],
  FSM: ['Micronesia'],
  VCT: ['Saint Vincent and the Grenadines', 'St Vincent and the Grenadines', 'Saint Vincent', 'St Vincent'],
  KNA: ['St Kitts', 'Saint Kitts'],
};
