'use strict';
/* =================== batalha =================== */
// nomes compridos (Puxa-Saco Incompetente...) ganham letra menor pra caber na caixinha
const fitName=el=>{const n=el.textContent.length;el.parentElement.classList.toggle('nome-m',n>12&&n<=18);el.parentElement.classList.toggle('nome-g',n>18)};
function hud(){
  if(!B){$('#ehud').hidden=$('#phud').hidden=true;return}
  const e=B.team[B.ei],m=S.party[B.me];
  $('#ehud').hidden=!B.showE;$('#phud').hidden=!B.showP;
  if(e){dexSee(e.s);$('#ecap').hidden=!(B.wild&&dexOf().p[e.s]);$('#es').hidden=e.st!=='env';$('#en').textContent=nameOf(e);fitName($('#en'));$('#el').textContent='Nv'+e.lv;const t=SPECIES[e.s].t;$('#et').textContent=t;$('#et').style.background=TYPEC[t];setBar($('#ehp'),e.hp/maxHP(e,B.owner))}
  if(m){const mx=maxHP(m,S),t=SPECIES[m.s].t;$('#ps').hidden=m.st!=='env';$('#pn').textContent=nameOf(m);fitName($('#pn'));$('#pl').textContent='Nv'+m.lv;$('#pt').textContent=t;$('#pt').style.background=TYPEC[t];
    setBar($('#php'),m.hp/mx);$('#phpt').textContent=`${m.hp}/${mx}`;
    const a=xpFor(m.lv),b=xpFor(m.lv+1);$('#pxp').style.width=(m.lv>=100?100:clamp((m.xp-a)/(b-a)*100,0,100))+'%'}
}
const enemyLabel=()=>nameOf(B.team[B.ei])+(B.wild?' selvagem':' inimigo');
async function battleFx(){sfx('encontro');for(let i=0;i<2;i++){await fadeTo(.85,90,'#fff');await fadeTo(0,90)}await fadeTo(1,260,'#000')}
async function battle(opt){
  const team=opt.team;if(opt.owner)team.forEach(m=>m.hp=maxHP(m,opt.owner));
  B={team,ei:0,pvp:opt.pvp||null,owner:opt.owner||null,wild:!!opt.wild,name:opt.name||'',bg:opt.bg||'rota',me:S.party.findIndex(m=>m.hp>0),
    eX:200,pX:-140,eY:0,pY:0,eA:1,pA:0,eBlink:false,pBlink:false,ball:null,showE:false,showP:false};
  B.part=new Set([S.party[B.me]]);
  await battleFx();
  mode='battle';hud();
  const f=fadeTo(0,300);await tween(800,t=>{B.eX=(1-(1-(1-t)**2))*200});await f;
  B.showE=true;hud();
  if(B.wild)await say(`Um ${nameOf(team[0])} selvagem apareceu!`);
  else{await say(`${B.name} quer duelar!`);await say(`${B.name} mandou ${nameOf(team[0])}!`)}
  B.pA=1;await tween(350,t=>{B.pX=-(1-t)*140});
  B.showP=true;hud();
  await say(`Vai, ${nameOf(S.party[B.me])}!`);
  const r=B.pvp?await pvpLoop():await battleLoop();
  if(r==='win'){
    jingle('vitoria');
    if(B.wild){const c=5+team[0].lv*3;S.coins+=c;await say(`Você achou ${c} moedas no mato.`)}
    else{const rw=opt.reward||100;S.coins+=rw;S.wins++;await addTxp(25);await say(`Você venceu ${B.name}! Ganhou ${rw} moedas.`)}
  }else if(r==='lose'&&opt.friendly)await say(`Você perdeu para ${B.name}. Treine mais e volte!`);
  return r;
}
async function battleLoop(){
  while(true){
    const m=S.party[B.me];
    setText(`O que ${nameOf(m)} vai fazer?`,true);
    const a=await choose([{label:'LUTAR'},{label:'BOLSA'},{label:'ZOOBUMONS'},{label:'FUGIR'}],{cls:'battle',cols:2,cancel:false});
    let act;
    if(a===0){const i=await pickMove();if(i<0)continue;act={k:'move',mv:i===99?'desespero':m.moves[i]}}
    else if(a===1){const r=await battleBag();if(!r)continue;if(r==='caught')return'caught';act=r}
    else if(a===2){
      const i=await pickParty('Trocar por qual zoobumon?');
      if(i<0||i===B.me)continue;
      if(S.party[i].hp<=0){await say('Esse zoobumon está desmaiado!');continue}
      await switchTo(i,true);act={k:'switch'};
    }else{
      if(!B.wild){await say('Não dá pra fugir de um duelo!');continue}
      const me=st(m,'spd',S),en=st(B.team[B.ei],'spd',B.owner);
      if(me>=en||rnd()<.5+.4*me/en){await say('Você fugiu sem problemas!');return'run'}
      await say('Não deu pra fugir!');act={k:'fail'};
    }
    const res=await resolveTurn(act);
    if(res&&res!=='continue')return res;
    if(!res){const pr=await poisonTick();if(pr&&pr!=='continue')return pr}
  }
}
function aiPick(A,Ao,D){
  const sc=A.moves.map(k=>{const mv=MOVES[k];return mv.p*effOf(mv.t,SPECIES[D.s].t)*(SPECIES[A.s].t===mv.t?1.5:1)*(1+(bon(Ao).boost[mv.t]||0))*mv.a/100});
  if(rnd()<.75){let bi=0;sc.forEach((v,i)=>{if(v>sc[bi])bi=i});return A.moves[bi]}
  return A.moves[ri(0,A.moves.length-1)];
}
// fim do turno: quem está envenenado perde 1/8 da vida máxima
async function poisonTick(){
  for(const side of['me','en']){
    const m=side==='me'?S.party[B.me]:B.team[B.ei];if(!m||m.hp<=0||m.st!=='env')continue;
    const mx=maxHP(m,side==='me'?S:B.owner);m.hp=Math.max(0,m.hp-Math.max(1,Math.floor(mx/8)));hud();
    for(let i=0;i<2;i++){if(side==='me')B.pBlink=true;else B.eBlink=true;await sleep(80);B.pBlink=B.eBlink=false;await sleep(80)}
    await say(`${side==='me'?nameOf(m):enemyLabel()} sofre com o veneno!`);
    if(m.hp<=0){const r=await fainted(side);if(r)return r}
  }
  return null;
}
async function resolveTurn(act){
  const E=B.team[B.ei],M=S.party[B.me];
  const em=aiPick(E,B.owner,M);
  if(act.k==='move'){
    const ms=st(M,'spd',S),es=st(E,'spd',B.owner);
    const order=ms>es||(ms===es&&brnd()<.5)?['me','en']:['en','me'];
    for(const who of order){const r=await attack(who,who==='me'?act.mv:em);if(r)return r}
    return null;
  }
  return await attack('en',em);
}
async function attack(side,mvId){
  const me=side==='me',A=me?S.party[B.me]:B.team[B.ei],D=me?B.team[B.ei]:S.party[B.me];
  const Ao=me?S:B.owner,Do=me?B.owner:S,mv=MOVES[mvId];
  if(me&&!B.pvp)usePP(A,mvId);
  await say(`${me?nameOf(A):enemyLabel()} usou ${mv.n}!`);
  await tween(180,t=>{const o=Math.sin(t*Math.PI)*12;if(me){B.pX=o;B.pY=-o/3}else{B.eX=-o;B.eY=o/3}});
  B.pX=B.pY=0;B.eX=0;B.eY=0;
  if(brnd()*100>=mv.a){sfx('erro');await say('Mas errou!');return null}
  const r=calcDamage(A,Ao,D,Do,mv);
  sfx(r.eff>1||r.crit?'superhit':r.eff<1?'fraco':'hit');
  for(let i=0;i<4;i++){if(me)B.eBlink=true;else B.pBlink=true;await sleep(65);B.eBlink=B.pBlink=false;await sleep(65)}
  D.hp=Math.max(0,D.hp-r.dmg);hud();await sleep(520);
  if(mvId==='desespero'&&A.hp>0){A.hp=Math.max(0,A.hp-Math.max(1,Math.floor(r.dmg/4)));hud();await say(`${me?nameOf(A):enemyLabel()} se machucou no desespero!`);if(A.hp<=0)return await fainted(me?'me':'en')}
  if(mv.t==='Planta'&&D.hp>0&&!D.st&&SPECIES[D.s].t!=='Planta'&&brnd()<.1){D.st='env';hud();await say(`${me?enemyLabel():nameOf(D)} foi envenenado!`)}
  if(r.crit)await say('Um golpe crítico!');
  if(r.eff>1)await say('É super eficaz!');else if(r.eff<1)await say('Não é muito eficaz...');
  if(D.hp<=0)return await fainted(me?'en':'me');
  return null;
}
async function fainted(side){
  if(side==='en'){
    sfx('desmaio');await tween(420,t=>{B.eY=t*40;B.eA=1-t});
    await say(`${enemyLabel()} desmaiou!`);
    const e=B.team[B.ei];
    // no duelo ao vivo não tem XP no meio da luta (mudaria os números de um lado só)
    if(!B.pvp){
      const gain=Math.max(1,Math.floor(SPECIES[e.s].xp*e.lv/6*(B.wild?1:1.4)*(1+bon(S).xp)));
      const quem=[...(B.part||[])].filter(m=>m.hp>0&&S.party.includes(m));if(!quem.length)quem.push(S.party[B.me]);
      const parte=Math.max(1,Math.floor(gain/quem.length));
      if(quem.length>1)await say(`O XP foi dividido entre ${quem.length} zoobumons que lutaram.`);
      for(const m of quem)await giveXP(m,parte);
      await addTxp(Math.ceil(gain/4));
    }
    const nx=B.pvp?B.team.findIndex(m=>m.hp>0):B.team.findIndex((m,i)=>i>B.ei&&m.hp>0);
    if(nx>=0){
      B.ei=nx;B.eY=0;B.eA=1;B.eX=140;B.part=new Set([S.party[B.me]]);hud();
      await tween(400,t=>{B.eX=(1-t)*140});
      await say(`${B.name} mandou ${nameOf(B.team[nx])}!`);
      return'continue';
    }
    return'win';
  }
  sfx('desmaio');await tween(420,t=>{B.pY=t*50;B.pA=1-t});
  await say(`${nameOf(S.party[B.me])} desmaiou!`);
  if(!S.party.some(m=>m.hp>0))return'lose';
  let i;
  if(B.pvp)i=S.party.findIndex(m=>m.hp>0);
  else do{i=await pickParty('Escolha o próximo zoobumon',{force:true})}while(i<0||S.party[i].hp<=0);
  await switchTo(i,false);
  return'continue';
}
async function switchTo(i,voluntary){
  if(voluntary){await say(`Volta, ${nameOf(S.party[B.me])}!`);await tween(300,t=>{B.pX=-t*140})}
  B.me=i;B.pY=0;B.pA=1;B.pX=-140;if(B.part)B.part.add(S.party[i]);hud();
  await tween(350,t=>{B.pX=-(1-t)*140});
  await say(`Vai, ${nameOf(S.party[i])}!`);
}
async function addTxp(n){const b=tlevel(S.txp);S.txp+=n;const a=tlevel(S.txp);if(a>b){const fb=Math.min(10,Math.floor(a/5)),ib=Math.min(10,Math.floor(b/5));await say(fb>ib?`Seu nível de treinador subiu para ${a}! Seus zoobumons ganham +${fb}% de ataque e defesa.`:`Seu nível de treinador subiu para ${a}!`)}}
async function giveXP(m,amt){
  await say(`${nameOf(m)} ganhou ${amt} pontos de XP!`);
  m.xp+=amt;hud();await sleep(300);
  while(m.lv<100&&m.xp>=xpFor(m.lv+1)){
    const old=maxHP(m,S);m.lv++;m.hp+=maxHP(m,S)-old;hud();
    jingle('levelup');await say(`${nameOf(m)} subiu para o nível ${m.lv}!`);
    for(const[l,k]of SPECIES[m.s].ls)if(l===m.lv&&!m.moves.includes(k))await learn(m,k);
    const ev=SPECIES[m.s].evo;if(ev&&m.lv>=ev[1])m.evoPending=true;
    hud();
  }
}
async function learn(m,k){
  const nv=MOVES[k];
  if(m.moves.length<4){m.moves.push(k);await say(`${nameOf(m)} aprendeu ${nv.n}!`);return}
  await say(`${nameOf(m)} quer aprender ${nv.n} (${nv.t}, poder ${nv.p}), mas já sabe 4 golpes.`);
  while(true){
    setText(`Esquecer qual golpe pra aprender ${nv.n}?`);
    const opts=m.moves.map(x=>({label:`${MOVES[x].n} · ${MOVES[x].t} · poder ${MOVES[x].p}`}));opts.push({label:`Não aprender ${nv.n}`});
    const i=await choose(opts,{cls:'side',cancel:false});
    if(i<4&&i>=0){const old=MOVES[m.moves[i]].n;if(m.pp)delete m.pp[m.moves[i]];m.moves[i]=k;await say(`1, 2 e... pronto! ${nameOf(m)} esqueceu ${old} e aprendeu ${nv.n}!`);return}
    setText(`Desistir de aprender ${nv.n}?`);
    if(await choose([{label:'SIM'},{label:'NÃO'}],{cls:'yesno',cancel:false})===0){await say(`${nameOf(m)} não aprendeu ${nv.n}.`);return}
  }
}
async function pickMove(){
  const m=S.party[B.me],e=B.team[B.ei];
  if(m.moves.every(k=>ppOf(m,k)<=0)){await say(`${nameOf(m)} não tem mais PP em nenhum golpe!`);return 99}
  const items=m.moves.map(k=>({label:MOVES[k].n,k,confirm:true,disabled:ppOf(m,k)<=0}));
  while(items.length<4)items.push({label:'—',disabled:true});
  items.push({label:'◀ Voltar'});
  const mi=$('#minfo');mi.hidden=false;$('#textbox').hidden=true;
  const i=await choose(items,{cls:'moves',cols:2,onMove:it=>{
    if(!it.k){mi.innerHTML=it.label==='◀ Voltar'?'Voltar pro menu da batalha':'';return}
    const mv=MOVES[it.k],ef=effOf(mv.t,SPECIES[e.s].t);
    const pp=ppOf(m,it.k),pm=ppMax(it.k);
    mi.innerHTML=`${chip(mv.t)}<div class="${pp<=Math.ceil(pm/4)?'ppbaixo':''}">PP ${pp}/${pm}</div><div>Poder ${mv.p}</div><div>Precisão ${mv.a}%</div><div class="eff">${ef>1?'Super eficaz!':ef<1?'Pouco eficaz':''}</div><div class="dica">Toque de novo pra usar</div>`;
  }});
  mi.hidden=true;return i>=4?-1:i;
}
async function battleBag(){
  const ids=Object.keys(ITEMS).filter(k=>S.bag[k]>0);
  if(!ids.length){await say('Sua bolsa está vazia.');return null}
  const p=showPanel('Bolsa');
  const i=await choose(ids.map(k=>({html:`<div class="pinfo"><b>${ITEMS[k].n}</b><small>${ITEMS[k].d}</small></div><span class="r">x${S.bag[k]}</span>`})),{root:p.list});
  hidePanel();
  if(i<0)return null;
  const id=ids[i],it=ITEMS[id];
  if(it.net){if(!B.wild){await say('Não dá pra capturar o zoobumon de outro treinador!');return null}return await throwNet(id)}
  const t=await pickParty('Usar em qual zoobumon?');if(t<0)return null;
  const m=S.party[t],mx=maxHP(m,S);
  if(it.cure){if(m.hp<=0||m.st!==it.cure){await say('Não vai ter efeito.');return null}delete m.st;S.bag[id]--;hud();await say(`${nameOf(m)} não está mais envenenado!`);return{k:'item'}}
  if(it.pp){if(m.hp<=0||!m.pp||!Object.keys(m.pp).length){await say('Não vai ter efeito.');return null}restorePP(m);S.bag[id]--;await say(`Os golpes de ${nameOf(m)} estão com PP cheio!`);return{k:'item'}}
  if(m.hp<=0||m.hp>=mx){await say('Não vai ter efeito.');return null}
  const h=Math.min(it.heal,mx-m.hp);m.hp+=h;S.bag[id]--;hud();
  await say(`${nameOf(m)} recuperou ${h} PV.`);
  return{k:'item'};
}
async function throwNet(id){
  const net=ITEMS[id],e=B.team[B.ei],sp=SPECIES[e.s];
  S.bag[id]--;
  await say(`Você jogou uma ${net.n}!`);sfx('lanca');
  // 1) a rede vai enrolada girando até em cima do zoobumon
  const N=B.net={bundle:true,x:44,y:104,rot:0,gold:id==='redeouro',w:8,h:10,top:6,wob:0,a:1};
  await tween(600,t=>{N.x=44+132*t;N.y=104-86*t-Math.sin(t*Math.PI)*34;N.rot=t*14});
  // 2) abre no ar e 3) cai cobrindo o zoobumon
  N.bundle=false;N.x=176;
  await tween(200,t=>{N.w=10+66*t;N.h=8+6*t;N.top=8-2*t});
  await tween(260,t=>{const k=t*t;N.top=6+8*k;N.h=14+48*k});
  await tween(180,t=>{N.wob=Math.sin(t*Math.PI)*-1.5;B.eShake=Math.sin(t*Math.PI)*-1});
  N.wob=0;B.eShake=0;
  const p=clamp(sp.cr*(1-.66*e.hp/maxHP(e,null))*net.net*(1+bon(S).cap),.03,.97);
  const q=Math.cbrt(p);let s=0;while(s<3&&rnd()<q)s++;
  // 4) o zoobumon se debate: cada sacudida que a rede aguenta é uma chance a menos de escapar
  const struggle=async(f=1)=>{await tween(620,t=>{const w=Math.sin(t*Math.PI*4)*(1-t*.4)*5*f;N.wob=w;B.eShake=w*.7;B.eY=-Math.abs(Math.sin(t*Math.PI*4))*1.5*f});N.wob=0;B.eShake=0;B.eY=0};
  for(let i=0;i<s;i++){await sleep(i?520:420);sfx('sacode');await struggle(1)}
  await sleep(450);
  if(s===3){
    // 5) a rede fecha e brilha
    await tween(240,t=>{N.w=76-6*t;N.top=14+2*t;N.h=62-2*t});
    B.stars=Array.from({length:7},(_,i)=>{const a=-Math.PI*(i/6);return{x:176,y:30,dx:Math.cos(a),dy:Math.sin(a)}});
    await tween(700,t=>{B.starT=t});
    B.stars=null;B.starT=0;
    jingle('captura');await say(`Peguei! ${sp.n} foi capturado!`);
    S.caught++;dexCatch(e.s);
    if(S.party.length<6){S.party.push(e);await say(`${sp.n} entrou no seu time.`)}
    else{S.box.push(e);await say(`Seu time está cheio. ${sp.n} foi pra Caixa.`)}
    await addTxp(10);
    return'caught';
  }
  // escapou: uma sacudida forte, rasga a rede e pula pra fora
  sfx('sacode');await struggle(1.6);sfx('escapa');
  await tween(420,t=>{N.top=14-70*t;N.a=1-t;N.wob=Math.sin(t*Math.PI*3)*6;B.eY=-Math.sin(t*Math.PI)*10});
  B.net=null;B.eY=0;
  await say(['Ah não! Escapou na hora!','Quase! Ele se soltou.','Por um triz!'][s]||'Escapou!');
  return{k:'item'};
}
async function fight(opt){
  // duelo ao vivo: luta com o time do código trocado e o time de verdade volta no fim
  const real=opt.pvp?S.party:null;
  if(opt.pvp){S.party=opt.mine;brnd=mulberry32(opt.pvp.seed)}
  if(!S.party.some(m=>m.hp>0)){await say('Seus zoobumons estão sem forças! Vá até a UPA.');return}
  const snap=opt.friendly&&!opt.pvp?S.party.map(m=>m.hp):null;
  const r=await battle(opt);
  await fadeTo(1,300,'#000');
  B=null;mode='world';hud();hideText();$('#menu').hidden=true;
  if(real){S.party=real;brnd=Math.random}
  if(snap)S.party.forEach((m,i)=>{m.hp=Math.min(snap[i],maxHP(m,S))});
  if(r==='lose'&&!opt.friendly){
    const lost=Math.floor(S.coins/2);S.coins-=lost;
    await say('Todos os seus zoobumons desmaiaram...');
    await say(`Você correu pra UPA e deixou cair ${lost} moedas no caminho.`);
    healAll();scene='mundo';P.x=S.respawn.x;P.y=S.respawn.y;P.dir='down';P.moving=false;curZone=zoneAt(P.x,P.y);
    hideText();
  }
  await fadeTo(0,300);
  for(const m of S.party)if(m.evoPending){const ev=SPECIES[m.s].evo;if(ev&&m.lv>=ev[1])await evolve(m);else m.evoPending=false}
  save();
  return r;
}
async function evolve(m){
  const to=SPECIES[m.s].evo[0],from=nameOf(m);
  mode='evo';EVO={a:m.s,b:to,show:'fa'};
  await say(`Hã? ${from} está evoluindo!`);
  let iv=280;
  for(let i=0;i<14;i++){EVO.show=i%2?'wb':'wa';await sleep(iv);iv=Math.max(55,iv*.82)}
  EVO.show='wb';await sleep(450);EVO.show='fb';
  const old=maxHP(m,S);m.s=to;m.hp+=maxHP(m,S)-old;m.evoPending=false;dexCatch(to);
  jingle('evoluiu');await say(`Parabéns! ${from} evoluiu para ${nameOf(m)}!`);
  mode='world';EVO=null;
}
function rivalTeam(){
  const L=Math.max(5,...S.party.map(m=>m.lv));
  let s={pintobrasa:'gotinho',gotinho:'brotelo',brotelo:'pintobrasa'}[S.starter]||'gotinho';
  if(L>=SPECIES[s].evo[1])s=SPECIES[s].evo[0];
  const t=[];
  if(L>=8)t.push(mkMon(L-2>=SPECIES.ratuxo.evo[1]?'ratazao':'ratuxo',L-2));
  if(L>=11)t.push(mkMon(L-1>=SPECIES.caramelo.evo[1]?'caramelao':'caramelo',L-1));
  t.push(mkMon(s,L));
  return t;
}
async function rivalTalk(n){
  if(!S.rivalMet){await say(`${n.name}: E aí, ${S.name}! Também peguei meu primeiro zoobumon.`);S.rivalMet=true}
  setText(`${n.name}: Bora ver quem treinou mais? Valendo moedas!`);
  const i=await choose([{label:'SIM'},{label:'NÃO'}],{cls:'yesno'});
  if(i!==0){await say(`${n.name}: Amarelou? Tô aqui quando quiser.`);return}
  const team=rivalTeam();
  await fight({team,owner:{cls:null,eq:[],txp:S.txp},name:n.name,bg:'vila',friendly:true,reward:80+team[team.length-1].lv*15});
}
async function startWild(){
  const z=zoneAt(P.x,P.y),tb=ENC[z]||ENC.rota;
  let r=rnd()*tb.reduce((a,e)=>a+e[1],0),pk=tb[0];
  for(const e of tb){if((r-=e[1])<0){pk=e;break}}
  // cada região tem a sua faixa de nível fixa (é a que o Prof. Ipê fala); pra treinar mais, vá pra região seguinte
  const lv=ri(pk[2],pk[3]);
  let sp=pk[0];while(SPECIES[sp].evo&&lv>=SPECIES[sp].evo[1])sp=SPECIES[sp].evo[0];
  await fight({team:[mkMon(sp,lv)],wild:true,bg:z});
}

