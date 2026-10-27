'use strict';
/* =================== interface =================== */
let typing=null,sayActive=false;
function hideText(){const tb=$('#textbox');tb.hidden=true;tb.classList.remove('narrow')}
function setText(t,narrow){const tb=$('#textbox');tb.hidden=false;tb.classList.toggle('narrow',!!narrow);tb.querySelector('.txt').textContent=t;tb.querySelector('.more').hidden=true}
function say(text){
  return new Promise(res=>{
    const tb=$('#textbox'),span=tb.querySelector('.txt'),arrow=tb.querySelector('.more');
    tb.hidden=false;tb.classList.remove('narrow');arrow.hidden=true;span.textContent='';
    let i=0,done=false;
    clearInterval(typing);sayActive=true;
    typing=setInterval(()=>{i+=2;span.textContent=text.slice(0,i);if(i>=text.length){clearInterval(typing);done=true;arrow.hidden=false}},18);
    const pop=pushH(b=>{
      if(b!=='a'&&b!=='b')return;
      if(!done){clearInterval(typing);span.textContent=text;done=true;arrow.hidden=false;return}
      sfx('texto');sayActive=false;pop();res();
    });
  });
}
$('#textbox').addEventListener('click',()=>press('a'));

function choose(items,{root=null,cls='side',cols=1,cancel=true,onMove=null,start=0}={}){
  return new Promise(res=>{
    const isMenu=!root,el=root||$('#menu');
    if(isMenu){
      el.className='menu box '+cls;el.style.gridTemplateColumns=`repeat(${cols},minmax(0,1fr))`;el.hidden=false;
      if(cls==='side')$('#game').appendChild(el);else $('#dock').insertBefore(el,$('#minfo'));
    }
    el.innerHTML='';
    let sel=clamp(start,0,items.length-1),done=false;
    if(items[sel]?.disabled){const k=items.findIndex(x=>!x.disabled);if(k>=0)sel=k}
    const els=items.map((it,i)=>{
      const d=document.createElement('div');d.className='opt'+(it.disabled?' off':'');d.innerHTML=it.html??esc(it.label);
      // opção com confirm: o primeiro toque só seleciona (pra ver os detalhes), o segundo usa
      d.addEventListener('click',()=>{if(done)return;if(it.confirm&&sel!==i){sel=i;sfx('cursor');draw();return}sel=i;draw();pick()});
      d.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!done&&sel!==i){sel=i;draw()}});
      el.appendChild(d);return d;
    });
    function draw(){
      els.forEach((e,i)=>e.classList.toggle('on',i===sel));
      const e=els[sel];
      if(!isMenu&&e){if(e.offsetTop<el.scrollTop)el.scrollTop=e.offsetTop-4;else if(e.offsetTop+e.offsetHeight>el.scrollTop+el.clientHeight)el.scrollTop=e.offsetTop+e.offsetHeight-el.clientHeight+4}
      onMove&&onMove(items[sel],sel);
    }
    function finish(v){if(done)return;done=true;sfx(v<0?'volta':'ok');pop();if(isMenu)el.hidden=true;res(v)}
    function pick(){if(!items[sel]||items[sel].disabled)return;finish(sel)}
    const pop=pushH(b=>{
      const n=items.length;
      if(b==='up')sel=(sel-cols+n)%n;else if(b==='down')sel=(sel+cols)%n;
      else if(b==='left'&&cols>1)sel=(sel+n-1)%n;else if(b==='right'&&cols>1)sel=(sel+1)%n;
      else if(b==='a')return pick();else if(b==='b'){if(cancel)finish(-1);return}else return;
      sfx('cursor');draw();
    });
    draw();
  });
}
function showPanel(title,{foot='',body=''}={}){
  $('#panel').hidden=false;$('#ptitle').textContent=title;
  const pb=$('#pbody');pb.innerHTML=body;pb.hidden=!body;pb.classList.remove('grow');
  $('#pfoot').textContent=foot;$('#plist').innerHTML='';$('#plist').scrollTop=0;
  return{list:$('#plist'),body:pb};
}
const hidePanel=()=>{$('#panel').hidden=true};
function fadeTo(v,ms,col){const f=$('#fade');if(col)f.style.background=col;f.style.transition=`opacity ${ms}ms linear`;f.style.opacity=v;return sleep(ms)}
const tweens=[];
function tween(ms,fn){return new Promise(res=>tweens.push({t0:performance.now(),ms,fn,res}))}
async function run(fn){busy++;try{await fn()}catch(e){console.error(e)}finally{busy--;if(!busy){hideText();$('#menu').hidden=true;$('#minfo').hidden=true;hidePanel();needRelease=true}}}
const hpCol=f=>f>.5?'#58d080':f>.2?'#f8c838':'#f05838';
function setBar(el,f){f=clamp(f,0,1);el.style.width=f*100+'%';el.style.background=hpCol(f)}
function monRow(m){const mx=maxHP(m,S),f=m.hp/mx;
  return`<img src="${icon(m.s)}" alt=""><div class="pinfo"><b>${nameOf(m)} <small>Nv${m.lv}</small> ${chip(SPECIES[m.s].t)}</b><div class="hpbar"><i style="width:${f*100}%;background:${hpCol(f)}"></i></div></div><span class="r">${m.hp}/${mx}</span>`}
let locTimer=0;
function showLoc(z){showLocText(ZNAME[z])}
function showLocText(t){const l=$('#loc');l.textContent=t;l.classList.add('show');clearTimeout(locTimer);locTimer=setTimeout(()=>l.classList.remove('show'),2200)}

