export const VIEW = { width: 1280, height: 800 };
export const FLIGHT = { cruise: 148, minSpeed: 58, maxSpeed: 245, climb: 44, turnRate: 1.08, drag: 0.17 };
export const ROUTE = [
  { name: 'Pineglass Post', strip: 'PINEGLASS', rings: 3, time: 100, crosswind: 0.16, tightness: 1 },
  { name: 'Raven Notch', strip: 'RAVEN NOTCH', rings: 4, time: 96, crosswind: 0.35, tightness: 0.86 },
  { name: 'Highwater Mail', strip: 'HIGHWATER', rings: 5, time: 92, crosswind: 0.52, tightness: 0.73 },
  { name: 'Lastlight Station', strip: 'LASTLIGHT', rings: 5, time: 88, crosswind: 0.68, tightness: 0.64 }
];
export const COLORS = { ink: '#112730', cream: '#fff4d4', gold: '#ffc85c', teal: '#55d8c2', coral: '#ff765d', sky: '#78c5d8' };
export function readSeed() {
  const value = new URLSearchParams(location.search).get('seed');
  const number = Number(value);
  return Number.isFinite(number) ? (number >>> 0) : 1;
}
