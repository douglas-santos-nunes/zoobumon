'use strict';
/* =================== entrada =================== */
const handlers=[];
function pushH(fn){handlers.push(fn);return()=>{const i=handlers.lastIndexOf(fn);if(i>=0)handlers.splice(i,1)}}
const dirStack=[];const held={b:false};
const curDir=()=>dirStack[dirStack.length-1]||null;
const DIRS=['up','down','left','right'];
const KEYS={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',KeyZ:'a',Space:'a',Enter:'a',KeyX:'b',Escape:'b',Backspace:'b',KeyM:'start'};
function press(b){if(!started)return;if(handlers.length)handlers[handlers.length-1](b);else if(mode==='world')worldPress(b)}
function down(b,repeat){
  if(DIRS.includes(b)){if(!dirStack.includes(b))dirStack.push(b);press(b);return}
  if(b==='b')held.b=true;
  if(!repeat)press(b);
}
function up(b){const i=dirStack.indexOf(b);if(i>=0)dirStack.splice(i,1);if(b==='b')held.b=false}
addEventListener('keydown',e=>{
  if(e.target.matches&&e.target.matches('input,textarea')){if(e.code==='Escape')e.target.blur();return}
  const b=KEYS[e.code];if(!b||!started)return;
  e.preventDefault();down(b,e.repeat);
});
addEventListener('keyup',e=>{const b=KEYS[e.code];if(b)up(b)});
addEventListener('blur',()=>{dirStack.length=0;held.b=false});
// toque: com texto na tela, tocar em qualquer lugar avança o texto
$('#game').addEventListener('pointerdown',e=>{
  if(!started||e.target.closest('.box,#menuBtn,#somBtn,#pad'))return;
  if(sayActive)press('a');
});
// joystick: arrastar a bolinha escolhe a direção (a que mais pesa entre horizontal e vertical)
let joyId=null,joyDir=null;
function setJoyDir(d){if(d===joyDir)return;if(joyDir)up(joyDir);joyDir=d;if(d)down(d)}
function joyMove(e){
  const r=$('#joy').getBoundingClientRect(),R=r.width/2;
  let dx=e.clientX-r.left-R,dy=e.clientY-r.top-R;const len=Math.hypot(dx,dy),max=R*.62;
  if(len>max){dx*=max/len;dy*=max/len}
  $('#knob').style.transform=`translate(${dx}px,${dy}px)`;
  setJoyDir(len<R*.22?null:Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
}
function joyEnd(e){if(e.pointerId!==joyId)return;joyId=null;$('#knob').style.transform='';setJoyDir(null)}
$('#joy').addEventListener('pointerdown',e=>{e.preventDefault();joyId=e.pointerId;try{$('#joy').setPointerCapture(e.pointerId)}catch(_){}joyMove(e)});
$('#joy').addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});
for(const ev of['pointerup','pointercancel','lostpointercapture'])$('#joy').addEventListener(ev,joyEnd);
// A aperta uma vez; B fica valendo enquanto o dedo estiver em cima (correr)
for(const[id,b]of[['#btnA','a'],['#btnB','b']]){
  const el=$(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}el.classList.add('on');down(b)});
  for(const ev of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>{if(!el.classList.contains('on'))return;el.classList.remove('on');up(b)});
  el.addEventListener('click',e=>{if(e.detail===0)press(b)});
}
// o controle só aparece andando pelo mapa
function updatePad(){const vis=started&&mode==='world'&&!busy,pad=$('#pad');if(pad.hidden===vis){pad.hidden=!vis;if(!vis){joyId=null;$('#knob').style.transform='';setJoyDir(null)}}}
$('#game').addEventListener('contextmenu',e=>e.preventDefault());
$('#menuBtn').addEventListener('click',e=>{e.currentTarget.blur();press('start')});
$('#somBtn').addEventListener('click',e=>{e.currentTarget.blur();auInit();setSom(!AU.on)});
setSom(AU.on);
$('#pclose').addEventListener('click',e=>{e.currentTarget.blur();press('b')});

