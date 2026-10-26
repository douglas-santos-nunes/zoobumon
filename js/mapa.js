'use strict';
/* =================== mapa =================== */
const MW=48,MH=40;
const MAP=Array.from({length:MH},()=>new Array(MW).fill('.'));
function rect(ch,x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(MAP[j]&&MAP[j][i]!==undefined)MAP[j][i]=ch}
const BUILDINGS=[
  {kind:'centro',x:4,y:3,w:5,h:4,door:[6,6]},
  {kind:'loja',x:11,y:3,w:5,h:4,door:[13,6]},
];
function buildMap(){
  rect('T',0,0,MW,2);rect('T',0,MH-2,MW,2);rect('T',0,0,2,MH);rect('T',MW-2,0,2,MH);
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
  for(const b of BUILDINGS)rect('B',b.x,b.y,b.w,b.h);
  for(const n of NPCS)MAP[n.y][n.x]=MAP[n.y][n.x]==='T'?'.':MAP[n.y][n.x];
}
function zoneAt(x,y){if(y<15&&x<25)return'vila';if(y<=16&&x>=25)return'pedreira';if(x>=27)return'bosque';return'rota'}
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
function loadSave(){try{const s=JSON.parse(localStorage.getItem(saveKey()));return s&&Array.isArray(s.party)&&s.party.length?s:null}catch(e){return null}}

