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
