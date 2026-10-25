'use strict';
/* =================== regras dos zoobumons =================== */
const xpFor=lv=>lv<=1?0:Math.floor(lv**3*.8);
const tlevel=txp=>1+Math.floor(Math.sqrt((txp||0)/30));
const nameOf=m=>SPECIES[m.s].n;
function bon(o){
  const r={atk:0,def:0,hp:0,cap:0,xp:0,enc:1,spd:0,boost:{}};
  if(!o)return r;
  const c=null; // classes saíram do jogo: bônus só de equipamento e nível de treinador
  if(c){for(const k of['atk','def','hp','cap','xp'])r[k]+=c[k]||0;if(c.enc)r.enc=c.enc}
  const tl=tlevel(o.txp);r.atk+=(tl-1)*.01;r.def+=(tl-1)*.01;
  for(const id of o.eq||[]){const G=GEAR[id];if(!G)continue;r.atk+=G.atk||0;r.def+=G.def||0;r.cap+=G.cap||0;r.spd+=G.spd||0;if(G.boost)r.boost[G.boost]=(r.boost[G.boost]||0)+.25}
  return r;
}
function st(m,k,o){const b=SPECIES[m.s].b[k];let v=Math.floor(b*2*m.lv/100)+5;const bo=bon(o);if(k==='atk')v*=1+bo.atk;if(k==='def')v*=1+bo.def;return Math.round(v)}
function maxHP(m,o){const b=SPECIES[m.s].b.hp;return Math.round((Math.floor(b*2*m.lv/100)+m.lv+10)*(1+bon(o).hp))}
function movesFor(s,lv){const ms=[];for(const[l,k]of SPECIES[s].ls)if(l<=lv&&!ms.includes(k))ms.push(k);return ms.slice(-4)}
function mkMon(s,lv){const m={s,lv,xp:xpFor(lv),moves:movesFor(s,lv),hp:0};m.hp=maxHP(m,null);return m}
function healAll(){for(const m of[...S.party,...S.box])m.hp=maxHP(m,S)}
function calcDamage(A,Ao,D,Do,mv){
  const L=A.lv,atk=st(A,'atk',Ao),def=st(D,'def',Do);
  let d=((2*L/5+2)*mv.p*atk/def)/50+2;
  if(SPECIES[A.s].t===mv.t)d*=1.5;
  const eff=effOf(mv.t,SPECIES[D.s].t);d*=eff;
  const ba=bon(Ao);if(ba.boost[mv.t])d*=1+ba.boost[mv.t];
  const crit=brnd()<.0625;if(crit)d*=1.5;
  d*=.85+brnd()*.15;
  return{dmg:Math.max(1,Math.floor(d)),eff,crit};
}

