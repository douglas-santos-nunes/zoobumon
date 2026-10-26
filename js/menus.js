'use strict';
/* =================== menus =================== */
async function startMenu(){
  while(true){
    const i=await choose(['ZOOBUMONS','BOLSA','TREINADOR','DUELO','SALVAR','FECHAR'].map(l=>({label:l})),{cls:'side'});
    if(i<0||i===5)return;
    if(i===0)await zoobumonsMenu();
    else if(i===1)await bagMenu();
    else if(i===2)await trainerMenu();
    else if(i===3){
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
    const p=showPanel(`Seu time (${S.party.length}/6)`,{foot:S.box.length?`${S.box.length} guardado(s) no PC da UPA.`:''});
    const i=await choose(S.party.map(m=>({html:monRow(m)})),{root:p.list,start:sel});
    if(i<0)return;
    sel=i;
    const m=S.party[i];
    const a=await choose([{label:'Ver ficha'},{label:'Pôr na frente',disabled:i===0},{label:'Voltar'}],{cls:'side'});
    if(a===0)await monSheet(m);
    else if(a===1){S.party.splice(i,1);S.party.unshift(m);sel=0}
  }
}
async function monSheet(m){
  const sp=SPECIES[m.s],b=xpFor(m.lv+1);
  const p=showPanel(sp.n,{body:`<div class="sheetm"><img class="big" src="${icon(m.s)}" alt=""><div>
    <div>${chip(sp.t)} Nível ${m.lv}</div><div>PV ${m.hp}/${maxHP(m,S)}</div>
    <div>ATQ ${st(m,'atk',S)} · DEF ${st(m,'def',S)} · VEL ${st(m,'spd',S)}</div>
    <div>Faltam ${Math.max(0,b-m.xp)} de XP pro próximo nível</div>${sp.evo?`<div>Evolui no nível ${sp.evo[1]}</div>`:''}</div></div>
    <div class="mvs">${m.moves.map(k=>`<div>${chip(MOVES[k].t)} ${MOVES[k].n} <small>Poder ${MOVES[k].p}</small></div>`).join('')}</div>`});
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
  await say('Vendedor: Bem-vindo à Loja da Vila! Vai comprar ou vender?');
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
      S.coins-=d.price;
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
