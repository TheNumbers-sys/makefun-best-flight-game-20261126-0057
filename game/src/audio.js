export function createAudio() {
  let context = null, master = null, motor = null, motorGain = null, active = false;
  function wake() {
    if (!context) {
      context = new AudioContext(); master = context.createGain(); master.gain.value = 0.24; master.connect(context.destination);
      motor = context.createOscillator(); motor.type = 'sawtooth'; motor.frequency.value = 68;
      motorGain = context.createGain(); motorGain.gain.value = 0.0001; motor.connect(motorGain); motorGain.connect(master); motor.start();
    }
    if (context.state === 'suspended') context.resume();
    active = true;
  }
  function tone(frequency, duration, shape = 'sine', volume = 0.16) {
    wake(); const osc = context.createOscillator(), gain = context.createGain();
    osc.type = shape; osc.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    osc.connect(gain); gain.connect(master); osc.start(); osc.stop(context.currentTime + duration);
  }
  return {
    start: wake,
    engine(speed, throttle, bank) { if (!active) return; motor.frequency.setTargetAtTime(52 + speed * 0.34 + throttle * 18, context.currentTime, 0.08); motorGain.gain.setTargetAtTime(0.022 + Math.abs(bank) * 0.006, context.currentTime, 0.12); },
    ring() { tone(880, 0.34, 'sine', 0.22); setTimeout(() => tone(1320, 0.46, 'triangle', 0.15), 90); },
    miss() { tone(180, 0.36, 'square', 0.09); },
    touchdown() { tone(440, 0.5, 'triangle', 0.2); setTimeout(() => tone(660, 0.55, 'sine', 0.17), 130); },
    crash() { tone(110, 0.75, 'sawtooth', 0.18); },
    win() { [523, 659, 784, 1047].forEach((note, index) => setTimeout(() => tone(note, 0.45, 'triangle', 0.15), index * 130)); }
  };
}
