'use strict';
/* =================== utilidades =================== */
const $=s=>document.querySelector(s);
const rnd=Math.random;
// sorteios da batalha: no duelo ao vivo vira um sorteio com semente, igual nos dois aparelhos
let brnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(x,y,s=0){let h=(x*374761393+y*668265263+s*982451653)|0;h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0}
function mk(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');f(g);return c}
function R(g,col,x,y,w=1,h=1){g.fillStyle=col;g.fillRect(x,y,w,h)}

