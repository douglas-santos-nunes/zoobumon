'use strict';
/* =================== mapa =================== */
const MW=96,MH=72;
const MAP=Array.from({length:MH},()=>new Array(MW).fill('.'));
function rect(ch,x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(MAP[j]&&MAP[j][i]!==undefined)MAP[j][i]=ch}
const BUILDINGS=[
  {kind:'centro',x:4,y:3,w:5,h:4,door:[6,6]},
  {kind:'loja',x:11,y:3,w:5,h:4,door:[13,6]},
];
function buildMap(){
  rect('T',0,0,MW,2);rect('T',0,MH-2,MW,2);rect('T',0,0,2,MH);rect('T',MW-2,0,2,MH);
  // borda da parte antiga (vira divisa com as regiões novas)
  rect('T',0,38,48,2);rect('T',46,0,2,40);
  // vila
  rect('f',4,10,3,2);rect('f',18,11,3,2);rect('f',18,4,4,2);
  for(const[x,y]of[[23,10],[23,12],[3,13],[22,13]])MAP[y][x]='T';
  // trilha 1
  rect(',',3,17,7,5);rect(',',15,17,8,4);rect('~',3,24,6,5);rect(',',15,24,9,6);rect(',',3,31,8,3);rect(',',14,35,10,3);
  for(const[x,y]of[[10,23],[22,22],[14,28],[20,32],[22,32],[5,36],[8,36]])MAP[y][x]='T';
  rect('f',18,22,2,1);
  // pedreira
  rect('d',26,2,20,13);
  rect(',',28,3,6,4);rect(',',37,10,7,4);rect(',',28,11,6,3);
  for(const[x,y]of[[35,3],[36,5],[41,3],[43,5],[39,6],[35,12],[36,11],[44,12],[27,13],[45,10],[40,4]])MAP[y][x]='R';
  // bosque
  rect(',',27,17,19,21);
  for(let y=17;y<38;y++)for(let x=27;x<46;x++)if((x*7+y*13)%9===0)MAP[y][x]='T';
  rect('.',38,19,6,4);rect('.',28,27,4,3);
  // divisas
  rect('T',2,15,23,1);rect('T',25,2,1,14);rect('T',25,15,21,2);rect('T',25,17,2,21);
  // caminhos
  rect('=',2,8,44,1);rect('=',12,9,1,29);rect('=',12,34,32,1);rect('=',36,18,1,17);
  rect('=',6,7,1,1);rect('=',13,7,1,1);
  // ---- Praia Brava (nordeste): areia, mar, coqueiros e capim de praia ----
  rect('s',48,2,46,28);
  for(let y=2;y<30;y++)rect('~',80+((y*5)%4)-(y>20?2:0),y,16,1);
  rect(',',52,4,8,4);rect(',',63,14,9,4);rect(',',53,21,7,5);rect(',',70,5,6,4);rect(',',72,24,5,4);
  for(const[x,y]of[[50,12],[58,10],[67,3],[75,12],[61,26],[69,21],[51,27],[77,18]])MAP[y][x]='Y';
  // ---- Distrito Corporativo (sul): calçada, prédios de vidro e canteiros ----
  rect('c',2,40,44,30);
  for(const[x,y,w,h]of[[4,42,6,4],[16,42,8,5],[29,42,6,4],[38,42,6,6],[4,56,7,5],[30,58,8,6],[18,63,6,4]])rect('O',x,y,w,h);
  rect(',',4,48,6,3);rect(',',16,49,8,3);rect(',',36,50,7,2);rect(',',14,57,6,4);rect(',',40,62,5,5);rect(',',4,64,8,3);rect(',',28,47,6,3);
  for(const[x,y]of[[15,47],[27,51],[35,49],[13,56],[25,57],[44,56],[11,63]])MAP[y][x]='T';
  // ---- Rua do Boteco (sudeste): casinhas de telhado, rua e mato ----
  for(const[x,y,w,h]of[[50,36,6,3],[63,36,6,3],[50,45,5,3],[64,45,6,3],[50,57,6,3],[63,57,6,3]])rect('H',x,y,w,h);
  rect(',',49,40,9,3);rect(',',62,40,8,3);rect(',',49,49,8,3);rect(',',63,49,7,3);rect(',',50,62,8,5);rect(',',62,63,8,4);
  rect('f',57,46,2,1);rect('f',51,55,3,1);rect('f',67,54,2,1);
  // ---- Serra Alta (leste distante): terra, pedras e árvores ----
  rect('d',74,32,20,38);
  for(let y=32;y<70;y++)for(let x=74;x<94;x++){const h=(x*13+y*7)%23;if(h===0)MAP[y][x]='R';else if(h===5||h===11)MAP[y][x]='T'}
  rect(',',76,34,7,5);rect(',',86,38,6,6);rect(',',77,44,6,5);rect(',',84,50,8,5);rect(',',76,58,8,6);rect(',',86,61,6,6);
  rect('~',88,33,4,3);
  // divisas entre as regiões novas
  rect('T',48,30,46,2);rect('T',46,40,2,30);rect('T',72,32,2,38);
  // ruas e passagens (furos nas divisas)
  rect('=',46,8,14,1);rect('=',60,8,1,62);        // pedreira -> praia, e a rua que desce até o boteco
  rect('=',12,38,1,32);rect('=',26,40,1,30);      // trilha -> distrito, e a segunda rua do distrito
  rect('=',2,53,92,1);                             // avenida que corta distrito, boteco e serra
  rect('=',44,34,16,1);                            // bosque -> boteco
  rect('=',80,53,1,10);rect('=',80,62,8,1);
  for(const b of BUILDINGS)rect('B',b.x,b.y,b.w,b.h);
  // ninguém fica em cima de árvore, pedra ou parede
  for(const n of NPCS)if('TRYOH~'.includes(MAP[n.y][n.x]))MAP[n.y][n.x]=zoneAt(n.x,n.y)==='serra'?'d':'.';
}
function zoneAt(x,y){
  if(x>=48){if(y<30)return'praia';return x>=72?'serra':'boteco'}
  if(y>=40)return'cidade';
  if(y<15&&x<25)return'vila';if(y<=16&&x>=25)return'pedreira';if(x>=27)return'bosque';return'rota'}
// interiores: cada um é um mapinha próprio. '#' parede, '_' piso, 'C' balcão, 'M' máquina de cura, 'P' PC,
// 'p' planta, 'b' banco, 'S' prateleira, 'E' tapete de saída
const INT={
  centro:{name:'UPA',floor:'xadrez',entry:[6,7],rows:[
    '############',
    '############',
    '#__M______P#',
    '#_CCCCCCC__#',
    '#__________#',
    '#p________p#',
    '#__bb__bb__#',
    '#__________#',
    '#####EE#####']},
  loja:{name:'Loja da Vila',floor:'madeira',entry:[4,7],rows:[
    '##########',
    '##########',
    '#SSSS_SSS#',
    '#________#',
    '#CCC_____#',
    '#______SS#',
    '#p_____SS#',
    '#________#',
    '####EE####']},
};
for(const k in INT){const I=INT[k];I.map=I.rows.map(r=>r.split(''));I.h=I.map.length;I.w=I.map[0].length;I.door=BUILDINGS.find(b=>b.kind===k).door}
let scene='mundo';
const SC=()=>scene==='mundo'?{map:MAP,w:MW,h:MH}:INT[scene];
const tileAt=(x,y)=>SC().map[y]?.[x]??(scene==='mundo'?'T':'#');
const buildingAt=(x,y)=>scene==='mundo'?BUILDINGS.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h):null;

/* =================== estado =================== */
let S=null;              // jogador (também é o "dono" dos zoobumons, pra bônus)
let mode='none', busy=0, needRelease=false, started=false, B=null, EVO=null, charSpr=null;
const P={x:6,y:7,dir:'down',moving:false,tx:0,ty:0,t:0,step:0};
const KEY='zoobumon-save-v1';
// cada conta tem seu save local (cópia rápida) e o save na nuvem, que vale entre aparelhos
const saveKey=()=>KEY+(me?'-'+me.id:'');
function save(){if(!S)return;S.pos={x:P.x,y:P.y,dir:P.dir,sc:scene};try{localStorage.setItem(saveKey(),JSON.stringify(S))}catch(e){}cloudSave()}
function loadSave(){
  const ok=s=>s&&Array.isArray(s.party)&&s.party.length?s:null;
  try{
    const s=ok(JSON.parse(localStorage.getItem(saveKey())));if(s||me)return s;
    // sem login: aproveita o save de quem jogava logado neste aparelho (fica com o mais avançado)
    let best=null,score=-1;
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith(KEY+'-'))continue;
      const c=ok(JSON.parse(localStorage.getItem(k)));if(!c)continue;
      const v=[...c.party,...(c.box||[])].reduce((a,m)=>a+(m.lv||0),0)+(c.txp||0)/100;if(v>score){score=v;best=c}}
    return best;
  }catch(e){return null}
}

