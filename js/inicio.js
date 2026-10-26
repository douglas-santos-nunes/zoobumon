'use strict';
/* =================== início =================== */
buildTiles();buildMap();
for(const n of[...NPCS,...Object.values(INT_NPCS).flat()])n.spr=buildChar(n.look);
renderCreate();pvSpr=buildChar(C.look);
let savedGame=null;
function showCreate(saved){
  savedGame=saved;
  $('#auth').hidden=true;$('#create').hidden=false;
  $('#cont').hidden=!saved;
  if(saved)$('#contname').textContent=`${saved.name} · ${saved.party.length} zoobumon(s)`;
  $('#btnLogout').hidden=!me;
  $('#acctInfo').textContent=me?`Conectado como ${me.email}`:'Seu progresso fica salvo neste aparelho.';
}
async function afterLogin(){
  let s=await cloudLoad()||loadSave();
  if(!s){try{const g=JSON.parse(localStorage.getItem(KEY));if(g&&Array.isArray(g.party)&&g.party.length)s=g}catch(e){}}
  showCreate(s);
}
async function boot(){
  if(!sb){showCreate(loadSave());return}
  const{data}=await sb.auth.getSession();
  me=data.session?data.session.user:null;
  if(me)await afterLogin();else $('#auth').hidden=false;
}
boot();
requestAnimationFrame(frame);requestAnimationFrame(drawPreview);
