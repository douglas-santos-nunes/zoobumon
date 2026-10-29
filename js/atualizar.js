'use strict';
/* =================== atualização obrigatória =================== */
// versao.txt guarda o mesmo número do ?v= dos scripts. Se o site mudou e a pessoa está com a versão velha aberta,
// o jogo salva e recarrega sozinho (esperando acabar a batalha ou o menu, pra ninguém perder nada no meio).
const VERSAO_ATUAL=(document.querySelector('script[src*="js/util.js"]')?.src.match(/[?&]v=(\d+)/)||[])[1];
let versaoNova=null;
async function checarVersao(){
  if(!VERSAO_ATUAL||versaoNova)return;
  try{
    const r=await fetch('versao.txt?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;
    const v=(await r.text()).trim();if(!/^\d+$/.test(v)||+v<=+VERSAO_ATUAL)return;
    // se já recarregou pra essa versão e o site ainda mandou a velha, espera um pouco antes de tentar de novo
    let tent={};try{tent=JSON.parse(sessionStorage.getItem('zoobumon-atualizou')||'{}')}catch(e){}
    if(tent.v===v&&Date.now()-tent.t<5*60e3)return;
    versaoNova=v;
  }catch(e){}
}
function aplicarVersao(){
  if(!versaoNova)return;
  // no meio da batalha, do menu ou de uma conversa espera voltar pro mapa
  if(started&&(mode!=='world'||busy))return;
  const v=versaoNova;versaoNova=null;
  try{if(started)save()}catch(e){}
  try{sessionStorage.setItem('zoobumon-atualizou',JSON.stringify({v,t:Date.now()}))}catch(e){}
  $('#atualizando').hidden=false;
  setTimeout(()=>location.replace(location.pathname+'?atualizado='+v+location.hash),1200);
}
// tira o ?atualizado= do endereço depois de recarregar
if(/[?&]atualizado=/.test(location.search))history.replaceState(null,'',location.pathname+location.search.replace(/[?&]atualizado=\d+/,'').replace(/^&/,'?')+location.hash);
checarVersao();
setInterval(checarVersao,3*60e3);
setInterval(aplicarVersao,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checarVersao()});
