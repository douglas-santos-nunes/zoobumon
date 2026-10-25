'use strict';
/* =================== dados =================== */
const TYPEC={Normal:'#9c8c74',Fogo:'#e0603a','Água':'#4a88d8',Planta:'#46a246','Elétrico':'#c99a12',Pedra:'#8c7458'};
const STRONG={Fogo:['Planta'],'Água':['Fogo','Pedra'],Planta:['Água','Pedra'],'Elétrico':['Água'],Pedra:['Fogo','Elétrico']};
const WEAK={Fogo:['Água','Pedra','Fogo'],'Água':['Planta','Água'],Planta:['Fogo','Planta'],'Elétrico':['Pedra','Planta','Elétrico'],Pedra:['Água','Planta'],Normal:['Pedra']};
const effOf=(a,d)=>STRONG[a]?.includes(d)?2:WEAK[a]?.includes(d)?.5:1;

const MOVES={
  investida:{n:'Investida',t:'Normal',p:40,a:100}, arranhao:{n:'Arranhão',t:'Normal',p:45,a:100},
  mordida:{n:'Mordida',t:'Normal',p:60,a:95}, golpeduro:{n:'Golpe Duro',t:'Normal',p:80,a:85},
  brasa:{n:'Brasa',t:'Fogo',p:40,a:100}, chamaviva:{n:'Chama Viva',t:'Fogo',p:70,a:90}, inferno:{n:'Inferno',t:'Fogo',p:95,a:80},
  jato:{n:"Jato d'Água",t:'Água',p:40,a:100}, onda:{n:'Onda Forte',t:'Água',p:70,a:90}, maremoto:{n:'Maremoto',t:'Água',p:95,a:80},
  folha:{n:'Folha Navalha',t:'Planta',p:40,a:100}, raiz:{n:'Raiz Brava',t:'Planta',p:70,a:90}, furia:{n:'Fúria Verde',t:'Planta',p:95,a:80},
  choque:{n:'Choque',t:'Elétrico',p:40,a:100}, faisca:{n:'Faísca Dupla',t:'Elétrico',p:65,a:95}, trovao:{n:'Trovão',t:'Elétrico',p:90,a:80},
  latido:{n:'Latido Feroz',t:'Normal',p:55,a:100}, furia:{n:'Fúria Caramelo',t:'Normal',p:90,a:85},
  cauda:{n:'Chicote de Cauda',t:'Normal',p:50,a:100}, salto:{n:'Pulo Acrobático',t:'Normal',p:75,a:95},
  bicada:{n:'Bicada',t:'Normal',p:45,a:100}, asas:{n:'Ataque de Asa',t:'Normal',p:60,a:100}, esporao:{n:'Esporão Flamejante',t:'Fogo',p:85,a:90},
  notificacao:{n:'Notificação',t:'Elétrico',p:45,a:100}, figurinha:{n:'Chuva de Figurinha',t:'Normal',p:55,a:100}, corrente:{n:'Corrente do Zap',t:'Elétrico',p:70,a:90}, audio:{n:'Áudio de 5 Minutos',t:'Normal',p:85,a:85},
  cheirinho:{n:'Cheirinho',t:'Normal',p:40,a:100}, mosquinhas:{n:'Nuvem de Mosquinhas',t:'Normal',p:55,a:100}, fedido:{n:'Arremesso Fedido',t:'Normal',p:75,a:90},
  tosse:{n:'Tosse Seca',t:'Normal',p:40,a:100}, fumaca:{n:'Fumaça Densa',t:'Normal',p:55,a:100}, cinzas:{n:'Chuva de Cinzas',t:'Fogo',p:70,a:90},
  pedrada:{n:'Pedrada',t:'Pedra',p:45,a:100}, desabamento:{n:'Desabamento',t:'Pedra',p:75,a:85},
};
const LS={
  fogo:[[1,'bicada'],[1,'brasa'],[6,'asas'],[11,'chamaviva'],[18,'esporao'],[24,'inferno']],
  agua:[[1,'investida'],[1,'jato'],[6,'mordida'],[11,'onda'],[18,'golpeduro'],[24,'maremoto']],
  planta:[[1,'investida'],[1,'folha'],[6,'arranhao'],[11,'raiz'],[18,'golpeduro'],[24,'furia']],
  rato:[[1,'investida'],[3,'arranhao'],[7,'mordida'],[14,'golpeduro']],
  inseto:[[1,'investida'],[1,'folha'],[8,'arranhao'],[12,'raiz']],
  lodo:[[1,'investida'],[1,'jato'],[9,'mordida'],[13,'onda']],
  faisca:[[1,'investida'],[1,'choque'],[7,'arranhao'],[11,'faisca'],[17,'trovao']],
  pedra:[[1,'investida'],[1,'pedrada'],[9,'mordida'],[13,'desabamento'],[18,'golpeduro']],
  cao:[[1,'investida'],[1,'arranhao'],[4,'latido'],[8,'mordida'],[15,'golpeduro'],[22,'furia']],
  lemure:[[1,'investida'],[1,'arranhao'],[6,'cauda'],[11,'mordida'],[18,'salto'],[24,'golpeduro']],
  zap:[[1,'investida'],[1,'notificacao'],[7,'figurinha'],[12,'corrente'],[18,'audio']],
  coco:[[1,'investida'],[1,'cheirinho'],[8,'mosquinhas'],[13,'fedido'],[19,'golpeduro']],
  cigarro:[[1,'tosse'],[1,'brasa'],[7,'fumaca'],[13,'cinzas'],[21,'inferno']],
  cinza:[[1,'arranhao'],[1,'brasa'],[8,'mordida'],[12,'chamaviva'],[20,'inferno']],
};
const GREY={base:'#8a7a8e',light:'#b8aabc',dark:'#5a4c5e',belly:'#ece0ec',accent:'#3c3040'};
// b = atributos base, xp = XP que dá ao ser derrotado, cr = facilidade de captura, sh = forma do sprite gerado
const SPECIES={
  pintobrasa:{n:'Pintobrasa',t:'Fogo',b:{hp:42,atk:58,def:40,spd:66},xp:64,cr:.45,ls:LS.fogo,evo:['galardente',14],pal:{base:'#ffc83a',light:'#fff09a',dark:'#d8891a',belly:'#fff4c8',accent:'#ff6a2a'},sh:{rx:.55,ry:.6,cy:.6,sp:2,seed:11,nz:.55}},
  galardente:{n:'Galardente',t:'Fogo',b:{hp:66,atk:92,def:60,spd:88},xp:150,cr:.15,ls:LS.fogo,pal:{base:'#e8552a',light:'#ff9a4a',dark:'#9a2a18',belly:'#ffd27a',accent:'#ffe14a'},sh:{rx:.78,ry:.8,cy:.54,sp:3,seed:11,nz:.55}},
  gotinho:{n:'Gotinho',t:'Água',b:{hp:50,atk:48,def:60,spd:46},xp:64,cr:.45,ls:LS.agua,evo:['zegotinha',14],sh:{rx:.62,ry:.55,cy:.62,sp:0,seed:23,nz:.4}},
  zegotinha:{n:'Zé Gotinha',t:'Água',b:{hp:76,atk:74,def:86,spd:62},xp:150,cr:.15,ls:LS.agua,pal:{base:'#9ccff4',light:'#d6efff',dark:'#4a88cc',belly:'#ffffff',accent:'#ffffff'},sh:{rx:.85,ry:.72,cy:.56,sp:1,seed:23,nz:.4}},
  brotelo:{n:'Brotelo',t:'Planta',b:{hp:52,atk:50,def:52,spd:48},xp:64,cr:.45,ls:LS.planta,evo:['floresko',14],sh:{rx:.58,ry:.58,cy:.62,sp:1,seed:37,nz:.5}},
  floresko:{n:'Floresko',t:'Planta',b:{hp:78,atk:78,def:78,spd:66},xp:150,cr:.15,ls:LS.planta,sh:{rx:.82,ry:.8,cy:.54,sp:3,seed:37,nz:.5}},
  ratuxo:{n:'Ratuxo',t:'Normal',b:{hp:38,atk:50,def:35,spd:70},xp:40,cr:.7,ls:LS.rato,evo:['ratazao',12],pal:GREY,sh:{rx:.5,ry:.5,cy:.64,sp:2,seed:41,nz:.6}},
  ratazao:{n:'Ratatuile',t:'Normal',b:{hp:62,atk:78,def:56,spd:92},xp:110,cr:.3,ls:LS.rato,pal:GREY,sh:{rx:.72,ry:.7,cy:.57,sp:2,seed:41,nz:.6}},
  zumbel:{n:'Abelhume',t:'Planta',b:{hp:40,atk:44,def:40,spd:62},xp:45,cr:.65,ls:LS.inseto,pal:{base:'#a8c840',light:'#d8f080',dark:'#6c8a28',belly:'#f0f8c0',accent:'#3c5c20'},sh:{rx:.5,ry:.62,cy:.56,sp:2,seed:53,nz:.75}},
  lodim:{n:'Lodim',t:'Água',b:{hp:58,atk:42,def:50,spd:40},xp:50,cr:.6,ls:LS.lodo,pal:{base:'#7c78d0',light:'#b4b0f0',dark:'#4c4890',belly:'#e0dcf8',accent:'#f8f8f8'},sh:{rx:.75,ry:.45,cy:.68,sp:0,seed:67,nz:.35,legs:0}},
  faiscol:{n:'Faíscol',t:'Elétrico',b:{hp:40,atk:56,def:38,spd:82},xp:55,cr:.45,ls:LS.faisca,evo:['voltaro',15],sh:{rx:.48,ry:.55,cy:.62,sp:3,seed:71,nz:.65}},
  voltaro:{n:'Voltaro',t:'Elétrico',b:{hp:62,atk:88,def:58,spd:106},xp:160,cr:.12,ls:LS.faisca,pal:{accent:'#3058d0'},sh:{rx:.7,ry:.78,cy:.54,sp:3,seed:71,nz:.65}},
  pedrugo:{n:'Pedrugo',t:'Pedra',b:{hp:56,atk:62,def:82,spd:25},xp:60,cr:.5,ls:LS.pedra,sh:{rx:.8,ry:.6,cy:.62,sp:0,seed:83,nz:.9}},
  caramelo:{n:'Caramelo',t:'Normal',b:{hp:55,atk:58,def:48,spd:66},xp:58,cr:.45,ls:LS.cao,evo:['caramelao',16],pal:{base:'#d8914a',light:'#f0bc78',dark:'#a8642c',belly:'#f6e2bc',accent:'#d84040'},sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:7,nz:.5}},
  caramelao:{n:'Caramelo BR',t:'Normal',b:{hp:82,atk:88,def:68,spd:90},xp:150,cr:.15,ls:LS.cao,pal:{base:'#c98240',light:'#eab06a',dark:'#94562a',belly:'#f4dcb0',accent:'#3a3440'},sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:7,nz:.5}},
  zubumafilho:{n:'Zubumafilho',t:'Normal',b:{hp:48,atk:52,def:44,spd:80},xp:62,cr:.4,ls:LS.lemure,evo:['zubumapai',18],pal:{base:'#9a96a2',light:'#c9c5cf',dark:'#3a3640',belly:'#f4f1ea',accent:'#f2a024'},sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:5,nz:.5}},
  zubumapai:{n:'Zubumapai',t:'Normal',b:{hp:76,atk:84,def:66,spd:102},xp:155,cr:.15,ls:LS.lemure,pal:{base:'#8c8896',light:'#bdb9c4',dark:'#302c36',belly:'#f2eee6',accent:'#f29a1c'},sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:5,nz:.5}},
  zap:{n:'Zap',t:'Elétrico',b:{hp:54,atk:60,def:50,spd:74},xp:70,cr:.35,ls:LS.zap,pal:{base:'#3ccf6a',light:'#90f0aa',dark:'#1e8a44',belly:'#ffffff',accent:'#4fb8f0'},sh:{rx:.7,ry:.6,cy:.55,sp:0,seed:3,nz:.4}},
  cocozinho:{n:'Cocozinho',t:'Normal',b:{hp:62,atk:46,def:62,spd:34},xp:55,cr:.6,ls:LS.coco,pal:{base:'#8a5530',light:'#b8804e',dark:'#5a3418',belly:'#ffffff',accent:'#2a2a34'},sh:{rx:.7,ry:.6,cy:.6,sp:0,seed:9,nz:.4}},
  gudang:{n:'Gudang',t:'Fogo',b:{hp:46,atk:64,def:42,spd:60},xp:66,cr:.4,ls:LS.cigarro,pal:{base:'#c8925a',light:'#e8bc84',dark:'#8a5a30',belly:'#f4e8d4',accent:'#e0a040'},sh:{rx:.5,ry:.7,cy:.55,sp:0,seed:13,nz:.4}},
  cinzarel:{n:'Cinzarel',t:'Fogo',b:{hp:52,atk:66,def:46,spd:72},xp:75,cr:.25,ls:LS.cinza,pal:{base:'#b84a3a',light:'#e88a5a',dark:'#6a2620',belly:'#a49c9c',accent:'#3c3438'},sh:{rx:.6,ry:.7,cy:.56,sp:3,seed:97,nz:.7}},
};
const PAL={
  Fogo:{base:'#e8683c',light:'#f8b050',dark:'#a8382c',belly:'#f8d890',accent:'#ffe868'},
  'Água':{base:'#4c8ee0',light:'#98ccf8',dark:'#2c56a0',belly:'#d8f0f8',accent:'#f8f8f8'},
  Planta:{base:'#5cb44c',light:'#a8e078',dark:'#2c7434',belly:'#e0f0a8',accent:'#f080a8'},
  'Elétrico':{base:'#f0c830',light:'#fff09a',dark:'#b08418',belly:'#fff8d0',accent:'#e85030'},
  Pedra:{base:'#a08a6c',light:'#d0bc98',dark:'#64503c',belly:'#c8b898',accent:'#787c88'},
  Normal:{base:'#b4946c',light:'#e4cca4',dark:'#76583c',belly:'#f4e8d0',accent:'#6c5038'},
};
const ITEMS={
  pocao:{n:'Poção',d:'Cura 25 PV de um zoobumon',price:60,heal:25},
  superp:{n:'Super Poção',d:'Cura 70 PV de um zoobumon',price:180,heal:70},
  rede:{n:'Rede',d:'Captura zoobumons selvagens',price:100,net:1},
  redeouro:{n:'Rede de Ouro',d:'Captura com 1,8× mais chance',price:280,net:1.8},
};
const GEAR={
  faixa:{n:'Faixa de Força',d:'+12% ataque dos seus zoobumons',price:300,atk:.12},
  escudo:{n:'Escudo de Couro',d:'+12% defesa dos seus zoobumons',price:300,def:.12},
  lente:{n:'Lente do Caçador',d:'+20% de chance de captura',price:350,cap:.2},
  botas:{n:'Botas Velozes',d:'Você anda e corre mais rápido',price:200,spd:1},
  amufogo:{n:'Amuleto de Brasa',d:'+25% de dano em golpes de Fogo',price:450,boost:'Fogo'},
  amuagua:{n:'Amuleto da Maré',d:'+25% de dano em golpes de Água',price:450,boost:'Água'},
  amuplanta:{n:'Amuleto da Raiz',d:'+25% de dano em golpes de Planta',price:450,boost:'Planta'},
  amueletr:{n:'Amuleto do Raio',d:'+25% de dano em golpes Elétricos',price:450,boost:'Elétrico'},
  amupedra:{n:'Amuleto da Rocha',d:'+25% de dano em golpes de Pedra',price:450,boost:'Pedra'},
};
// skins: só visual. slot = onde vai no personagem; c = cores (principal, detalhe, enfeite)
const SKINS={
  bone_vermelho:{n:'Boné vermelho',slot:'cabeca',kind:'bone',c:['#d83a3a','#a02828'],price:250},
  bone_azul:{n:'Boné azul',slot:'cabeca',kind:'bone',c:['#3a6ad8','#28489a'],price:250},
  chapeu:{n:'Chapéu de palha',slot:'cabeca',kind:'chapeu',c:['#e8c870','#c8a050','#c83a3a'],price:400},
  gorro:{n:'Gorro',slot:'cabeca',kind:'gorro',c:['#38a050','#f4f4f4'],price:300},
  coroa:{n:'Coroa dourada',slot:'cabeca',kind:'coroa',c:['#f2c03a','#c88a18','#e83a5a'],price:2500},
  oculos_sol:{n:'Óculos escuros',slot:'rosto',kind:'sol',c:[],price:350},
  oculos_grau:{n:'Óculos de grau',slot:'rosto',kind:'grau',c:[],price:200},
  mochila:{n:'Mochila',slot:'costas',kind:'mochila',c:['#e0a020','#a87010'],price:450},
  cachecol:{n:'Cachecol',slot:'pescoco',kind:'cachecol',c:['#d84040','#f4f4f4'],price:300},
  touca:{n:'Touca de enfermeira',slot:'cabeca',kind:'touca',c:['#ffffff','#e04848'],price:0,hidden:1},
};
const SLOTN={cabeca:'Cabeça',rosto:'Rosto',pescoco:'Pescoço',costas:'Costas'};
const CLASSES={
  guerreiro:{n:'Guerreiro',d:'+15% de ataque pros seus zoobumons',atk:.15},
  guardiao:{n:'Guardião',d:'+15% de defesa e +10% de vida',def:.15,hp:.1},
  cacador:{n:'Caçador',d:'+25% de captura e acha mais zoobumons',cap:.25,enc:1.35},
  sabio:{n:'Sábio',d:'Seus zoobumons ganham +35% de XP',xp:.35},
};
const ENC={
  rota:[['ratuxo',42,2,4],['zumbel',32,2,4],['lodim',14,2,4],['faiscol',12,3,4],['caramelo',8,3,5],['zap',5,3,5],['cocozinho',10,2,4]],
  pedreira:[['pedrugo',40,6,9],['faiscol',28,6,9],['ratuxo',20,7,9],['cinzarel',12,7,10],['caramelo',8,6,9],['zap',5,7,9],['gudang',9,6,9]],
  bosque:[['zumbel',25,9,13],['lodim',22,9,13],['ratazao',20,10,13],['cinzarel',15,10,14],['pedrugo',10,10,13],['voltaro',8,12,15],['zubumafilho',12,9,12],['zap',5,10,13],['cocozinho',8,9,12],['gudang',6,10,13]],
};
const ZNAME={vila:'Vila Aurora',rota:'Trilha 1',pedreira:'Pedreira Seca',bosque:'Bosque Sombrio'};
const HAIR=['#3a2a22','#a05828','#e8c050','#c83030','#3858b8','#e4e4ec'];
const BEARDC=['#3a2a22','#6a4428','#a05828','#d8b048','#c83030','#8a8a92','#e4e4ec'];
const SKIN=['#f8d4ac','#dca474','#a8703e','#6e4626'];
const SHIRT=['#d84040','#3870d0','#38a050','#e0a020','#8848c0','#2c2c34'];
const PANTS=['#3a4a7c','#2a2a32','#705038','#4f6a4a'];

