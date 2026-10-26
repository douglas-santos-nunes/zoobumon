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
  cafe:{n:'Café Requentado',t:'Normal',p:40,a:100}, bajular:{n:'Bajulação',t:'Normal',p:55,a:100}, reuniao:{n:'Reunião Inútil',t:'Normal',p:65,a:95}, planilha:{n:'Planilha Errada',t:'Normal',p:80,a:90}, microgestao:{n:'Microgestão',t:'Normal',p:100,a:75},
  espuma:{n:'Espuma Gelada',t:'Água',p:40,a:100}, brinde:{n:'Brinde',t:'Normal',p:55,a:100}, saideira:{n:'Saideira',t:'Água',p:70,a:90}, arroto:{n:'Arroto Trovão',t:'Normal',p:80,a:90}, ressaca:{n:'Ressaca',t:'Água',p:95,a:80},
  larica:{n:'Larica',t:'Normal',p:60,a:100}, vibe:{n:'Boa Vibe',t:'Planta',p:85,a:90},
  bote:{n:'Bote',t:'Normal',p:60,a:100}, veneno:{n:'Veneno Verde',t:'Planta',p:75,a:90}, constricao:{n:'Constrição',t:'Normal',p:85,a:85}, botedobro:{n:'Bote em Dobro',t:'Planta',p:100,a:80},
  expresso:{n:'Expresso Fervendo',t:'Fogo',p:65,a:95}, filacopa:{n:'Fila da Copa',t:'Normal',p:70,a:90}, cafeina:{n:'Overdose de Cafeína',t:'Fogo',p:85,a:85}, ultimogole:{n:'Quem Bebeu o Último?',t:'Fogo',p:100,a:80},
  maisumponto:{n:'Só Mais Um Ponto',t:'Normal',p:50,a:100}, agendar:{n:'Vamos Agendar Outra',t:'Normal',p:75,a:90}, camerafechada:{n:'Câmera Desligada',t:'Normal',p:60,a:100}, alinhado:{n:'Alinhamento Total',t:'Normal',p:100,a:75},
  feijaorequentado:{n:'Feijão Requentado',t:'Normal',p:45,a:100}, tampavoadora:{n:'Tampa Voadora',t:'Normal',p:60,a:95}, microondas:{n:'Esquenta no Micro-ondas',t:'Fogo',p:70,a:90}, devolve:{n:'Devolve Meu Pote!',t:'Normal',p:90,a:85},
  pedrada:{n:'Pedrada',t:'Pedra',p:45,a:100}, desabamento:{n:'Desabamento',t:'Pedra',p:75,a:85},
};
const LS={
  fogo:[[1,'bicada'],[1,'brasa'],[6,'asas'],[11,'chamaviva'],[18,'esporao'],[24,'inferno']],
  agua:[[1,'investida'],[1,'jato'],[6,'mordida'],[11,'onda'],[18,'golpeduro'],[24,'maremoto']],
  planta:[[1,'investida'],[1,'folha'],[6,'arranhao'],[11,'raiz'],[18,'golpeduro'],[24,'furia']],
  rato:[[1,'investida'],[3,'arranhao'],[7,'mordida'],[14,'golpeduro']],
  inseto:[[1,'investida'],[1,'folha'],[8,'arranhao'],[12,'raiz']],
  cao:[[1,'investida'],[1,'arranhao'],[4,'latido'],[8,'mordida'],[15,'golpeduro'],[22,'furia']],
  lemure:[[1,'investida'],[1,'arranhao'],[6,'cauda'],[11,'mordida'],[18,'salto'],[24,'golpeduro']],
  zap:[[1,'investida'],[1,'notificacao'],[7,'figurinha'],[12,'corrente'],[18,'audio']],
  coco:[[1,'investida'],[1,'cheirinho'],[8,'mosquinhas'],[13,'fedido'],[19,'golpeduro']],
  serpente:[[1,'investida'],[1,'folha'],[6,'bote'],[11,'veneno'],[18,'constricao'],[24,'furia'],[30,'botedobro']],
  cafeteria:[[1,'investida'],[1,'brasa'],[5,'cafe'],[10,'expresso'],[16,'filacopa'],[22,'cafeina'],[30,'ultimogole']],
  daily:[[1,'investida'],[1,'maisumponto'],[6,'cafe'],[11,'camerafechada'],[16,'reuniao'],[22,'agendar'],[30,'alinhado']],
  marmita:[[1,'investida'],[1,'feijaorequentado'],[7,'tampavoadora'],[13,'microondas'],[20,'golpeduro'],[27,'devolve']],
  cigarro:[[1,'tosse'],[1,'brasa'],[7,'fumaca'],[13,'cinzas'],[21,'inferno']],
  escritorio:[[1,'investida'],[1,'cafe'],[6,'bajular'],[12,'reuniao'],[20,'planilha'],[30,'microgestao']],
  cerveja:[[1,'investida'],[1,'espuma'],[6,'brinde'],[12,'saideira'],[18,'arroto'],[28,'ressaca']],
  rasta:[[1,'tosse'],[1,'folha'],[7,'fumaca'],[13,'raiz'],[18,'larica'],[24,'vibe'],[30,'furia']],
};
const GREY={base:'#8a7a8e',light:'#b8aabc',dark:'#5a4c5e',belly:'#ece0ec',accent:'#3c3040'};
// b = atributos base, xp = XP que dá ao ser derrotado, cr = facilidade de captura, sh = forma do sprite gerado
const SPECIES={
  pintobrasa:{n:'Pintobrasa',t:'Fogo',b:{hp:42,atk:58,def:40,spd:66},xp:64,cr:.45,ls:LS.fogo,evo:['galardente',22],pal:{base:'#ffc83a',light:'#fff09a',dark:'#d8891a',belly:'#fff4c8',accent:'#ff6a2a'},sh:{rx:.55,ry:.6,cy:.6,sp:2,seed:11,nz:.55}},
  galardente:{n:'Galinacio',t:'Fogo',b:{hp:66,atk:92,def:60,spd:88},xp:150,cr:.15,ls:LS.fogo,pal:{base:'#e8552a',light:'#ff9a4a',dark:'#9a2a18',belly:'#ffd27a',accent:'#ffe14a'},sh:{rx:.78,ry:.8,cy:.54,sp:3,seed:11,nz:.55}},
  gotinho:{n:'Gotinho',t:'Água',b:{hp:50,atk:48,def:60,spd:46},xp:64,cr:.45,ls:LS.agua,evo:['zegotinha',22],sh:{rx:.62,ry:.55,cy:.62,sp:0,seed:23,nz:.4}},
  zegotinha:{n:'Zé Gotinha',t:'Água',b:{hp:76,atk:74,def:86,spd:62},xp:150,cr:.15,ls:LS.agua,pal:{base:'#9ccff4',light:'#d6efff',dark:'#4a88cc',belly:'#ffffff',accent:'#ffffff'},sh:{rx:.85,ry:.72,cy:.56,sp:1,seed:23,nz:.4}},
  brotelo:{n:'Cobrume',t:'Planta',b:{hp:50,atk:56,def:46,spd:56},xp:64,cr:.45,ls:LS.serpente,evo:['floresko',22],sh:{rx:.62,ry:.58,cy:.6,sp:0,seed:37,nz:.4},
    pal:{base:'#4c9a3a',light:'#8ad060',dark:'#1c4220',belly:'#e8dc98',accent:'#f2d030',lingua:'#e83a4a'}},
  floresko:{n:'Cobrume Duplo',t:'Planta',b:{hp:76,atk:90,def:68,spd:76},xp:150,cr:.15,ls:LS.serpente,sh:{rx:.85,ry:.8,cy:.55,sp:0,seed:37,nz:.4},
    pal:{base:'#2f7a36',light:'#6ab84e',dark:'#0f2a14',belly:'#d8c470',accent:'#ff3a24',lingua:'#e83a4a',chifre:'#e8e0c8'}},
  ratuxo:{n:'Ratuxo',t:'Normal',b:{hp:38,atk:50,def:35,spd:70},xp:40,cr:.7,ls:LS.rato,evo:['ratazao',20],pal:GREY,sh:{rx:.5,ry:.5,cy:.64,sp:2,seed:41,nz:.6}},
  ratazao:{n:'Ratatuile',t:'Normal',b:{hp:62,atk:78,def:56,spd:92},xp:110,cr:.3,ls:LS.rato,pal:GREY,sh:{rx:.72,ry:.7,cy:.57,sp:2,seed:41,nz:.6}},
  zumbel:{n:'Abelhume',t:'Planta',b:{hp:42,atk:56,def:40,spd:66},xp:50,cr:.6,ls:LS.inseto,pal:{base:'#f2c228',light:'#ffe680',dark:'#2a2420',belly:'#fff2b0',accent:'#e83028',ferrao:'#3a3036'},sh:{rx:.5,ry:.62,cy:.56,sp:2,seed:53,nz:.75}},
  caramelo:{n:'Caramelo',t:'Normal',b:{hp:55,atk:58,def:48,spd:66},xp:58,cr:.45,ls:LS.cao,evo:['caramelao',24],pal:{base:'#d8914a',light:'#f0bc78',dark:'#a8642c',belly:'#f6e2bc',accent:'#d84040'},sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:7,nz:.5}},
  caramelao:{n:'Caramelo BR',t:'Normal',b:{hp:82,atk:88,def:68,spd:90},xp:150,cr:.15,ls:LS.cao,pal:{base:'#c98240',light:'#eab06a',dark:'#94562a',belly:'#f4dcb0',accent:'#3a3440'},sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:7,nz:.5}},
  zubumafilho:{n:'Zubumafilho',t:'Normal',b:{hp:48,atk:52,def:44,spd:80},xp:62,cr:.4,ls:LS.lemure,evo:['zubumapai',26],pal:{base:'#9a96a2',light:'#c9c5cf',dark:'#3a3640',belly:'#f4f1ea',accent:'#f2a024'},sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:5,nz:.5}},
  zubumapai:{n:'Zubumapai',t:'Normal',b:{hp:76,atk:84,def:66,spd:102},xp:155,cr:.15,ls:LS.lemure,pal:{base:'#8c8896',light:'#bdb9c4',dark:'#302c36',belly:'#f2eee6',accent:'#f29a1c'},sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:5,nz:.5}},
  zap:{n:'Zap',t:'Elétrico',b:{hp:54,atk:60,def:50,spd:74},xp:70,cr:.35,ls:LS.zap,pal:{base:'#3ccf6a',light:'#90f0aa',dark:'#1e8a44',belly:'#ffffff',accent:'#4fb8f0'},sh:{rx:.7,ry:.6,cy:.55,sp:0,seed:3,nz:.4}},
  cocozinho:{n:'Procedimento',t:'Normal',b:{hp:62,atk:46,def:62,spd:34},xp:55,cr:.6,ls:LS.coco,pal:{base:'#8a5530',light:'#b8804e',dark:'#5a3418',belly:'#ffffff',accent:'#2a2a34'},sh:{rx:.7,ry:.6,cy:.6,sp:0,seed:9,nz:.4}},
  gudang:{n:'Gudang',t:'Fogo',b:{hp:46,atk:64,def:42,spd:60},xp:66,cr:.4,ls:LS.cigarro,evo:['rastafolha',26],pal:{base:'#c8925a',light:'#e8bc84',dark:'#8a5a30',belly:'#f4e8d4',accent:'#e0a040'},sh:{rx:.5,ry:.7,cy:.55,sp:0,seed:13,nz:.4}},
  rastafolha:{n:'Rastafolha',t:'Planta',b:{hp:70,atk:84,def:58,spd:72},xp:150,cr:.15,ls:LS.rasta,sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:13,nz:.4},
    pal:{base:'#7cc85a',belly:'#a8e078',accent:'#f2c03a',dark:'#2a6a2c',light:'#b4ec8c',folha:'#3f9a3c',caule:'#5a9a3a',gorro_v:'#d83a3a',gorro_a:'#f2c03a',gorro_g:'#38a050',faixa:'#2a2226',dread:'#4a2a18'}},
  estagiario:{n:'Estagiário',t:'Normal',b:{hp:40,atk:40,def:35,spd:55},xp:50,cr:.6,ls:LS.escritorio,evo:['puxasaco',20],sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:21,nz:.4},
    pal:{base:'#3a6ad8',belly:'#ffffff',accent:'#3a6ad8',dark:'#3a2a22',light:'#9ad4f8',pele:'#f2c8a0',camisa:'#f4f4f8',calca:'#3a4060',cabelo:'#3a2a22',sapato:'#2a2226',copo:'#ffffff',cafe:'#8a5a34',suor:'#9ad4f8'}},
  puxasaco:{n:'Puxa-Saco Incompetente',t:'Normal',b:{hp:60,atk:62,def:55,spd:70},xp:120,cr:.25,ls:LS.escritorio,evo:['lider',36],sh:{rx:.7,ry:.7,cy:.56,sp:0,seed:21,nz:.4},
    pal:{base:'#6a6e7e',belly:'#ffffff',accent:'#d83a3a',dark:'#2a2226',light:'#c8ccd8',pele:'#f2c8a0',camisa:'#f4f4f8',terno:'#6a6e7e',gravata:'#d83a3a',cabelo:'#2a2220',sapato:'#2a2226'}},
  lider:{n:'Líder Despreparado',t:'Normal',b:{hp:85,atk:90,def:75,spd:60},xp:190,cr:.1,ls:LS.escritorio,sh:{rx:.85,ry:.8,cy:.55,sp:0,seed:21,nz:.4},
    pal:{base:'#2c3450',belly:'#ffffff',accent:'#d83a3a',dark:'#2a2226',light:'#9aa4c0',pele:'#f2c8a0',camisa:'#f4f4f8',terno:'#2c3450',gravata:'#d83a3a',cabelo:'#7a7a84',sapato:'#2a2226',papel:'#fbfbf4',vermelho:'#e04848'}},
  cafezinho:{n:'Cafezinho',t:'Fogo',b:{hp:44,atk:52,def:40,spd:60},xp:52,cr:.55,ls:LS.cafeteria,evo:['cafeteira',22],sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:43,nz:.4},
    pal:{base:'#f6f1e8',belly:'#ffffff',accent:'#c8803a',dark:'#9a8a7a',light:'#ffffff',xicara:'#f6f1e8',pires:'#e6ddd0',cafe:'#5a3420',crema:'#c8904e'}},
  cafeteira:{n:'Cafeteira da Copa',t:'Fogo',b:{hp:66,atk:70,def:64,spd:60},xp:130,cr:.22,ls:LS.cafeteria,evo:['garrafa',38],sh:{rx:.75,ry:.75,cy:.56,sp:0,seed:43,nz:.4},
    pal:{base:'#3a3a44',belly:'#d8ecf6',accent:'#ff3a2a',dark:'#1e1e26',light:'#6a6a78',maquina:'#3a3a44',painel:'#8a8a98',vidro:'#d8ecf6',cafe:'#4a2a18',luz:'#ff3a2a'}},
  garrafa:{n:'Garrafa Térmica Vazia',t:'Fogo',b:{hp:90,atk:92,def:72,spd:52},xp:200,cr:.08,ls:LS.cafeteria,sh:{rx:.85,ry:.85,cy:.55,sp:0,seed:43,nz:.4},
    pal:{base:'#d83a3a',belly:'#c8ccd4',accent:'#c8ccd4',dark:'#6a1418',light:'#f07060',garrafa:'#d83a3a',metal:'#c8ccd4',tampa:'#2a2a32',botao:'#c8ccd4',cafe:'#4a2a18'}},
  daily:{n:'Daily',t:'Normal',b:{hp:48,atk:44,def:46,spd:58},xp:50,cr:.6,ls:LS.daily,evo:['reuniaoemail',22],sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:47,nz:.4},
    pal:{base:'#f8f8fc',belly:'#ffffff',accent:'#f2c03a',dark:'#7a7a90',light:'#ffffff',balao:'#f8f8fc',relogio:'#f2c03a'}},
  reuniaoemail:{n:'Reunião Que Podia Ser Um Email',t:'Normal',b:{hp:68,atk:64,def:70,spd:58},xp:130,cr:.22,ls:LS.daily,evo:['alinhamento',38],sh:{rx:.75,ry:.75,cy:.56,sp:0,seed:47,nz:.4},
    pal:{base:'#f4ecd8',belly:'#ffffff',accent:'#3a6ad8',dark:'#7a6a50',light:'#fffaf0',envelope:'#f4ecd8',dobra:'#ddd0b2',gravata:'#3a6ad8',selo:'#d83a3a',luz:'#ff3a2a'}},
  alinhamento:{n:'Alinhamento Semanal',t:'Normal',b:{hp:96,atk:86,def:84,spd:46},xp:200,cr:.08,ls:LS.daily,sh:{rx:.85,ry:.85,cy:.55,sp:0,seed:47,nz:.4},
    pal:{base:'#ffffff',belly:'#ffffff',accent:'#d83a3a',dark:'#5a5a66',light:'#ffffff',folha:'#fbfbfe',topo:'#d83a3a',argola:'#5a5a66',grade:'#c4c4d2'}},
  marmitiol:{n:'Marmitiol',t:'Normal',b:{hp:72,atk:58,def:74,spd:38},xp:70,cr:.35,ls:LS.marmita,sh:{rx:.7,ry:.6,cy:.6,sp:0,seed:53,nz:.4},
    pal:{base:'#eef4f6',belly:'#ffffff',accent:'#3a8ad8',dark:'#5a6a7a',light:'#ffffff',pote:'#eaf2f6',tampa:'#3a8ad8',arroz:'#fbf6e8',feijao:'#5a3020',farofa:'#e8c070',tomate:'#e04848',fita:'#f0e0a8'}},
  cervejinha:{n:'Cervejinha',t:'Água',b:{hp:45,atk:45,def:40,spd:55},xp:52,cr:.55,ls:LS.cerveja,evo:['chopp',22],sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:31,nz:.4},
    pal:{base:'#f2a81c',belly:'#fff8e8',accent:'#ffffff',dark:'#b8700c',light:'#ffd860',vidro:'#e2f0fa',cerveja:'#f2a81c',faceta:'#d88a10',espuma:'#fffaf0'}},
  chopp:{n:'Chopp Artesanal',t:'Água',b:{hp:65,atk:70,def:60,spd:65},xp:130,cr:.22,ls:LS.cerveja,evo:['litraco',38],sh:{rx:.75,ry:.75,cy:.56,sp:0,seed:31,nz:.4},
    pal:{base:'#d8781a',belly:'#fff8e8',accent:'#ffffff',dark:'#985010',light:'#f0b048',vidro:'#e2f0fa',cerveja:'#d8781a',espuma:'#fffaf0',bigode:'#4a2a18'}},
  litraco:{n:'Litraço',t:'Água',b:{hp:95,atk:85,def:70,spd:45},xp:200,cr:.08,ls:LS.cerveja,sh:{rx:.85,ry:.85,cy:.55,sp:0,seed:31,nz:.4},
    pal:{base:'#7a4a1a',belly:'#f4e6c0',accent:'#e8b020',dark:'#4a2a0c',light:'#a87038',garrafa:'#7a4a1a',tampa:'#e8b020',rotulo:'#f4e6c0',vermelho:'#d83a3a',espuma:'#fffaf0'}},
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
  bone_mst:{n:'Boné MST',slot:'cabeca',kind:'bone',c:['#d83a3a','#a02828'],txt:'MST',price:350},
  bone_vero:{n:'Boné VERO',slot:'cabeca',kind:'bone',c:['#3a6ad8','#28489a'],txt:'VERO',price:350},
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
  rota:[['daily',7,3,5],['ratuxo',42,2,4],['zumbel',32,2,4],['caramelo',8,3,5],['zap',5,3,5],['cocozinho',10,2,4],['estagiario',8,3,5],['cervejinha',6,3,5]],
  pedreira:[['marmitiol',6,7,9],['cafezinho',14,6,9],['daily',14,6,9],['ratuxo',20,7,9],['caramelo',8,6,9],['zap',5,7,9],['gudang',9,6,9],['estagiario',7,6,9],['cervejinha',6,6,9]],
  bosque:[['marmitiol',8,10,13],['cafezinho',7,9,12],['cafeteira',3,14,15],['reuniaoemail',3,14,15],['zumbel',25,9,13],['ratazao',20,10,13],['zubumafilho',12,9,12],['zap',5,10,13],['cocozinho',8,9,12],['gudang',6,10,13],['cervejinha',5,10,12]],
};
const ZNAME={vila:'Vila Aurora',rota:'Trilha 1',pedreira:'Pedreira Seca',bosque:'Bosque Sombrio'};
const HAIR=['#3a2a22','#a05828','#e8c050','#c83030','#3858b8','#e4e4ec'];
const BEARDC=['#3a2a22','#6a4428','#a05828','#d8b048','#c83030','#8a8a92','#e4e4ec'];
const SKIN=['#f8d4ac','#dca474','#a8703e','#6e4626'];
const SHIRT=['#d84040','#3870d0','#38a050','#e0a020','#8848c0','#2c2c34'];
const PANTS=['#3a4a7c','#2a2a32','#705038','#4f6a4a'];

