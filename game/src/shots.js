import { newFlight, stageFlight } from './state.js';

export function prepareShot(world, search, now) {
  const shot = new URLSearchParams(search).get('shot');
  if (!['cover', 'mid', 'land'].includes(shot)) return null;
  const flight = newFlight(world, now);
  stageFlight(flight, world, shot, now);
  return flight;
}
