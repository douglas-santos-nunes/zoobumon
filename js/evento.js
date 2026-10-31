'use strict';
/* =================== evento de Halloween =================== */
// só no dia 31/10/2026 (data do aparelho): vencer 30 lutas libera escolher UM prêmio, chapéu de bruxa, cabeça de abóbora, máscara de caveira ou do Pânico.
// quem completou e ainda não escolheu continua vendo a abóbora depois do dia, pra não perder o prêmio.
const HW_META=30,HW_PREMIOS=['chapeu_bruxa','abobora','caveira','panico'];
// no dia do evento todo Zubumafilho do mato vem de abóbora; pai e vô às vezes vêm fantasiados
const HW_ZUBUMA={zubumafilho:1,zubumapai:.25,zubumavo:.25};
// onde a versão normal aparece no mato, do lugar com mais chance pro de menos (a de Halloween sai no mesmo lugar)
const hwOnde=k=>{const base=k.replace(/hw$/,'');return Object.entries(ENC).map(([z,l])=>{const t=l.reduce((a,e)=>a+e[1],0),e=l.find(e=>e[0]===base);return e&&[ZNAME[z],e[1]/t]}).filter(Boolean).sort((a,b)=>b[1]-a[1]).map(x=>x[0])};
const HW_CURTO={chapeu_bruxa:'Bruxa',abobora:'Abóbora',caveira:'Caveira',panico:'Pânico'};
const hwHoje=()=>{const d=new Date();return d.getFullYear()===2026&&d.getMonth()===9&&d.getDate()===31};
// pra testar no computador: localhost/?halloween liga o evento em qualquer dia
const hwTeste=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]halloween\b/.test(location.search);
const hwSt=()=>(S.hw=S.hw||{n:0,pick:null});
const hwAtivo=()=>hwHoje()||hwTeste;
const hwVisivel=()=>!!S&&!hwSt().pick&&(hwAtivo()||hwSt().n>=HW_META);
async function hwVitoria(){
  if(!hwAtivo())return;const h=hwSt();if(h.pick||h.n>=HW_META)return;
  h.n++;hwBadge();save();
  if(h.n>=HW_META)await say('Desafio de Halloween completo! Toque na abóbora no canto da tela pra pegar seu prêmio.');
}
function hwBadge(){const b=$('#hwBtn small');if(b)b.textContent=`${Math.min(hwSt().n,HW_META)}/${HW_META}`}
function hwTick(show){
  if(show&&hwAvisoPendente())run(hwAviso);
  const el=$('#hwBtn'),vis=show&&hwVisivel();if(el.hidden===vis)el.hidden=!vis;
  if(vis){el.classList.toggle('pronto',hwSt().n>=HW_META);hwBadge()}
}
const hwPrev=k=>buildChar({...S.look,acc:{...(S.look.acc||{}),[SKINS[k].slot]:k}}).down[0].toDataURL();
async function hwMenu(){
  const h=hwSt(),n=Math.min(h.n,HW_META),barra=`<div class="hwbar"><i style="width:${n/HW_META*100}%"></i></div>`;
  const premios=`<div class="hwprem">${HW_PREMIOS.map(k=>`<figure><img src="${hwPrev(k)}" alt=""><figcaption>${HW_CURTO[k]}</figcaption></figure>`).join('')}</div>`;
  if(n<HW_META){
    const p=showPanel('Desafio de Halloween',{foot:'Só hoje, 31 de outubro!',body:`<div class="hwtxt">Vença <b>${HW_META} lutas</b> (no mato ou duelos) e escolha <b>um</b> dos prêmios.</div>${barra}<div class="hwtxt"><b>${n}/${HW_META}</b> lutas vencidas</div>${premios}`});
    await choose([{label:'Voltar'}],{root:p.list});return;
  }
  const p=showPanel('Desafio de Halloween',{foot:'Só dá pra escolher um!',body:`<div class="hwtxt">Desafio completo! Escolha seu prêmio:</div>${premios}`});
  const i=await choose([...HW_PREMIOS.map(k=>({label:SKINS[k].n})),{label:'Depois'}],{root:p.list});
  if(i<0||i>=HW_PREMIOS.length)return;
  const k=HW_PREMIOS[i];hidePanel();
  await say(`Pegar ${SKINS[k].n}? O outro prêmio some pra sempre.`);
  if(await choose([{label:'Sim'},{label:'Não'}],{cls:'side'})!==0)return;
  h.pick=k;S.skins=S.skins||[];if(!S.skins.includes(k))S.skins.push(k);save();jingle('vitoria');
  await say(`Feliz Halloween! Você ganhou ${SKINS[k].n}. Vá em TREINADOR › Visual pra usar.`);
}
$('#hwBtn').addEventListener('click',e=>{e.currentTarget.blur();if(started&&mode==='world'&&!busy)run(hwMenu)});

/* enfeites do dia: abóboras acesas nas portas, bandeirinhas nas fachadas, morcegos voando e o céu meio de entardecer */
const HWP=[0,1].map(f=>mk(16,15,g=>{
  const o='#5a2208',c=['#c86410','#f08a1c','#f8a83a'],glow=f?'#ffe46a':'#ffc83a';
  const px=(x,y,col)=>R(g,col,x,y);
  for(let y=3;y<15;y++)for(let x=0;x<16;x++){const nx=(x+.5-8)/7.6,ny=(y+.5-9)/5.8,d=nx*nx+ny*ny;if(d>1)continue;
    px(x,y,d>.78?o:c[(Math.abs(x-8)<2||Math.abs(x-3.5)<1)?2:nx<-.3||nx>.4?0:1])}
  R(g,'#3a7a2a',7,0,2,4);R(g,'#5aa03a',9,1,2,1);
  for(const[x,y]of[[4,7],[5,6],[5,7],[6,7],[10,7],[11,6],[11,7],[12,7]])px(x,y,glow);
  R(g,glow,5,10,7,2);px(4,10,glow);px(12,10,glow);R(g,c[1],7,10,1,1);R(g,c[1],9,11,1,1);
}));
const HWBAT=[0,1].map(f=>mk(13,7,g=>{const k='#2a1a34';R(g,k,5,2,3,3);R(g,'#ff5a3a',5,3,1,1);R(g,'#ff5a3a',7,3,1,1);R(g,k,5,1,1,1);R(g,k,7,1,1,1);
  if(f){R(g,k,1,0,4,2);R(g,k,8,0,4,2);R(g,k,0,1,1,2);R(g,k,12,1,1,2)}else{R(g,k,1,3,4,2);R(g,k,8,3,4,2);R(g,k,0,4,1,2);R(g,k,12,4,1,2)}}));
const hwF=ts=>Math.floor(ts/380)%2;
function hwPumpkin(x,y,ts,k=0){ctx.fillStyle='rgba(255,200,60,.18)';ctx.beginPath();ctx.ellipse(x+8,y+9,12,8,0,0,7);ctx.fill();ctx.drawImage(HWP[(hwF(ts)+k)%2],x,y)}
// varal de bandeirinhas laranja, roxa e preta com uma barriguinha no meio
function hwBunting(x0,x1,y){
  const n=Math.max(2,Math.floor((x1-x0)/9)),col=['#f08a1c','#7a3ac8','#2a1a34'];
  ctx.strokeStyle='#33293a';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,yy=y+Math.sin(Math.PI*t)*5;i?ctx.lineTo(x,yy):ctx.moveTo(x,yy)}ctx.stroke();
  for(let i=0;i<n;i++){const t=(i+.5)/n,x=x0+(x1-x0)*t,yy=Math.round(y+Math.sin(Math.PI*t)*5);
    ctx.fillStyle=col[i%3];ctx.beginPath();ctx.moveTo(x-4,yy);ctx.lineTo(x+4,yy);ctx.lineTo(x,yy+7);ctx.closePath();ctx.fill()}
}
function hwDecorPredios(cx,cy,ts){
  for(const b of BUILDINGS){const X=b.x*TS-cx,Y=b.y*TS-cy,W=b.w*TS,dx=b.door[0]*TS-cx,by=(b.y+b.h)*TS-cy;
    if(X>VW+40||X+W<-40||Y>VH+40||by<-40)continue;
    hwBunting(X+(b.kind==='centro'?-2:4),X+W+(b.kind==='centro'?2:-4),Y+(b.kind==='centro'?34:22));
    hwPumpkin(dx-18,by-15,ts);hwPumpkin(dx+TS+2,by-15,ts,1);
  }
}
function hwDecorCasas(doors,ts){for(const[X,Y,tx,ty]of doors){
  let l=tx,r=tx,t=ty;while(tileAt(l-1,ty)==='H')l--;while(tileAt(r+1,ty)==='H')r++;while(tileAt(tx,t-1)==='H')t--;
  hwBunting(X-(tx-l)*TS+4,X+(r-tx+1)*TS-4,Y-(ty-t-1)*TS+2);hwPumpkin(X-13,Y+TS-15,ts);hwPumpkin(X+TS-3,Y+TS-15,ts,1)}}
function hwCeu(ts){
  ctx.fillStyle='rgba(70,30,90,.2)';ctx.fillRect(0,0,VW,VH);
  for(let i=0;i<4;i++){const s=ts/1000*(14+i*4),x=((s*TS*.5+i*170)%(VW+80))-40,y=30+i*38+Math.sin(ts/600+i*2)*10;
    ctx.drawImage(HWBAT[(Math.floor(ts/150)+i)%2],Math.round(x),Math.round(y),26,14)}
}
function hwDecorDentro(cx,cy,ts){
  const I=INT[scene];hwBunting(TS*1-cx,TS*(I.w-1)-cx,TS*2-cy-6);
  // uma abóbora de cada lado da saída
  const fim=I.rows[I.rows.length-1],e0=fim.indexOf('E'),e1=fim.lastIndexOf('E'),y=(I.rows.length-2)*TS-cy+TS-16;
  hwPumpkin((e0-1)*TS-cx+8,y,ts);hwPumpkin((e1+1)*TS-cx+8,y,ts,1);
}

/* aviso do evento: aparece uma vez por dia, assim que a pessoa entra no mapa no dia do Halloween */
// trocar o nome da chave faz o aviso aparecer de novo pra quem já tinha visto (v2: com os locais dos Zubumas)
const HW_AVISO='zoobumon-hw-aviso-2';
let hwAvisando=false;
function hwAvisoPendente(){
  if(!hwAtivo()||hwAvisando||!started||mode!=='world'||busy)return false;
  let visto='';try{visto=localStorage.getItem(HW_AVISO)||''}catch(e){}
  return visto!==new Date().toDateString()||hwTeste&&!window.hwAvisoTeste;
}
async function hwAviso(){
  hwAvisando=true;window.hwAvisoTeste=1;
  try{localStorage.setItem(HW_AVISO,new Date().toDateString())}catch(e){}
  const ab=HWP[0].toDataURL(),mo=HWBAT[0].toDataURL();
  const zb=['zubumafilhohw','zubumapaihw','zubumavohw'].map(k=>`<figure><img src="${icon(k)}" alt=""><figcaption>${SPECIES[k].n}<small>${hwOnde(k).join(' · ')}</small></figcaption></figure>`).join('');
  const pr=HW_PREMIOS.map(k=>`<figure><img class="pr" src="${hwPrev(k)}" alt=""><figcaption>${HW_CURTO[k]}</figcaption></figure>`).join('');
  const el=document.createElement('div');el.id='hwAviso';el.setAttribute('role','dialog');el.setAttribute('aria-label','Evento de Halloween');
  el.innerHTML=`<div class="hwa">
    <img class="hwmo m1" src="${mo}" alt=""><img class="hwmo m2" src="${mo}" alt=""><img class="hwmo m3" src="${mo}" alt="">
    <div class="hwtit"><img src="${ab}" alt="">Noite de Halloween!<img src="${ab}" alt=""></div>
    <div class="hwsub">Só hoje, 31 de outubro</div>
    <div class="hwsec"><b>Desafio da Abóbora</b>Vença 30 lutas hoje e escolha <u>um</u> prêmio exclusivo:</div>
    <div class="hwrow">${pr}</div>
    <div class="hwsec"><b>Tem coisa estranha no mato…</b>A família Zubuma apareceu fantasiada! Hoje todo Zubumafilho vem de abóbora, e com sorte você acha o pai e o vô fantasiados também:</div>
    <div class="hwrow zb">${zb}</div>
    <button type="button" class="hwok">Bora caçar!</button>
    <div class="hwdica">Toque na abóbora do canto da tela pra ver seu progresso</div>
  </div>`;
  $('#game').appendChild(el);sfx('ok');
  await new Promise(res=>{let pop;const fim=()=>{pop();el.remove();res()};
    pop=pushH(b=>{if(b==='a'||b==='b'||b==='start')fim()});
    el.querySelector('.hwok').addEventListener('click',fim);el.querySelector('.hwok').focus()});
  hwAvisando=false;
}
