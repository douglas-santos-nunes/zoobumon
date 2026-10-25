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
// toque: tocar no mapa anda até lá; tocar com texto na tela avança o texto
let dragging=false;
$('#game').addEventListener('pointerdown',e=>{
  if(!started||e.target.closest('.box,#menuBtn'))return;
  if(sayActive){press('a');return}
  if(mode==='world'&&!busy){dragging=true;tapMove(e)}
});
$('#game').addEventListener('pointermove',e=>{if(dragging&&mode==='world'&&!busy)tapMove(e)});
for(const ev of['pointerup','pointercancel','pointerleave'])$('#game').addEventListener(ev,()=>{dragging=false});
$('#game').addEventListener('contextmenu',e=>e.preventDefault());
$('#menuBtn').addEventListener('click',e=>{e.currentTarget.blur();press('start')});
$('#pclose').addEventListener('click',e=>{e.currentTarget.blur();press('b')});

