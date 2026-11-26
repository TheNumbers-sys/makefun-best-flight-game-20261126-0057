export function createInput(canvas) {
  const held = new Set();
  const pointer = { x: 0, y: 0, down: false, anchorX: 0, anchorY: 0, steerX: 0, steerY: 0, click: null };
  const map = { ArrowUp: 'throttle', KeyW: 'pitchUp', ArrowDown: 'slow', KeyS: 'pitchDown', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'flaps' };
  window.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
    if (event.code === 'KeyP' || event.code === 'Escape') held.add('pause');
    if (event.code === 'Enter') held.add('start');
    if (map[event.code]) held.add(map[event.code]);
  });
  window.addEventListener('keyup', event => { if (map[event.code]) held.delete(map[event.code]); });
  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  canvas.addEventListener('pointerdown', event => { const p = position(event); pointer.down = true; pointer.x = p.x; pointer.y = p.y; pointer.anchorX = p.x; pointer.anchorY = p.y; pointer.steerX = 0; pointer.steerY = 0; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => { const p = position(event); pointer.x = p.x; pointer.y = p.y; if (pointer.down) { pointer.steerX = Math.max(-1, Math.min(1, (p.x - pointer.anchorX) / 175)); pointer.steerY = Math.max(-1, Math.min(1, (p.y - pointer.anchorY) / 150)); } });
  canvas.addEventListener('pointerup', event => { const p = position(event); pointer.down = false; pointer.click = p; pointer.steerX = 0; pointer.steerY = 0; });
  return { held, pointer, consumeClick() { const click = pointer.click; pointer.click = null; return click; }, consume(name) { if (!held.has(name)) return false; held.delete(name); return true; } };
}
