// Costanti delle particelle: CODATA 2022 (NIST) e Particle Data Group (PDG 2024).
import { pick } from '../i18n/index.js';

const L = (it, en, eli6) => pick({ it, en, eli6 });

export const ELEMENTARY_CHARGE_C = 1.602176634e-19; // esatta (SI 2019)

export const PARTICLES = {
  proton: {
    name: L('Protone', 'Proton'),
    symbol: 'p⁺',
    charge: +1,
    massKg: 1.67262192595e-27,
    massMeV: 938.27208943,
    massU: 1.0072764665789,
    spin: '½',
    family: L('Barione (adrone) · fermione', 'Baryon (hadron) · fermion'),
    quarks: ['u', 'u', 'd'],
    radiusFm: 0.84075, // raggio di carica (CODATA 2022)
    magneticMoment: L('+2,793 μ_N', '+2.793 μ_N'),
  },
  neutron: {
    name: L('Neutrone', 'Neutron'),
    symbol: 'n⁰',
    charge: 0,
    massKg: 1.67492750056e-27,
    massMeV: 939.56542194,
    massU: 1.00866491606,
    spin: '½',
    family: L('Barione (adrone) · fermione', 'Baryon (hadron) · fermion'),
    quarks: ['u', 'd', 'd'],
    lifetimeS: 878.4, // vita media del neutrone libero (PDG 2024)
    magneticMoment: L('−1,913 μ_N', '−1.913 μ_N'),
  },
  electron: {
    name: L('Elettrone', 'Electron'),
    symbol: 'e⁻',
    charge: -1,
    massKg: 9.1093837139e-31,
    massMeV: 0.51099895069,
    massU: 5.485799090441e-4,
    spin: '½',
    family: L('Leptone · fermione · particella elementare', 'Lepton · fermion · elementary particle'),
    magneticMoment: L('−1,001 16 μ_B', '−1.001 16 μ_B'),
  },
};

/** Rapporto tra le masse di protone ed elettrone (CODATA 2022). */
export const PROTON_ELECTRON_MASS_RATIO = 1836.152673426;

/** Quark di valenza (masse correnti, schema MS-bar a 2 GeV, PDG 2024). */
export const QUARKS = {
  u: { name: 'up', charge: '+⅔', chargeValue: 2 / 3, massMeV: 2.16 },
  d: { name: 'down', charge: '−⅓', chargeValue: -1 / 3, massMeV: 4.7 },
};

/** Cariche di colore della cromodinamica quantistica (QCD). */
export const COLOR_CHARGES = [
  { key: 'r', name: L('rosso', 'red'), hex: '#ff4b5c' },
  { key: 'g', name: L('verde', 'green'), hex: '#3ef08a' },
  { key: 'b', name: L('blu', 'blue'), hex: '#4d8dff' },
];
