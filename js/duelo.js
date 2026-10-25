'use strict';
/* =================== duelo por código =================== */
function myCode(){
  const o={n:S.name,c:S.cls,e:S.eq,x:S.txp,t:S.party.map(m=>[m.s,m.lv,m.moves])};
  return'CB1.'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));
}
function refreshCode(){}
function duelPanel(){
  const p=showPanel('Duelo com amigos',{body:`<p>Mande seu código pra um amigo. Ele cola no jogo dele e luta contra o seu time, com os seus equipamentos. Depois do duelo os times voltam como estavam.</p>
    <div class="dfield"><label for="myc">Seu código</label><textarea id="myc" rows="3" readonly>${myCode()}</textarea><button type="button" class="pbtn" id="cpy">Copiar meu código</button></div>
    <div class="dfield"><label for="frc">Código do amigo</label><textarea id="frc" rows="3" placeholder="Cole aqui um código que começa com CB1." spellcheck="false"></textarea><button type="button" class="pbtn alt" id="go">Duelar</button></div>`});
  p.body.classList.add('grow');
  return new Promise(res=>{
    const foot=$('#pfoot');
    const pop=pushH(b=>{if(b==='b'){pop();res(null)}});
    $('#cpy').onclick=()=>{
      const ta=$('#myc'),fb=()=>{ta.focus();ta.select();foot.textContent='Código selecionado. Copie e mande pro seu amigo.'};
      try{navigator.clipboard.writeText(ta.value).then(()=>{foot.textContent='Código copiado! Mande pro seu amigo.'},fb)}catch(e){fb()}
    };
    $('#go').onclick=()=>{
      const t=decodeTeam($('#frc').value);
      if(!t){foot.textContent='Código inválido. Confira se copiou ele inteiro.';return}
      pop();res(t);
    };
  });
}
function decodeTeam(code){
  try{
    code=code.trim().replace(/\s+/g,'');if(!code.startsWith('CB1.'))return null;
    const o=JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
    const owner={cls:null,eq:(Array.isArray(o.e)?o.e:[]).filter(g=>GEAR[g]).slice(0,2),txp:clamp(+o.x||0,0,1e7)};
    const team=(Array.isArray(o.t)?o.t:[]).slice(0,6).map(a=>{
      if(!Array.isArray(a)||!SPECIES[a[0]])throw 0;
      const m=mkMon(a[0],clamp(a[1]|0,1,100));
      const mv=(Array.isArray(a[2])?a[2]:[]).filter(k=>MOVES[k]).slice(0,4);if(mv.length)m.moves=mv;
      return m;
    });
    if(!team.length)return null;
    return{name:String(o.n||'Amigo').slice(0,12),owner,team};
  }catch(e){return null}
}

