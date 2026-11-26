import { readSeed } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld } from './world.js';
import { newFlight, updateFlight } from './state.js';
import { createRenderer } from './render.js';
import { prepareShot } from './shots.js';

const canvas = document.querySelector('#flight');
const world = createWorld(readSeed());
const input = createInput(canvas);
const sound = createAudio();
const renderer = createRenderer(canvas, world);
const now = performance.now() / 1000;
const state = prepareShot(world, location.search, now) ?? newFlight(world, now);
let previous = now;

function frame(milliseconds) {
  const time = milliseconds / 1000;
  updateFlight(state, world, input, time - previous, time, sound);
  previous = time;
  renderer.render(state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
