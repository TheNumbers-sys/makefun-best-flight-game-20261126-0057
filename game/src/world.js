import { ROUTE } from './config.js';

export function randomStream(seed) {
  let value = seed >>> 0 || 1;
  return () => { value += 0x6d2b79f5; let n = value; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}

export function createWorld(seed) {
  const random = randomStream(seed);
  const peaks = Array.from({ length: 32 }, (_, index) => ({
    x: index / 31, y: 0.16 + random() * 0.31, height: 0.09 + random() * 0.25,
    shade: Math.floor(random() * 3), snow: random() > 0.64
  }));
  const pines = Array.from({ length: 90 }, () => ({ x: random(), y: 0.59 + random() * 0.27, size: 0.5 + random() * 1.2, tone: random() }));
  const homes = Array.from({ length: 24 }, (_, i) => ({ x: 0.28 + (i % 6) * 0.035, y: 0.69 + Math.floor(i / 6) * 0.035, tone: random() }));
  return { seed, peaks, pines, homes, windPhase: random() * Math.PI * 2, routes: ROUTE.map((route, leg) => ({
    ...route,
    rings: Array.from({ length: route.rings }, (_, i) => ({
      x: Math.sin(i * 1.7 + leg * 0.9) * (0.23 + leg * 0.025),
      y: 1040 + i * 610,
      z: 145 + random() * 38,
      phase: random() * Math.PI * 2
    })),
    stripAt: 1040 + route.rings * 610 + 540,
    stripX: Math.cos(leg * 1.45) * (0.14 + leg * 0.018)
  })) };
}

export function windAt(world, leg, time) { return Math.sin(time * 0.47 + world.windPhase + leg) * world.routes[leg].crosswind; }
