import { FLIGHT, ROUTE } from './config.js';
import { windAt } from './world.js';

export function newFlight(world, now = 0) {
  return { screen: 'title', leg: 0, ring: 0, distance: 0, lateral: 0, altitude: 920, speed: 132, heading: 4, bank: 0, pitch: 0, throttle: 0.55, flaps: false, score: 0, lives: 3, time: ROUTE[0].time, elapsed: 0, bestStreak: 0, streak: 0, feedback: 'READY TO FLY', flash: 0, lastTime: now, lastChime: -1, runCount: 0 };
}

export function startFlight(state, now) {
  state.screen = 'flight'; state.lastTime = now; state.feedback = 'DELIVER THE MAIL';
}

export function stageFlight(state, world, shot, now) {
  startFlight(state, now);
  state.runCount = 1;
  if (shot === 'mid') {
    state.ring = 1; state.distance = 1580; state.lateral = -0.05; state.altitude = 1140; state.speed = 149; state.heading = 24; state.score = 250; state.time = 77; state.streak = 1; state.feedback = 'RING CLEARED  +250';
  } else if (shot === 'land') {
    state.ring = world.routes[0].rings.length; state.distance = world.routes[0].stripAt - 780; state.lateral = world.routes[0].stripX - 0.025; state.altitude = 320; state.speed = 91; state.heading = 2; state.score = 750; state.time = 62; state.streak = 3; state.feedback = 'FINAL APPROACH';
  } else {
    state.distance = 390; state.lateral = -0.055; state.altitude = 1040; state.speed = 138; state.heading = 12; state.score = 0; state.time = 91; state.feedback = 'PINEGLASS POST  •  DELIVERY 1/3';
  }
}

export function updateFlight(state, world, input, dt, now, audio) {
  if (input.consume('pause')) {
    if (state.screen === 'flight') state.screen = 'pause'; else if (state.screen === 'pause') { state.screen = 'flight'; state.lastTime = now; }
  }
  const click = input.consumeClick();
  if (state.screen === 'delivered') {
    if (input.consume('start') || click) { state.screen = 'flight'; state.lastTime = now; state.feedback = 'NEXT LEG  ·  PICK UP THE MAIL'; }
    return;
  }
  if (state.screen === 'crash') {
    if (input.consume('start') || click) {
      state.screen = 'flight'; state.distance = 0; state.ring = 0; state.lateral = 0; state.altitude = 900; state.speed = 118;
      state.time = Math.max(1, state.time - 15); state.feedback = 'BACK IN THE AIR  ·  WATCH YOUR SPEED'; state.lastTime = now;
    }
    return;
  }
  if (state.screen === 'title' || state.screen === 'over' || state.screen === 'won') {
    if (input.consume('start') || (click && click.y > 500)) { Object.assign(state, newFlight(world, now)); startFlight(state, now); audio.start(); }
    return;
  }
  if (state.screen !== 'flight') return;
  dt = Math.min(dt, 0.04);
  state.elapsed += dt; state.time -= dt; state.flash = Math.max(0, state.flash - dt);
  if (state.time <= 0) { state.screen = 'over'; state.feedback = 'THE WEATHER WINDOW CLOSED'; audio.crash(); return; }
  if (input.held.has('throttle')) state.throttle = Math.min(1, state.throttle + dt * 0.65);
  if (input.held.has('slow')) state.throttle = Math.max(0.05, state.throttle - dt * 0.65);
  if (click && click.x > 1010 && click.y > 650) state.throttle = Math.min(1, state.throttle + 0.12);
  if (click && click.x > 870 && click.x < 1010 && click.y > 650) state.flaps = !state.flaps;
  const turn = (input.held.has('left') ? -1 : 0) + (input.held.has('right') ? 1 : 0) + input.pointer.steerX * (input.pointer.down ? 1 : 0);
  const pitch = (input.held.has('pitchUp') ? 1 : 0) - (input.held.has('pitchDown') ? 1 : 0) - input.pointer.steerY * (input.pointer.down ? 0.65 : 0);
  const wind = windAt(world, state.leg, state.elapsed);
  const braking = input.held.has('flaps') || state.flaps;
  const targetSpeed = state.throttle * FLIGHT.maxSpeed - (braking ? 52 : 0);
  state.speed += (targetSpeed - state.speed) * dt * FLIGHT.drag;
  state.speed = Math.max(FLIGHT.minSpeed, Math.min(FLIGHT.maxSpeed, state.speed));
  state.bank += (turn * 0.88 - state.bank) * Math.min(1, dt * 5.5);
  state.heading = (state.heading + (turn * FLIGHT.turnRate * (0.5 + state.speed / 320) + wind * 0.09) * dt * 30 + 360) % 360;
  state.lateral += (turn * 0.19 + wind * 0.15) * dt;
  state.lateral = Math.max(-0.68, Math.min(0.68, state.lateral));
  state.pitch += (pitch * 0.9 - state.pitch) * Math.min(1, dt * 4);
  state.altitude += (state.pitch * FLIGHT.climb + (state.throttle - 0.5) * 9 + (braking ? 8 : 0)) * dt;
  state.altitude = Math.max(80, Math.min(5000, state.altitude));
  state.distance += state.speed * dt;
  audio.engine(state.speed, state.throttle, state.bank);
  const route = world.routes[state.leg];
  const target = route.rings[state.ring];
  if (target && state.distance >= target.y + 105) {
    if (Math.abs(state.lateral - target.x) < 0.19 * route.tightness && Math.abs(state.altitude - 920) < 560) {
      state.score += 250 + Math.round(state.speed); state.time += 8; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak); state.feedback = 'RING CLEARED  +250  ·  +8 SEC'; audio.ring();
    } else { state.time = Math.max(0, state.time - 12); state.streak = 0; state.feedback = 'MISSED THE MAIL SLOT  −12 SEC'; audio.miss(); }
    state.ring++;
  }
  if (!target && state.distance >= route.stripAt - 240) {
    const headingError = Math.min(Math.abs(state.heading), Math.abs(state.heading - 360));
    const aligned = Math.abs(state.lateral - route.stripX) < 0.18 && headingError < 45;
    if (state.altitude < 260 && state.speed < 118 && aligned) {
      state.score += 900; audio.touchdown();
      if (state.leg + 1 >= ROUTE.length) { state.screen = 'won'; state.feedback = 'ALL MAIL DELIVERED'; audio.win(); }
      else { state.leg++; state.ring = 0; state.distance = 0; state.lateral = 0; state.altitude = 930; state.speed = 124; state.time = ROUTE[state.leg].time; state.screen = 'delivered'; state.feedback = `${ROUTE[state.leg - 1].strip}  •  DELIVERY COMPLETE`; }
    } else if (state.distance > route.stripAt + 320) {
      state.lives--; state.screen = state.lives > 0 ? 'crash' : 'over'; state.feedback = 'HARD LANDING  ·  ALIGN, SLOW, FLARE'; audio.crash();
    }
  }
}
