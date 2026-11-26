import { COLORS, ROUTE, VIEW } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const path = (ctx, points, fill, stroke = null, width = 1) => {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
};

export function createRenderer(canvas, world) {
  const ctx = canvas.getContext('2d');
  function sky(state) {
    const g = ctx.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, '#65b9d5'); g.addColorStop(0.72, '#d4e4d0'); g.addColorStop(1, '#f3d19c'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 800);
    const sun = ctx.createRadialGradient(1040, 130, 10, 1040, 130, 190); sun.addColorStop(0, 'rgba(255,246,201,.65)'); sun.addColorStop(1, 'rgba(255,246,201,0)'); ctx.fillStyle = sun; ctx.fillRect(830, 0, 410, 330);
    ctx.fillStyle = '#fff4d4'; ctx.beginPath(); ctx.arc(1040, 128, 38, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const x = (i * 271 + 120 + Math.sin(state.elapsed * .025 + i) * 24) % 1330 - 25, y = 94 + (i % 3) * 49;
      ctx.fillStyle = 'rgba(255,255,244,.52)'; ctx.beginPath(); ctx.ellipse(x, y, 55, 10, 0, 0, 7); ctx.ellipse(x - 10, y - 7, 24, 12, 0, 0, 7); ctx.ellipse(x + 18, y - 5, 28, 11, 0, 0, 7); ctx.fill();
    }
  }
  function ridge(points, color, snow) {
    const coords = [[-20, 494], ...points.map((peak, i) => {
      const x = peak.x * 1320 - 20, y = peak.y * 560 - 35;
      const drift = Math.sin(i * 0.8 + world.seed) * 12;
      return [x, y + drift];
    }), [1300, 500]];
    path(ctx, coords, color);
    if (snow) for (const peak of points) if (peak.snow) {
      const x = peak.x * 1320 - 20, y = peak.y * 560 - 35 + Math.sin(peak.x * 31 * .8 + world.seed) * 12;
      path(ctx, [[x - 18, y + 22], [x, y], [x + 19, y + 24], [x + 4, y + 18], [x, y + 26]], '#f4edcf');
    }
  }
  function terrain(state) {
    const bank = state.bank * 46, horizon = 400 + state.pitch * 55;
    ctx.save(); ctx.translate(bank, 0);
    ridge(world.peaks.filter((_, i) => i % 3 === 0), '#779887', true);
    ridge(world.peaks.filter((_, i) => i % 3 === 1), '#557c6e', false);
    ridge(world.peaks.filter((_, i) => i % 3 === 2), '#3a675e', false);
    ctx.fillStyle = '#b4b27a'; ctx.beginPath(); ctx.moveTo(0, 480); ctx.bezierCurveTo(280, 470, 328, 555, 480, 550); ctx.bezierCurveTo(660, 520, 740, 439, 945, 468); ctx.bezierCurveTo(1070, 480, 1160, 530, 1300, 494); ctx.lineTo(1300, 820); ctx.lineTo(0, 820); ctx.fill();
    ctx.fillStyle = '#65b9b0'; ctx.beginPath(); ctx.moveTo(1030, 464); ctx.bezierCurveTo(875, 477, 850, 540, 742, 565); ctx.bezierCurveTo(600, 592, 626, 640, 483, 648); ctx.bezierCurveTo(392, 652, 338, 691, 308, 810); ctx.lineTo(350, 810); ctx.bezierCurveTo(383, 720, 455, 694, 528, 690); ctx.bezierCurveTo(683, 680, 658, 624, 782, 605); ctx.bezierCurveTo(905, 585, 939, 515, 1070, 504); ctx.closePath(); ctx.fill();
    for (const home of world.homes) {
      const x = (home.x - state.lateral * .18) * 1280, y = home.y * 800;
      ctx.fillStyle = '#eee0bc'; ctx.fillRect(x, y, 15, 11); ctx.fillStyle = home.tone > .5 ? '#b96f53' : '#617e79'; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 7, y - 8); ctx.lineTo(x + 17, y); ctx.fill();
    }
    for (const tree of world.pines) {
      const x = (tree.x - state.lateral * .16 + 2) % 1 * 1280, y = tree.y * 800;
      ctx.fillStyle = tree.tone > .5 ? '#235347' : '#315f53'; ctx.beginPath(); ctx.moveTo(x, y - 15 * tree.size); ctx.lineTo(x - 7 * tree.size, y); ctx.lineTo(x + 7 * tree.size, y); ctx.fill();
    }
    const route = world.routes[state.leg], target = route.rings[state.ring];
    const project = ahead => {
      const depth = Math.max(0, ahead) / 1900; const scale = 1 / (1 + depth * 1.8);
      return { x: 640 + (target ? (target.x - state.lateral) : (route.stripX - state.lateral)) * 870 * scale, y: 474 - depth * 510, scale };
    };
    if (target && target.y > state.distance) {
      const p = project(target.y - state.distance); const r = clamp(78 * p.scale, 11, 78);
      ctx.save(); ctx.shadowColor = '#ffda65'; ctx.shadowBlur = 18; ctx.strokeStyle = '#ffdb73'; ctx.lineWidth = clamp(8 * p.scale, 2, 8); ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * .73, -.12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(255,244,212,.82)'; ctx.font = `bold ${clamp(18 * p.scale, 9, 18)}px ui-monospace`; ctx.textAlign = 'center'; ctx.fillText('MAIL', p.x, p.y + 5);
    }
    const stripDepth = route.stripAt - state.distance;
    if (stripDepth > 0 && stripDepth < 1550) {
      const p = project(Math.max(60, stripDepth)), width = clamp(210 * p.scale, 27, 210), len = clamp(580 * p.scale, 24, 580);
      const x = 640 + (route.stripX - state.lateral) * 870 * p.scale, y = p.y + 85 * p.scale;
      path(ctx, [[x-width/2,y-len/2],[x+width/2,y-len/2],[x+width*.75,y+len/2],[x-width*.75,y+len/2]], '#39484a', '#f4e7c0', 2);
      ctx.strokeStyle = '#f5f0d9'; ctx.lineWidth = clamp(5*p.scale, 1, 5); ctx.setLineDash([12*p.scale, 14*p.scale]); ctx.beginPath(); ctx.moveTo(x, y-len/2); ctx.lineTo(x, y+len/2); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(x, y-len/2-7); ctx.scale(p.scale, p.scale); ctx.fillStyle = '#f5d06c'; ctx.fillRect(-48,-22,96,20); ctx.fillStyle='#203c3e'; ctx.font='bold 13px ui-monospace'; ctx.textAlign='center'; ctx.fillText(route.strip,0,-8); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(34,63,54,.18)'; ctx.fillRect(0, horizon + 92, 1280, 4);
  }
  function plane(state) {
    ctx.save(); ctx.translate(640, 553 + state.pitch * 8); ctx.rotate(state.bank * .18);
    ctx.fillStyle = 'rgba(16,31,35,.28)'; ctx.beginPath(); ctx.ellipse(0, 56, 174, 21, 0, 0, 7); ctx.fill();
    path(ctx, [[-180,16],[-48,-9],[-28,-38],[25,-38],[49,-9],[178,18],[180,36],[52,26],[22,16],[15,57],[-19,57],[-25,16],[-178,39]], '#e9e0c5', '#263a3b', 3);
    path(ctx, [[-42,-4],[-30,-32],[27,-32],[43,-3],[23,2],[-23,2]], '#4b9189', '#26484a', 2);
    path(ctx, [[-15,-8],[0,-15],[15,-8],[9,20],[-9,20]], '#c45d43');
    ctx.strokeStyle = '#f3b85f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-172,20); ctx.lineTo(-48,7); ctx.moveTo(172,22); ctx.lineTo(48,7); ctx.stroke();
    ctx.strokeStyle = '#202d2e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20,-34); ctx.lineTo(-3,-43); ctx.lineTo(15,-34); ctx.stroke();
    ctx.restore();
  }
  function panel(state) {
    ctx.fillStyle = 'rgba(14,31,37,.94)'; ctx.beginPath(); ctx.moveTo(0, 696); ctx.quadraticCurveTo(640, 650, 1280, 696); ctx.lineTo(1280,800); ctx.lineTo(0,800); ctx.fill();
    ctx.strokeStyle = 'rgba(255,232,183,.26)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,696); ctx.quadraticCurveTo(640,650,1280,696); ctx.stroke();
    ctx.fillStyle='#253d40'; ctx.beginPath(); ctx.roundRect(25,710,1230,82,22); ctx.fill();
    const gauges=[{x:150,label:'ALTITUDE',value:`${Math.round(state.altitude).toLocaleString()} FT`,n:state.altitude/5000},{x:395,label:'AIRSPEED',value:`${Math.round(state.speed)} KT`,n:state.speed/245},{x:640,label:'HEADING',value:`${String(Math.round(state.heading)).padStart(3,'0')}°`,n:state.heading/360},{x:885,label:'VSI',value:`${state.pitch>=0?'+':''}${Math.round(state.pitch*680)} FT/MIN`,n:.48+state.pitch*.3}];
    for (const gauge of gauges) {
      ctx.fillStyle='#b6c5ad'; ctx.font='bold 12px ui-monospace'; ctx.textAlign='center'; ctx.fillText(gauge.label,gauge.x,733);
      ctx.fillStyle='#fff2cb'; ctx.font='bold 22px ui-monospace'; ctx.fillText(gauge.value,gauge.x,761);
      ctx.fillStyle='#101f25'; ctx.fillRect(gauge.x-60,773,120,5); ctx.fillStyle=COLORS.teal; ctx.fillRect(gauge.x-60,773,120*clamp(gauge.n,0,1),5);
    }
    ctx.textAlign='center'; ctx.fillStyle='#ffc85c'; ctx.font='bold 12px ui-monospace'; ctx.fillText('THROTTLE  '+Math.round(state.throttle*100)+'%',1090,733); ctx.fillStyle='#304c4b'; ctx.fillRect(1019,747,142,12); ctx.fillStyle='#ffc85c'; ctx.fillRect(1019,747,142*state.throttle,12);
    button(947,766,112,'FLAPS '+(state.flaps?'ON':'OFF'),state.flaps); button(1070,766,132,'+ THROTTLE',false);
  }
  function button(x,y,w,label,on) { ctx.fillStyle=on?'#c56b50':'#3c5c59'; ctx.beginPath(); ctx.roundRect(x,y,w,23,7); ctx.fill(); ctx.fillStyle='#fff1d2'; ctx.font='bold 11px ui-monospace'; ctx.textAlign='center'; ctx.fillText(label,x+w/2,y+16); }
  function hud(state) {
    ctx.fillStyle='rgba(16,37,42,.78)'; ctx.beginPath(); ctx.roundRect(24,22,340,132,15); ctx.fill();
    ctx.fillStyle='#ffdc83'; ctx.font='bold 14px ui-monospace'; ctx.textAlign='left'; ctx.fillText('SKYHOOK COURIER  /  '+String(state.leg+1).padStart(2,'0'),44,51);
    ctx.fillStyle='#f7f0d7'; ctx.font='bold 23px ui-monospace'; ctx.fillText(ROUTE[state.leg].name.toUpperCase(),44,83);
    ctx.font='13px ui-monospace'; ctx.fillStyle='#b9d3c6'; ctx.fillText(`SCORE ${String(state.score).padStart(5,'0')}     LEG ${state.leg+1}/${ROUTE.length}`,44,111);
    ctx.fillStyle=state.time<20?'#ff8064':'#f6dfa4'; ctx.font='bold 19px ui-monospace'; ctx.fillText(`TIME  ${Math.max(0,state.time).toFixed(1)}s`,44,139);
    ctx.textAlign='right'; ctx.fillStyle='#fff0c6'; ctx.font='bold 18px ui-monospace'; ctx.fillText('♥ '.repeat(state.lives),1247,43);
    const route=world.routes[state.leg], target=route.rings[state.ring];
    ctx.textAlign='right'; ctx.fillStyle='#fff0c6'; ctx.font='bold 14px ui-monospace';
    if(target){const dist=Math.max(0,target.y-state.distance);ctx.fillText(`NEXT RING  ${Math.round(dist)} FT`,1244,75);ctx.fillStyle='#ffd566';ctx.font='bold 20px ui-monospace';ctx.fillText('↗  '+Math.round((target.x-state.lateral)*38)+'°',1244,105);}
    else {const dist=Math.max(0,route.stripAt-state.distance);ctx.fillText(`${route.strip} STRIP`,1244,75);ctx.fillStyle='#ffd566';ctx.font='bold 20px ui-monospace';ctx.fillText(`RUNWAY  ${Math.round(dist)} FT  ↓`,1244,105);}
    ctx.fillStyle='rgba(18,39,42,.7)'; ctx.beginPath(); ctx.roundRect(436,22,408,41,20);ctx.fill();ctx.fillStyle='#ffdd83';ctx.font='bold 14px ui-monospace';ctx.textAlign='center';ctx.fillText(state.feedback,640,48);
    ctx.strokeStyle='rgba(255,245,214,.76)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(640,301);ctx.lineTo(640,327);ctx.moveTo(627,314);ctx.lineTo(653,314);ctx.stroke();
    if (state.flash>0) {ctx.fillStyle=`rgba(255,110,80,${state.flash*.3})`;ctx.fillRect(0,0,1280,800);}
  }
  function title(state) {
    ctx.fillStyle='rgba(12,34,39,.38)';ctx.fillRect(0,0,1280,800);
    ctx.fillStyle='rgba(14,34,39,.86)';ctx.beginPath();ctx.roundRect(250,125,780,495,28);ctx.fill();
    ctx.textAlign='center';ctx.fillStyle='#ffda7b';ctx.font='bold 19px ui-monospace';ctx.fillText('NORTHWIND AIR MAIL  •  1948',640,184);
    ctx.fillStyle='#fff4d4';ctx.font='bold 54px ui-monospace';ctx.fillText('SKYHOOK',640,250);ctx.fillStyle='#5fd5c0';ctx.fillText('COURIER',640,310);
    ctx.fillStyle='#d0ddcf';ctx.font='18px ui-monospace';ctx.fillText('THREAD THE MAIL RINGS. BRING EVERY LETTER HOME.',640,365);
    ctx.font='15px ui-monospace';ctx.fillText('A mountain route, four remote strips, one weather window.',640,401);
    ctx.fillText('ARROWS / WASD  fly & throttle       SPACE  flaps',640,456);ctx.fillText('MOUSE  drag to steer       CLICK  cockpit controls',640,486);ctx.fillText('AIM FOR THE RING · SLOW DOWN · LINE UP WITH THE STRIP',640,526);
    ctx.fillStyle='#ffc85c';ctx.beginPath();ctx.roundRect(456,552,368,48,13);ctx.fill();ctx.fillStyle='#18353a';ctx.font='bold 19px ui-monospace';ctx.fillText('CLICK TO FLY  /  ENTER',640,582);
  }
  function overlay(state) {
    if (state.screen==='pause'||state.screen==='over'||state.screen==='won'||state.screen==='crash'||state.screen==='delivered') {
      ctx.fillStyle='rgba(8,23,29,.64)';ctx.fillRect(0,0,1280,800);ctx.textAlign='center';
      const heading=state.screen==='pause'?'FLIGHT PAUSED':state.screen==='won'?'ALL DELIVERIES COMPLETE':state.screen==='crash'?'HARD LANDING':state.screen==='delivered'?'DELIVERY COMPLETE':'THE MAIL RUN IS OVER';
      ctx.fillStyle=state.screen==='won'?'#ffda7b':'#fff2d2';ctx.font='bold 38px ui-monospace';ctx.fillText(heading,640,340);
      ctx.font='bold 22px ui-monospace';ctx.fillStyle='#70dfc7';ctx.fillText(`FINAL SCORE  ${String(state.score).padStart(5,'0')}   ·   BEST STREAK  ${state.bestStreak}`,640,394);
      ctx.font='17px ui-monospace';ctx.fillStyle='#f0e8cc';ctx.fillText(state.screen==='pause'?'Press P to resume':state.screen==='crash'?'Click to continue the delivery run':state.screen==='delivered'?'Click or press ENTER to fly the next leg':'Click anywhere or press ENTER to fly again',640,442);
    }
  }
  function render(state) {
    ctx.clearRect(0,0,VIEW.width,VIEW.height);sky(state);terrain(state);plane(state);
    if(state.screen==='flight'||state.screen==='pause'||state.screen==='over'||state.screen==='won'||state.screen==='crash'||state.screen==='delivered') {hud(state);panel(state);} else {hud(state);panel(state);title(state);}
    overlay(state);
  }
  return { render };
}
