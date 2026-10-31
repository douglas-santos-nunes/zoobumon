'use strict';
/* =================== menus =================== */
async function startMenu(){
  while(true){
    const ops=['ZOOBUDEX','ZOOBUMONS','BOLSA','MAPA','TIPOS','TREINADOR','RANKING','DUELO','SOM','SALVAR','FECHAR'];
    const i=await choose(ops.map(l=>({label:l})),{cls:'side',cols:2}),op=ops[i];
    if(i<0||op==='FECHAR')return;
    if(op==='RANKING'){await rankMenu();hidePanel();continue}
    if(op==='SOM'){await somMenu();continue}
    if(op==='ZOOBUDEX')await dexMenu();
    else if(op==='ZOOBUMONS')await zoobumonsMenu();
    else if(op==='BOLSA')await bagMenu();
    else if(op==='MAPA')await mapaMenu();
    else if(op==='TIPOS')await tiposMenu();
    else if(op==='TREINADOR')await trainerMenu();
    else if(op==='DUELO'){
      const t=await duelPanel();hidePanel();
      if(t){await say(`${t.name} te desafiou com ${t.team.length} zoobumon(s)!`);await fight({team:t.team,owner:t.owner,name:t.name,bg:'vila',friendly:true,reward:100});return}
    }
    else{save();await say('Jogo salvo neste navegador.');hideText()}
    hidePanel();
  }
}
async function pickParty(title,{force=false}={}){
  const p=showPanel(title);
  const i=await choose(S.party.map(m=>({html:monRow(m)})),{root:p.list,cancel:!force});
  hidePanel();return i;
}
// o time anda com até 6; os outros ficam guardados e só saem pelo PC da UPA
async function zoobumonsMenu(){
  let sel=0;
  while(true){
    const p=showPanel(`Seu time (${S.party.length}/6)`,{foot:`★ = principal, entra primeiro na batalha.${S.box.length?` ${S.box.length} guardado(s) no PC da UPA.`:''}`});
    const i=await choose(S.party.map((m,k)=>({html:monRow(m,k===0)})),{root:p.list,start:sel});
    if(i<0)return;
    sel=i;
    const m=S.party[i];
    const a=await choose([{label:'Ver ficha'},{label:i===0?'★ Já é o principal':'★ Deixar como principal',disabled:i===0},{label:'Voltar'}],{cls:'side'});
    if(a===0)await monSheet(m);
    else if(a===1){S.party.splice(i,1);S.party.unshift(m);sel=0;save()}
  }
}
async function monSheet(m){
  const sp=SPECIES[m.s],b=xpFor(m.lv+1);
  const p=showPanel(sp.n,{body:`<div class="sheetm"><img class="big" src="${icon(m.s)}" alt=""><div>
    <div>${chip(sp.t)} Nível ${m.lv}</div><div>PV ${m.hp}/${maxHP(m,S)}</div>
    <div>ATQ ${st(m,'atk',S)} · DEF ${st(m,'def',S)} · VEL ${st(m,'spd',S)}</div>
    <div>Faltam ${Math.max(0,b-m.xp)} de XP pro próximo nível</div>${sp.evo?`<div>Evolui no nível ${sp.evo[1]}</div>`:''}</div></div>
    <div class="mvs">${m.moves.map(k=>`<div>${chip(MOVES[k].t)} ${MOVES[k].n} <small>PP ${ppOf(m,k)}/${ppMax(k)} · Poder ${MOVES[k].p}</small></div>`).join('')}</div>`});
  await choose([{label:'Voltar'}],{root:p.list});
}
// ranking: sua posição em cima e o top 10 dos treinadores (por XP de treinador)
async function rankMenu(){
  const p=showPanel('Ranking dos treinadores',{body:'<p>Carregando o ranking...</p>'});
  const r=await rankLoad();
  const row=(n,x,eu,k)=>`<div class="rk${eu?' eu':''}" data-k="${k}" role="button" tabindex="0"><span class="rkp">${n<=3?['🥇','🥈','🥉'][n-1]:n+'º'}</span><div class="pinfo"><b>${esc(x.nome)}${jogandoAgora(x)?' <i class="onl" title="Jogando agora"></i>':''}</b><small>Nv de treinador ${x.nivel} · ${x.pegos} pegos · melhor zoobumon Nv ${x.melhor}</small></div><span class="r">${x.txp} XP</span></div>`;
  if(r.off)p.body.innerHTML='<p>Entre com a sua conta pra aparecer no ranking e ver os outros treinadores.</p>';
  else if(r.err)p.body.innerHTML='<p>Não deu pra carregar o ranking agora. Confira a internet e tente de novo.</p>';
  else p.body.innerHTML=`<div class="rkhead">Você</div>${row(r.pos,r.mine,true,'eu')}<div class="rkhead">Top 10 · toque num treinador pra ver o perfil</div>${r.top.map((x,k)=>row(k+1,x,x.user_id===r.mine.user_id,k)).join('')||'<p>Ninguém no ranking ainda.</p>'}`;
  p.body.classList.add('grow');
  // tocar num treinador abre o perfil dele por cima; Voltar fecha o perfil e depois o ranking
  let open=null;
  p.body.onclick=e=>{const el=e.target.closest('.rk[data-k]');if(!el||r.off||r.err)return;const k=el.dataset.k,x=k==='eu'?r.mine:r.top[+k];if(!x)return;sfx('ok');open=x;rankProfile(x,k==='eu'?r.pos:+k+1)};
  while(true){
    await choose([{label:'Voltar'}],{root:p.list});
    if(open&&!$('#rkpf').hidden){$('#rkpf').hidden=true;open=null;continue}
    break;
  }
  p.body.onclick=null;$('#rkpf').hidden=true;
}
// ficha do outro treinador: boneco (visual e skins), números e o time com o principal marcado
function rankProfile(x,pos){
  let el=$('#rkpf');if(!el){el=document.createElement('div');el.id='rkpf';$('#pbody').after(el)}
  const look=safeLook(x.visual),spr=buildChar(look).down[0],pv=mk(32,48,g=>g.drawImage(spr,0,0)).toDataURL();
  const time=(Array.isArray(x.time)?x.time:[]).filter(t=>Array.isArray(t)&&SPECIES[t[0]]).slice(0,6);
  el.innerHTML=`<div class="sheetm"><img class="big pf" src="${pv}" alt="Boneco de ${esc(x.nome)}"><div>
    <div><b>${esc(x.nome)}</b> <small>${pos}º no ranking</small></div>
    <div class="pfon">${jogandoAgora(x)?'<i class="onl"></i> Jogando agora':esc(vistoHa(x))}</div>
    <div>Nível de treinador ${x.nivel} · ${x.txp} XP</div>
    <div>${x.pegos} zoobumons pegos · ${x.vitorias||0} duelos vencidos</div></div></div>
    <div class="rkhead">Time atual</div>
    <div class="pftime">${time.map(([s,lv],i)=>`<div class="pfm${i?'':' lead'}"><img src="${icon(s)}" alt=""><b>${i?'':'★ '}${esc(SPECIES[s].n)}</b><small>Nv ${lv|0}</small>${chip(SPECIES[s].t)}</div>`).join('')||'<p>Sem zoobumons no time.</p>'}</div>`;
  el.hidden=false;el.scrollTop=0;
}
// Zoobudex: como na FireRed. Nunca visto = só o número; visto = só a foto; pego = foto, nome e a ficha completa
const dexNum=i=>'#'+String(i+1).padStart(3,'0');
async function dexMenu(){
  let sel=0,msg='';
  while(true){
    const d=dexOf(),ids=Object.keys(SPECIES).filter(k=>!SPECIES[k].hw||d.v[k]||d.p[k]),nv=ids.filter(k=>d.v[k]).length,np=ids.filter(k=>d.p[k]).length;
    const p=showPanel('Zoobudex',{foot:msg||`Vistos ${nv} · Pegos ${np} de ${ids.length}`});
    const items=ids.map((k,i)=>{
      const pego=d.p[k],visto=d.v[k],sp=SPECIES[k];
      const img=visto?`<img src="${icon(k)}" alt="">`:'<span class="dexvazio"></span>';
      const nome=pego?sp.n:visto?'?????':'———';
      return{html:`<span class="dexn">${dexNum(i)}</span>${img}<div class="pinfo"><b>${esc(nome)}</b><small>${pego?chip(sp.t):visto?'Visto em batalha':''}</small></div>${pego?'<span class="r">●</span>':''}`};
    });
    items.push({label:'Voltar'});
    const i=await choose(items,{root:p.list,start:sel});
    if(i<0||i===ids.length)return;
    sel=i;const k=ids[i];
    if(d.p[k]){await dexEntry(k,i);msg=''}
    else msg=d.v[k]?'Você só viu esse em batalha. Pegue um pra ver a ficha.':'Ainda não visto. Explore o mato alto!';
  }
}
async function dexEntry(k,i){
  const sp=SPECIES[k],d=dexOf(),b=sp.b;
  const nomeDe=id=>d.v[id]?SPECIES[id].n:'?????';
  const from=Object.keys(SPECIES).find(x=>SPECIES[x].evo&&SPECIES[x].evo[0]===k);
  const onde=Object.entries(ENC).filter(([,l])=>l.some(e=>e[0]===k)).map(([z,l])=>{const e=l.find(e=>e[0]===k);return`${ZNAME[z]} (Nv ${e[2]}-${e[3]})`});
  const bar=(l,v)=>`<div class="dexst"><span>${l}</span><i style="width:${Math.min(100,v/1.3)}%"></i><b>${v}</b></div>`;
  const p=showPanel(`${dexNum(i)} ${sp.n}`,{body:`<div class="sheetm"><img class="big" src="${icon(k)}" alt=""><div>
    <div>${chip(sp.t)}</div>
    ${from?`<div>Evolui de ${esc(nomeDe(from))} no nível ${SPECIES[from].evo[1]}</div>`:''}
    ${sp.evo?`<div>Evolui pra ${esc(nomeDe(sp.evo[0]))} no nível ${sp.evo[1]}</div>`:'<div>Não evolui</div>'}
    <div>Onde achar: ${sp.hw?`só no Halloween (31/10), em ${hwOnde(k).join(', ')}`:onde.length?onde.join(', '):'não aparece no mato (só por evolução ou como inicial)'}</div></div></div>
    <div class="dexsts">${bar('PV',b.hp)}${bar('ATQ',b.atk)}${bar('DEF',b.def)}${bar('VEL',b.spd)}</div>
    <div class="mvs">${sp.ls.map(([l,m])=>`<div>${chip(MOVES[m].t)} ${MOVES[m].n} <small>Nv ${l} · Poder ${MOVES[m].p}</small></div>`).join('')}</div>`});
  p.body.classList.add('grow');
  await choose([{label:'Voltar'}],{root:p.list});
}
// PC da UPA: retirar e guardar
async function pcMenu(){
  await say(`${S.name} ligou o PC. Sistema de guarda de zoobumons aberto.`);hideText();
  let msg='';
  while(true){
    const p=showPanel(`PC · time ${S.party.length}/6 · guardados ${S.box.length}`,{foot:msg});
    const i=await choose([
      {html:'<div class="pinfo"><b>Retirar zoobumon</b><small>Trazer um zoobumon guardado pro time</small></div>'},
      {html:'<div class="pinfo"><b>Guardar zoobumon</b><small>Deixar um zoobumon do time guardado aqui</small></div>'},
      {label:'Desligar o PC'}],{root:p.list});
    if(i<0||i===2){hidePanel();return}
    if(i===0){
      if(!S.box.length){msg='Não tem nenhum zoobumon guardado.';continue}
      if(S.party.length>=6){msg='Seu time já tem 6. Guarde um antes de retirar outro.';continue}
      const q=showPanel(`Guardados (${S.box.length})`,{foot:'Escolha quem vai pro time.'});
      const k=await choose(S.box.map(m=>({html:monRow(m)})),{root:q.list});
      if(k<0){msg='';continue}
      const m=S.box.splice(k,1)[0];m.hp=maxHP(m,S);S.party.push(m);msg=`${nameOf(m)} entrou no time.`;
    }else{
      if(S.party.length<=1){msg='Você precisa andar com pelo menos 1 zoobumon.';continue}
      const q=showPanel(`Seu time (${S.party.length}/6)`,{foot:'Escolha quem vai ficar guardado.'});
      const k=await choose(S.party.map(m=>({html:monRow(m)})),{root:q.list});
      if(k<0){msg='';continue}
      if(S.party.filter((m,j)=>j!==k&&m.hp>0).length===0){msg='Fique com pelo menos 1 zoobumon que ainda consegue lutar.';continue}
      const m=S.party.splice(k,1)[0];S.box.push(m);msg=`${nameOf(m)} foi guardado no PC.`;
    }
    save();
  }
}
async function bagMenu(){
  let msg='';
  while(true){
    const ids=Object.keys(ITEMS).filter(k=>S.bag[k]>0);
    const p=showPanel('Bolsa',{foot:msg,body:ids.length?'':'Bolsa vazia. Compre itens na Loja da vila.'});
    const i=await choose([...ids.map(k=>({html:`<div class="pinfo"><b>${ITEMS[k].n}</b><small>${ITEMS[k].d}</small></div><span class="r">x${S.bag[k]}</span>`})),{label:'Voltar'}],{root:p.list});
    if(i<0||i===ids.length)return;
    const it=ITEMS[ids[i]];
    if(it.net){msg='Redes são usadas na batalha contra zoobumons selvagens.';continue}
    const t=await pickParty('Usar em qual zoobumon?');
    if(t<0){msg='';continue}
    const m=S.party[t],mx=maxHP(m,S);
    if(m.hp<=0){msg='Zoobumon desmaiado: leve à UPA.';continue}
    if(it.cure){if(m.st!==it.cure){msg='Esse não está envenenado.';continue}delete m.st;S.bag[ids[i]]--;msg=`${nameOf(m)} não está mais envenenado!`;continue}
    if(it.pp){if(!m.pp||!Object.keys(m.pp).length){msg='Os golpes dele já estão com PP cheio.';continue}restorePP(m);S.bag[ids[i]]--;msg=`Os golpes de ${nameOf(m)} estão com PP cheio!`;continue}
    if(m.hp>=mx){msg='Esse já está com a vida cheia.';continue}
    const h=Math.min(it.heal,mx-m.hp);m.hp+=h;S.bag[ids[i]]--;msg=`${nameOf(m)} recuperou ${h} PV.`;
  }
}
const pc=v=>Math.round(v*100)+'%';
let charIcon='';
function refreshLook(){charSpr=buildChar(S.look);charIcon=mk(32,48,g=>g.drawImage(charSpr.down[0],0,0)).toDataURL()}
async function trainerMenu(){
  while(true){
    const bo=bon(S),tl=tlevel(S.txp),nx=30*tl*tl;
    const p=showPanel('Ficha do treinador',{body:`<div class="sheetm"><img class="big" src="${charIcon}" alt=""><div>
      <div><b>${esc(S.name)}</b></div>
      <div>Nível de treinador ${tl} <small>(${S.txp}/${nx} XP)</small></div>
      <div>Moedas: ${S.coins} · Capturados: ${S.caught} · Duelos vencidos: ${S.wins}</div>
      <div>Equipado: ${S.eq.length?S.eq.map(g=>GEAR[g].n).join(', '):'nada'}</div>
      <div class="bonus">Bônus: ATQ +${pc(bo.atk)} · DEF +${pc(bo.def)} · Captura +${pc(bo.cap)} · XP +${pc(bo.xp)}</div></div></div>`});
    const i=await choose([{label:`Equipamentos (${S.eq.length}/2 em uso)`},{label:`Visual · skins (${(S.skins||[]).length})`},{label:'Aparência · cabelo, barba e cores'},{label:'Voltar'}],{root:p.list});
    if(i===0)await equipMenu();
    else if(i===1)await wardrobeMenu();
    else if(i===2)await lookMenu();
    else return;
  }
}
async function equipMenu(){
  let msg='Escolha até 2. A Loja da vila vende mais.',sel=0;
  while(true){
    const p=showPanel('Equipamentos',{foot:msg,body:S.gear.length?'':'Você ainda não tem equipamentos.'});
    const items=S.gear.map(g=>({html:`<div class="pinfo"><b>${S.eq.includes(g)?'[E] ':''}${GEAR[g].n}</b><small>${GEAR[g].d}</small></div><span class="r">${S.eq.includes(g)?'em uso':''}</span>`}));
    items.push({label:'Voltar'});
    const i=await choose(items,{root:p.list,start:sel});
    if(i<0||i===S.gear.length)return;
    sel=i;const g=S.gear[i];
    if(S.eq.includes(g)){S.eq=S.eq.filter(x=>x!==g);msg=`${GEAR[g].n} guardado.`}
    else if(S.eq.length>=2)msg='Você já usa 2 itens. Tire um antes.';
    else{S.eq.push(g);msg=`${GEAR[g].n} equipado!`}
  }
}
// aparência: troca personagem, cabelo, barba e cores a qualquer hora, de graça
async function lookMenu(){
  const L=JSON.parse(JSON.stringify(S.look));L.acc=L.acc||{};
  let beardPicked=!!L.beardColor&&L.beardColor!==L.hair;
  const p=showPanel('Aparência',{foot:'Toque nas opções pra ver como fica.'});
  p.body.hidden=false;p.body.classList.add('grow');
  const chips=(attr,obj,cur)=>Object.entries(obj).map(([k,n])=>`<button type="button" class="chipbtn" data-${attr}="${k}" aria-pressed="${cur===k}">${n}</button>`).join('');
  const draw=()=>{
    const pv=mk(32,48,g=>g.drawImage(buildChar(L).down[0],0,0)).toDataURL();
    const rows=[['hair','Cor do cabelo',HAIR],...(L.sex==='m'&&L.beard!=='nenhuma'?[['beardColor','Cor da barba',BEARDC]]:[]),['skin','Pele',SKIN],['shirt','Roupa',SHIRT],['pants','Calça',PANTS]];
    p.body.innerHTML=`<div class="lookedit"><img class="big" src="${pv}" alt="Prévia do treinador"><div class="lookopts">
      <div class="lbl">Personagem</div><div class="chips">${chips('sex',{m:'Masculino',f:'Feminino'},L.sex)}</div>
      <div class="lbl">Cabelo</div><div class="chips">${chips('style',HAIRSTYLES[L.sex],L.style)}</div>
      ${L.sex==='m'?`<div class="lbl">Barba</div><div class="chips">${chips('beard',BEARDS,L.beard)}</div>`:''}
      ${rows.map(([k,l,arr])=>`<div class="lbl">${l}</div><div class="sw">${arr.map(c=>`<button type="button" data-k="${k}" data-c="${c}" style="background:${c}" aria-label="${l} ${c}" aria-pressed="${L[k]===c}"></button>`).join('')}</div>`).join('')}
    </div></div>`;
  };
  p.body.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.sex){L.sex=b.dataset.sex;if(!HAIRSTYLES[L.sex][L.style])L.style=Object.keys(HAIRSTYLES[L.sex])[0];if(L.sex==='f')L.beard='nenhuma'}
    else if(b.dataset.style)L.style=b.dataset.style;
    else if(b.dataset.beard)L.beard=b.dataset.beard;
    else if(b.dataset.k){if(b.dataset.k==='beardColor')beardPicked=true;if(b.dataset.k==='hair'&&!beardPicked)L.beardColor=b.dataset.c;L[b.dataset.k]=b.dataset.c}
    else return;
    const y=p.body.scrollTop;draw();p.body.scrollTop=y;
  };
  draw();
  const i=await choose([{label:'Salvar visual'},{label:'Cancelar'}],{root:p.list});
  p.body.onclick=null;
  if(i===0){S.look=L;refreshLook();save();await say('Visual novo salvo!')}
}
// guarda-roupa: uma skin por lugar (cabeça, rosto, pescoço, costas)
async function wardrobeMenu(){
  let msg='Toque numa skin pra usar ou tirar.',sel=0;
  while(true){
    const owned=(S.skins||[]).filter(k=>SKINS[k]),acc=S.look.acc||{};
    const p=showPanel('Visual · skins',{foot:msg,body:`<div class="sheetm"><img class="big" src="${charIcon}" alt=""><div>${owned.length?'Toque numa skin pra usar ou tirar.':'Você ainda não tem skins. A Loja da vila vende várias.'}</div></div>`});
    const items=owned.map(k=>{const sk=SKINS[k],on=acc[sk.slot]===k;return{html:`<div class="pinfo"><b>${on?'[E] ':''}${sk.n}</b><small>${SLOTN[sk.slot]}</small></div><span class="r">${on?'usando':''}</span>`}});
    items.push({label:'Voltar'});
    const i=await choose(items,{root:p.list,start:sel});
    if(i<0||i===owned.length){save();return}
    sel=i;const k=owned[i],sk=SKINS[k];
    S.look.acc={...acc};
    if(acc[sk.slot]===k){delete S.look.acc[sk.slot];msg=`Tirou ${sk.n}.`}
    else{S.look.acc[sk.slot]=k;msg=`Agora você está de ${sk.n}!`}
    refreshLook();
  }
}
// loja: comprar e vender (vende pela metade do preço; o que está em uso não dá pra vender)
const SHOP_CATS=[['i','Itens','Poções e Redes'],['g','Equipamentos','Deixam seus zoobumons mais fortes'],['s','Skins','Mudam o visual do seu treinador']];
const shopDef=(t,k)=>t==='i'?ITEMS[k]:t==='g'?GEAR[k]:SKINS[k];
const shopDesc=(t,k)=>t==='s'?SLOTN[SKINS[k].slot]:shopDef(t,k).d;
async function shopMenu(){
  await say('Vendedor: Bem-vindo à Loja! Vai comprar ou vender?');
  while(true){
    setText(`Você tem ${S.coins} moedas.`);
    const a=await choose([{label:'COMPRAR'},{label:'VENDER'},{label:'SAIR'}],{cls:'side'});
    if(a===0)await buyMenu();
    else if(a===1)await sellMenu();
    else{hidePanel();await say('Vendedor: Valeu! Volte sempre!');return}
    hidePanel();
  }
}
async function buyMenu(){
  while(true){
    const p=showPanel(`Comprar · ${S.coins} moedas`);
    const c=await choose([...SHOP_CATS.map(([,n,d])=>({html:`<div class="pinfo"><b>${n}</b><small>${d}</small></div>`})),{label:'Voltar'}],{root:p.list});
    if(c<0||c===SHOP_CATS.length)return;
    const t=SHOP_CATS[c][0],keys=Object.keys(t==='i'?ITEMS:t==='g'?GEAR:SKINS).filter(k=>!(t==='s'&&SKINS[k].hidden));
    let msg='',sel=0;
    while(true){
      const q=showPanel(`${SHOP_CATS[c][1]} · ${S.coins} moedas`,{foot:msg});
      const items=keys.map(k=>{const d=shopDef(t,k),own=t==='g'?S.gear.includes(k):t==='s'?(S.skins||[]).includes(k):false;
        return{html:`<div class="pinfo"><b>${d.n}</b><small>${shopDesc(t,k)}</small></div><span class="r">${own?'já tem':d.price+' $'}${t==='i'?`<small>tem ${S.bag[k]||0}</small>`:''}</span>`,disabled:own}});
      items.push({label:'Voltar'});
      const i=await choose(items,{root:q.list,start:sel});
      if(i<0||i===keys.length)break;
      sel=i;const k=keys[i],d=shopDef(t,k);
      if(S.coins<d.price){msg='Moedas insuficientes. Vença batalhas ou venda alguma coisa.';continue}
      S.coins-=d.price;sfx('moeda');
      if(t==='i'){S.bag[k]=(S.bag[k]||0)+1;msg=`Comprou 1 ${d.n}.`}
      else if(t==='g'){S.gear.push(k);msg=`Comprou ${d.n}! Equipe em Menu › Treinador.`}
      else{S.skins=[...(S.skins||[]),k];msg=`Comprou ${d.n}! Use em Menu › Treinador › Visual.`}
      save();
    }
  }
}
async function sellMenu(){
  let msg='Pago metade do preço. O que estiver em uso não dá pra vender.',sel=0;
  while(true){
    const list=[...Object.keys(ITEMS).filter(k=>S.bag[k]>0).map(k=>['i',k]),...S.gear.map(k=>['g',k]),...(S.skins||[]).filter(k=>SKINS[k]).map(k=>['s',k])];
    const inUse=(t,k)=>t==='g'?S.eq.includes(k):t==='s'?Object.values(S.look.acc||{}).includes(k):false;
    const p=showPanel(`Vender · ${S.coins} moedas`,{foot:msg,body:list.length?'':'Você não tem nada pra vender.'});
    const items=list.map(([t,k])=>{const d=shopDef(t,k),use=inUse(t,k);
      return{html:`<div class="pinfo"><b>${d.n}${t==='i'?` <small>x${S.bag[k]}</small>`:''}</b><small>${use?'em uso':shopDesc(t,k)}</small></div><span class="r">${Math.floor(d.price/2)} $</span>`,disabled:use}});
    items.push({label:'Voltar'});
    const i=await choose(items,{root:p.list,start:sel});
    if(i<0||i===list.length)return;
    sel=Math.min(i,list.length-1);const[t,k]=list[i],d=shopDef(t,k),v=Math.floor(d.price/2);
    S.coins+=v;
    if(t==='i')S.bag[k]--;else if(t==='g')S.gear=S.gear.filter(x=>x!==k);else S.skins=S.skins.filter(x=>x!==k);
    msg=`Vendeu ${d.n} por ${v} moedas.`;save();
  }
}

/* =================== mapa e tipos =================== */
// mapa do mundo visto de cima: cada bloco vira 4 pixels, com o nome das regiões, UPAs, Lojas e onde você está
const MAPA_COR={T:'#2e6b34',',':'#4fa846','.':'#7cc860','=':'#d8c08a','~':'#4a88d8',s:'#efe0a8',Y:'#d8c88a',c:'#b4b6c2',d:'#c89a6a',R:'#8a8278',H:'#c8584a',O:'#6a7aa0',f:'#a6dc7e',B:'#7cc860'};
let MAPA_BASE=null;
function mapaBase(){
  if(MAPA_BASE)return MAPA_BASE;
  const k=4;
  MAPA_BASE=mk(MW*k,MH*k,g=>{
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const ch=MAP[y][x];R(g,MAPA_COR[ch]||'#7cc860',x*k,y*k,k,k);
      if(ch==='T'&&(x+y)%2)R(g,'#25592b',x*k+1,y*k+1,2,2)}
    for(const b of BUILDINGS){const X=b.x*k,Y=b.y*k,W=b.w*k,H=b.h*k,c=b.kind==='centro';
      R(g,'#33293a',X,Y,W,H);R(g,c?'#fbf7f2':'#b8643a',X+1,Y+1,W-2,H-2);R(g,c?'#e04848':'#3aa05a',X+1,Y+1,W-2,5);
      if(c){R(g,'#e04848',X+W/2-1,Y+H/2-2,2,6);R(g,'#e04848',X+W/2-3,Y+H/2,6,2)}else R(g,'#f2c03a',X+W/2-3,Y+H/2-1,6,4)}
  });
  return MAPA_BASE;
}
async function mapaMenu(){
  const k=4,base=mapaBase(),zonas={};
  for(let y=2;y<MH-2;y++)for(let x=2;x<MW-2;x++){if('TR~'.includes(MAP[y][x]))continue;const z=zoneAt(x,y),a=zonas[z]||(zonas[z]={x:0,y:0,n:0});a.x+=x;a.y+=y;a.n++}
  const aqui=scene==='mundo'?{x:P.x,y:P.y}:curB?{x:curB.door[0],y:curB.door[1]}:{x:P.x,y:P.y};
  const cv=mk(MW*k,MH*k,g=>{g.drawImage(base,0,0);g.font='600 13px "Zoobu Pixel",monospace';g.textAlign='center';g.textBaseline='middle';
    for(const[z,a]of Object.entries(zonas)){const t=ZNAME[z],x=a.x/a.n*k,y=a.y/a.n*k,w=g.measureText(t).width+8;
      g.fillStyle='rgba(248,248,240,.88)';g.fillRect(x-w/2,y-8,w,16);g.strokeStyle='#45507a';g.lineWidth=1;g.strokeRect(x-w/2+.5,y-7.5,w-1,15);g.fillStyle='#38384a';g.fillText(t,x,y+1)}});
  const p=showPanel('Mapa',{foot:`Você está em: ${ZNAME[zoneAt(aqui.x,aqui.y)]}`,
    body:`<div class="mapawrap"><img class="mapaimg" src="${cv.toDataURL()}" alt="Mapa do mundo"><i class="mapaeu" style="left:${(aqui.x+.5)/MW*100}%;top:${(aqui.y+.5)/MH*100}%"></i></div>
    <div class="mapaleg"><span><i class="eu"></i>Você</span><span><i class="upa"></i>UPA</span><span><i class="loja"></i>Loja</span><span><i class="mato"></i>Mato alto</span></div>`});
  p.body.classList.add('grow');
  await choose([{label:'Voltar'}],{root:p.list});
}
// quem bate forte em quem: tirado direto da tabela que a batalha usa, então nunca fica desatualizado
async function tiposMenu(){
  // só os tipos que algum zoobumon tem (Pedra aparece sozinho quando existir um)
  const tipos=Object.keys(TYPEC).filter(t=>Object.values(SPECIES).some(s=>s.t===t)),lista=t=>t.length?t.map(chip).join(' '):'<small>ninguém</small>';
  const rows=tipos.map(t=>{const forte=tipos.filter(d=>effOf(t,d)>1),fraco=tipos.filter(d=>effOf(t,d)<1),medo=tipos.filter(a=>effOf(a,t)>1);
    return`<div class="tiporow"><div class="tipohd">${chip(t)}</div><div class="tipoln"><b>Bate forte em</b> ${lista(forte)}</div><div class="tipoln"><b>Bate fraco em</b> ${lista(fraco)}</div><div class="tipoln"><b>Apanha muito de</b> ${lista(medo)}</div></div>`}).join('');
  const p=showPanel('Tipos',{foot:'Forte = dano em dobro · Fraco = metade do dano',body:`<div class="hwtxt">O tipo do golpe contra o tipo do zoobumon que leva o golpe:</div>${rows}`});
  p.body.classList.add('grow');
  await choose([{label:'Voltar'}],{root:p.list});
}
