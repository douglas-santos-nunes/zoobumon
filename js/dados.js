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
  cheirinho:{n:'Cheirinho',t:'Normal',p:40,a:100}, mosquinhas:{n:'Nuvem de Mosquinhas',t:'Normal',p:55,a:100}, fedido:{n:'Arremesso Fedido',t:'Normal',p:75,a:90}, enxame:{n:'Enxame de Moscas',t:'Normal',p:85,a:85}, podridao:{n:'Podridão Total',t:'Normal',p:100,a:75},
  tosse:{n:'Tosse Seca',t:'Normal',p:40,a:100}, fumaca:{n:'Fumaça Densa',t:'Normal',p:55,a:100}, cinzas:{n:'Chuva de Cinzas',t:'Fogo',p:70,a:90},
  cafe:{n:'Café Requentado',t:'Normal',p:40,a:100}, bajular:{n:'Bajulação',t:'Normal',p:55,a:100}, reuniao:{n:'Reunião Inútil',t:'Normal',p:65,a:95}, planilha:{n:'Planilha Errada',t:'Normal',p:80,a:90}, microgestao:{n:'Microgestão',t:'Normal',p:100,a:75},
  espuma:{n:'Espuma Gelada',t:'Água',p:40,a:100}, brinde:{n:'Brinde',t:'Normal',p:55,a:100}, saideira:{n:'Saideira',t:'Água',p:70,a:90}, arroto:{n:'Arroto Trovão',t:'Normal',p:80,a:90}, ressaca:{n:'Ressaca',t:'Água',p:95,a:80},
  larica:{n:'Larica',t:'Normal',p:60,a:100}, vibe:{n:'Boa Vibe',t:'Planta',p:85,a:90},
  bote:{n:'Bote',t:'Normal',p:60,a:100}, veneno:{n:'Veneno Verde',t:'Planta',p:75,a:90}, constricao:{n:'Constrição',t:'Normal',p:85,a:85}, botedobro:{n:'Bote em Dobro',t:'Planta',p:100,a:80},
  expresso:{n:'Expresso Fervendo',t:'Fogo',p:65,a:95}, filacopa:{n:'Fila da Copa',t:'Normal',p:70,a:90}, cafeina:{n:'Overdose de Cafeína',t:'Fogo',p:85,a:85}, ultimogole:{n:'Quem Bebeu o Último?',t:'Fogo',p:100,a:80},
  maisumponto:{n:'Só Mais Um Ponto',t:'Normal',p:50,a:100}, agendar:{n:'Vamos Agendar Outra',t:'Normal',p:75,a:90}, camerafechada:{n:'Câmera Desligada',t:'Normal',p:60,a:100}, alinhado:{n:'Alinhamento Total',t:'Normal',p:100,a:75},
  feijaorequentado:{n:'Feijão Requentado',t:'Normal',p:45,a:100}, tampavoadora:{n:'Tampa Voadora',t:'Normal',p:60,a:95}, microondas:{n:'Esquenta no Micro-ondas',t:'Fogo',p:70,a:90}, devolve:{n:'Devolve Meu Pote!',t:'Normal',p:90,a:85},
  gelinho:{n:'Gelinho do Freezer',t:'Água',p:65,a:95}, degelo:{n:'Degelo da Geladeira',t:'Água',p:95,a:80},
  garrafiada:{n:'Garras Afiadas',t:'Normal',p:55,a:100}, mordidamaluca:{n:'Mordida Maluca',t:'Normal',p:70,a:90}, naotonemai:{n:'Não Tô Nem Aí',t:'Normal',p:85,a:85}, furiatexugo:{n:'Fúria de Texugo',t:'Normal',p:110,a:70},
  desespero:{n:'Desespero',t:'Normal',p:40,a:100},
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
  coco:[[1,'investida'],[1,'cheirinho'],[8,'mosquinhas'],[13,'fedido'],[19,'golpeduro'],[26,'enxame'],[34,'podridao']],
  serpente:[[1,'investida'],[1,'folha'],[6,'bote'],[11,'veneno'],[18,'constricao'],[24,'furia'],[30,'botedobro']],
  cafeteria:[[1,'investida'],[1,'brasa'],[5,'cafe'],[10,'expresso'],[16,'filacopa'],[22,'cafeina'],[30,'ultimogole']],
  daily:[[1,'investida'],[1,'maisumponto'],[6,'cafe'],[11,'camerafechada'],[16,'reuniao'],[22,'agendar'],[30,'alinhado']],
  marmita:[[1,'investida'],[1,'feijaorequentado'],[7,'tampavoadora'],[13,'gelinho'],[20,'golpeduro'],[27,'devolve'],[34,'degelo']],
  texugo:[[1,'arranhao'],[1,'mordida'],[8,'garrafiada'],[14,'mordidamaluca'],[22,'naotonemai'],[30,'furiatexugo']],
  cigarro:[[1,'tosse'],[1,'brasa'],[7,'fumaca'],[13,'cinzas'],[21,'inferno']],
  escritorio:[[1,'investida'],[1,'cafe'],[6,'bajular'],[12,'reuniao'],[20,'planilha'],[30,'microgestao']],
  cerveja:[[1,'investida'],[1,'espuma'],[6,'brinde'],[12,'saideira'],[18,'arroto'],[28,'ressaca']],
  rasta:[[1,'tosse'],[1,'folha'],[7,'fumaca'],[13,'raiz'],[18,'larica'],[24,'vibe'],[30,'furia']],
};
const GREY={base:'#8a7a8e',light:'#b8aabc',dark:'#5a4c5e',belly:'#ece0ec',accent:'#3c3040'};
// b = atributos base, xp = XP que dá ao ser derrotado, cr = facilidade de captura, sh = forma do sprite gerado
const SPECIES={
  pintobrasa:{n:'Frangote',t:'Fogo',b:{hp:42,atk:58,def:40,spd:66},xp:64,cr:.45,ls:LS.fogo,evo:['galardente',22],pal:{base:'#f6a828',light:'#ffd870',dark:'#8a3a14',belly:'#ffe2a0',accent:'#ff4a1a'},sh:{rx:.55,ry:.6,cy:.6,sp:2,seed:11,nz:.55}},
  galardente:{n:'Galinacio',t:'Fogo',b:{hp:66,atk:92,def:60,spd:88},xp:150,cr:.15,ls:LS.fogo,evo:['galinferno',38],pal:{base:'#e8552a',light:'#ff9a4a',dark:'#9a2a18',belly:'#ffd27a',accent:'#ffe14a'},sh:{rx:.78,ry:.8,cy:.54,sp:3,seed:11,nz:.55}},
  gotinho:{n:'Pingaço',t:'Água',b:{hp:50,atk:48,def:60,spd:46},xp:64,cr:.45,ls:LS.agua,evo:['zegotinha',22],sh:{rx:.62,ry:.55,cy:.62,sp:0,seed:23,nz:.4},
    pal:{base:'#2f6cc0',light:'#7ab8f0',dark:'#173e7a',belly:'#8cc2f0',accent:'#f8f8f8',faixa:'#d83a3a'}},
  zegotinha:{n:'Zé Gotinha',t:'Água',b:{hp:76,atk:74,def:86,spd:62},xp:150,cr:.15,ls:LS.agua,evo:['tromba',38],pal:{base:'#245aa8',light:'#6aa8e8',dark:'#10305e',belly:'#7cb4ea',accent:'#f8f8f8',faixa:'#d83a3a',luva:'#d83a3a'},sh:{rx:.85,ry:.72,cy:.56,sp:1,seed:23,nz:.4}},
  brotelo:{n:'Cobrume',t:'Planta',b:{hp:50,atk:56,def:46,spd:56},xp:64,cr:.45,ls:LS.serpente,evo:['floresko',22],sh:{rx:.62,ry:.58,cy:.6,sp:0,seed:37,nz:.4},
    pal:{base:'#4c9a3a',light:'#8ad060',dark:'#1c4220',belly:'#e8dc98',accent:'#f2d030',lingua:'#e83a4a'}},
  floresko:{n:'Cobrume Duplo',t:'Planta',b:{hp:76,atk:90,def:68,spd:76},xp:150,cr:.15,ls:LS.serpente,evo:['cobrumetriplo',38],sh:{rx:.85,ry:.8,cy:.55,sp:0,seed:37,nz:.4},
    pal:{base:'#2f7a36',light:'#6ab84e',dark:'#0f2a14',belly:'#d8c470',accent:'#ff3a24',lingua:'#e83a4a',chifre:'#e8e0c8'}},
  ratuxo:{n:'Ratuxo',t:'Normal',b:{hp:38,atk:50,def:35,spd:70},xp:40,cr:.7,ls:LS.rato,evo:['ratazao',20],pal:GREY,sh:{rx:.5,ry:.5,cy:.64,sp:2,seed:41,nz:.6}},
  ratazao:{n:'Ratatuile',t:'Normal',b:{hp:62,atk:78,def:56,spd:92},xp:110,cr:.3,ls:LS.rato,evo:['reiesgoto',36],pal:GREY,sh:{rx:.72,ry:.7,cy:.57,sp:2,seed:41,nz:.6}},
  zumbel:{n:'Abelhume',t:'Planta',b:{hp:42,atk:56,def:40,spd:66},xp:50,cr:.6,ls:LS.inseto,evo:['abelhote',22],pal:{base:'#f2c228',light:'#ffe680',dark:'#2a2420',belly:'#fff2b0',accent:'#e83028',ferrao:'#3a3036'},sh:{rx:.5,ry:.62,cy:.56,sp:2,seed:53,nz:.75}},
  caramelo:{n:'Caramelo',t:'Normal',b:{hp:55,atk:58,def:48,spd:66},xp:58,cr:.45,ls:LS.cao,evo:['caramelao',24],pal:{base:'#d8914a',light:'#f0bc78',dark:'#a8642c',belly:'#f6e2bc',accent:'#d84040'},sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:7,nz:.5}},
  caramelao:{n:'Caramelo BR',t:'Normal',b:{hp:82,atk:88,def:68,spd:90},xp:150,cr:.15,ls:LS.cao,evo:['caramelomito',38],pal:{base:'#c98240',light:'#eab06a',dark:'#94562a',belly:'#f4dcb0',accent:'#3a3440'},sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:7,nz:.5}},
  zubumafilho:{n:'Zubumafilho',t:'Normal',b:{hp:48,atk:52,def:44,spd:80},xp:62,cr:.4,ls:LS.lemure,evo:['zubumapai',26],pal:{base:'#9a96a2',light:'#c9c5cf',dark:'#3a3640',belly:'#f4f1ea',accent:'#f2a024'},sh:{rx:.6,ry:.6,cy:.6,sp:0,seed:5,nz:.5}},
  zubumapai:{n:'Zubumapai',t:'Normal',b:{hp:76,atk:84,def:66,spd:102},xp:155,cr:.15,ls:LS.lemure,evo:['zubumavo',40],pal:{base:'#8c8896',light:'#bdb9c4',dark:'#302c36',belly:'#f2eee6',accent:'#f29a1c'},sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:5,nz:.5}},
  zap:{n:'Zap',t:'Elétrico',b:{hp:54,atk:60,def:50,spd:74},xp:70,cr:.35,ls:LS.zap,evo:['zapfone',22],pal:{base:'#3ccf6a',light:'#90f0aa',dark:'#1e8a44',belly:'#ffffff',accent:'#4fb8f0'},sh:{rx:.7,ry:.6,cy:.55,sp:0,seed:3,nz:.4}},
  cocozinho:{n:'Procedimento Padrão',t:'Normal',b:{hp:62,atk:46,def:62,spd:34},xp:55,cr:.6,ls:LS.coco,evo:['pericle',24],pal:{base:'#8a5530',light:'#b8804e',dark:'#5a3418',belly:'#ffffff',accent:'#2a2a34'},sh:{rx:.7,ry:.6,cy:.6,sp:0,seed:9,nz:.4}},
  pericle:{n:'Procedimento Pericle',t:'Normal',b:{hp:92,atk:78,def:90,spd:42},xp:160,cr:.15,ls:LS.coco,evo:['procfatal',40],sh:{rx:.85,ry:.8,cy:.55,sp:0,seed:9,nz:.4},
    pal:{base:'#6e5a26',light:'#9a8440',dark:'#3a2c10',belly:'#d8c860',accent:'#1e1e24',mofo:'#7aa040',fedor:'#a8c860',olho:'#ecec9a',veia:'#d83a3a',dente:'#d8c860',milho:'#f4d23a'}},
  gudang:{n:'Gudang',t:'Fogo',b:{hp:46,atk:64,def:42,spd:60},xp:66,cr:.4,ls:LS.cigarro,evo:['rastafolha',26],pal:{base:'#c8925a',light:'#e8bc84',dark:'#8a5a30',belly:'#f4e8d4',accent:'#e0a040'},sh:{rx:.5,ry:.7,cy:.55,sp:0,seed:13,nz:.4}},
  rastafolha:{n:'Rastafolha',t:'Planta',b:{hp:70,atk:84,def:58,spd:72},xp:150,cr:.15,ls:LS.rasta,evo:['rastarei',40],sh:{rx:.8,ry:.8,cy:.55,sp:0,seed:13,nz:.4},
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
  marmitiol:{n:'Marmitiol',t:'Água',b:{hp:72,atk:58,def:74,spd:38},xp:70,cr:.35,ls:LS.marmita,evo:['lancheriol',22],sh:{rx:.7,ry:.6,cy:.6,sp:0,seed:53,nz:.4},
    pal:{base:'#eef4f6',belly:'#ffffff',accent:'#3a8ad8',dark:'#5a6a7a',light:'#ffffff',pote:'#eaf2f6',tampa:'#3a8ad8',arroz:'#fbf6e8',feijao:'#5a3020',farofa:'#e8c070',tomate:'#e04848',fita:'#f0e0a8'}},
  texugo:{n:'Texugo',t:'Normal',b:{hp:70,atk:92,def:60,spd:84},xp:120,cr:.18,ls:LS.texugo,evo:['texugomilho',26],sh:{rx:.75,ry:.65,cy:.58,sp:0,seed:59,nz:.5},
    pal:{base:'#8e8a94',belly:'#b4b0ba',accent:'#e83a2a',dark:'#1e1a22',light:'#c4c0ca',capa:'#f6f4ee'}},
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

// formas novas: herdam cores e golpes da forma anterior, com ajustes (desenhos em SHAPES, sprites.js)
const novoZ=(k,base,o)=>{SPECIES[k]={...o,ls:o.ls||SPECIES[base].ls,pal:{...(SPECIES[base].pal||{}),...(o.pal||{})},sh:{...SPECIES[base].sh,rx:.9,ry:.88}}};
novoZ('galinferno','galardente',{n:'Galinferno',t:'Fogo',b:{hp:88,atk:118,def:78,spd:104},xp:230,cr:.05,pal:{base:'#7a1414',dark:'#2a0808',light:'#c83a2a',belly:'#ffc84a',accent:'#ffe14a',crista:'#ffd23a'}});
novoZ('tromba','zegotinha',{n:"Tromba d'Água",t:'Água',b:{hp:104,atk:96,def:108,spd:72},xp:230,cr:.05,pal:{base:'#183e88',dark:'#0a1c44',light:'#4a8ae0',belly:'#5a9ae8',faixa:'#f2c03a',cinto:'#f2c03a',fivela:'#ffffff',onda:'#9ad8f8'}});
novoZ('cobrumetriplo','floresko',{n:'Cobrume Triplo',t:'Planta',b:{hp:94,atk:114,def:86,spd:92},xp:230,cr:.05,pal:{base:'#1f5a3a',dark:'#08180e',accent:'#ffd23a',chifre:'#f0e0b8'}});
novoZ('reiesgoto','ratazao',{n:'Rei do Esgoto',t:'Normal',b:{hp:86,atk:104,def:74,spd:112},xp:210,cr:.06,pal:{base:'#5a4c5e',light:'#8a7a8e',dark:'#2a2030',belly:'#b8aabc',coroa:'#f2c03a',gema:'#e83a5a',capa:'#6a1a7a',forro:'#c8283a',arminho:'#f8f6f0',ouro:'#f2c03a'}});
novoZ('caramelomito','caramelao',{n:'Caramelo Mito',t:'Normal',b:{hp:102,atk:110,def:86,spd:104},xp:230,cr:.05,pal:{capa:'#1e9a4a',borda:'#f6d32a',ouro:'#f2c03a',gema:'#2a5ad8'}});
novoZ('zubumavo','zubumapai',{n:'Zubumavô',t:'Normal',b:{hp:98,atk:96,def:92,spd:108},xp:230,cr:.05,pal:{base:'#a8a4b0',light:'#d8d4dc',dark:'#4a4650',barba:'#f8f8f4',bengala:'#8a5a30'}});
novoZ('procfatal','pericle',{n:'Procedimento Fatal',t:'Normal',b:{hp:120,atk:100,def:112,spd:44},xp:240,cr:.04,pal:{base:'#3e3014',light:'#6e5a26',dark:'#140e06',mofo:'#9ad040',fedor:'#c8f060',olho:'#d8ff6a',poca:'#6a9a30',dente:'#e8d870',chifre:'#cbbd84'}});
novoZ('rastarei','rastafolha',{n:'Rasta Rei',t:'Planta',b:{hp:92,atk:106,def:84,spd:94},xp:220,cr:.05,pal:{folha:'#2f8a34',coroa:'#f2c03a',violao:'#c8803a',braco:'#6a3a1a',corda:'#f4f0e0'}});
novoZ('abelhote','zumbel',{n:'Abelhote',t:'Planta',b:{hp:66,atk:82,def:70,spd:88},xp:120,cr:.25,pal:{base:'#f2a828',light:'#ffd870',dark:'#1e1a1c',capacete:'#8a8e9a',penacho:'#e83a3a',lanca:'#8a5a30',escudo:'#c8902a'}});
novoZ('colmeiona','zumbel',{n:'Colmeiona',t:'Planta',b:{hp:110,atk:104,def:100,spd:70},xp:230,cr:.05,pal:{base:'#f2c228',colmeia:'#e0a83a',dark:'#5a3410',light:'#f8d070',mel:'#f2a81c',coroa:'#f2c03a',accent:'#ff3a2a'}});
novoZ('zapfone','zap',{n:'Zapfone',t:'Elétrico',b:{hp:72,atk:84,def:72,spd:96},xp:130,cr:.22,pal:{celular:'#26262e',tela:'#cfeee0',trinca:'#ffffff',dark:'#0e0e14'}});
novoZ('antena5g','zap',{n:'Antenão 5G',t:'Elétrico',b:{hp:104,atk:116,def:94,spd:88},xp:240,cr:.04,pal:{base:'#3ccf6a',metal:'#9aa0ac',dark:'#3a3e48',light:'#d8dce4',luz:'#ff2a1a',sinal:'#34b7f1',caixa:'#2fae5a',painel:'#eef0f4',belly:'#ffffff'}});
novoZ('lancheriol','marmitiol',{n:'Lancheriol',t:'Água',b:{hp:94,atk:72,def:96,spd:46},xp:130,cr:.22,pal:{lancheira:'#3a7ad8',bolso:'#2a5aa8',ziper:'#e8e8f0',alca:'#2a2a32',floco:'#ffffff',dark:'#1a2a4a',light:'#8ab8f0'}});
novoZ('geladeirol','marmitiol',{n:'Geladeirol',t:'Água',b:{hp:124,atk:96,def:124,spd:40},xp:240,cr:.04,pal:{base:'#eef2f8',geladeira:'#eef2f8',dark:'#5a6070',puxador:'#9aa0ac',ima1:'#e04848',ima2:'#f2c03a',ima3:'#38a050',gelo:'#bfe8f8',belly:'#e0e6f0',light:'#ffffff'}});
novoZ('texugomilho','texugo',{n:'Texugo do Milho',t:'Normal',b:{hp:88,atk:106,def:78,spd:96},xp:150,cr:.12,pal:{palha:'#e8c870',fita:'#d83a3a',milho:'#f4d23a',folhamilho:'#58a040',xadrez:'#d84848'}});
novoZ('texugomel','texugo',{n:'Texugo do Mel',t:'Normal',b:{hp:100,atk:130,def:86,spd:110},xp:250,cr:.04,pal:{base:'#4a4650',belly:'#7a7682',dark:'#141016',mel:'#f2a81c',favo:'#f2c03a',abelha:'#f2c228',olhovermelho:'#ff2a1a'}});
// as formas do meio dos que eram sozinhos também evoluem
SPECIES.abelhote.evo=['colmeiona',38];SPECIES.zapfone.evo=['antena5g',38];SPECIES.lancheriol.evo=['geladeirol',38];SPECIES.texugomilho.evo=['texugomel',42];
// ordem da Zoobudex: cada família junta
(()=>{const ordem=['pintobrasa','galardente','galinferno','gotinho','zegotinha','tromba','brotelo','floresko','cobrumetriplo','ratuxo','ratazao','reiesgoto',
  'zumbel','abelhote','colmeiona','caramelo','caramelao','caramelomito','zubumafilho','zubumapai','zubumavo','zap','zapfone','antena5g',
  'cocozinho','pericle','procfatal','gudang','rastafolha','rastarei'];
  const resto=Object.keys(SPECIES).filter(k=>!ordem.includes(k));
  for(const k of[...ordem,...resto]){const v=SPECIES[k];delete SPECIES[k];SPECIES[k]=v}
  for(const x of['marmitiol','lancheriol','geladeirol','texugo','texugomilho','texugomel']){const v=SPECIES[x];delete SPECIES[x];SPECIES[x]=v}
})();

const ITEMS={
  pocao:{n:'Poção',d:'Cura 25 PV de um zoobumon',price:60,heal:25},
  superp:{n:'Super Poção',d:'Cura 70 PV de um zoobumon',price:180,heal:70},
  antidoto:{n:'Antídoto',d:'Cura o envenenamento de um zoobumon',price:80,cure:'env'},
  cafecoado:{n:'Elixir',d:'Recupera os PP de todos os golpes de um zoobumon',price:120,pp:1},
  rede:{n:'Rede',d:'Captura zoobumons selvagens',price:60,net:1},
  redeouro:{n:'Rede de Ouro',d:'Captura com 1,8× mais chance',price:200,net:1.8},
};
const GEAR={
  faixa:{n:'Faixa de Força',d:'+10% ataque dos seus zoobumons',price:1000,atk:.1},
  escudo:{n:'Escudo de Couro',d:'+10% defesa dos seus zoobumons',price:1000,def:.1},
  lente:{n:'Lente do Caçador',d:'+20% de chance de captura',price:1000,cap:.2},
  botas:{n:'Botas Velozes',d:'Você anda e corre mais rápido',price:1000,spd:1},
  amufogo:{n:'Amuleto de Brasa',d:'+10% de dano em golpes de Fogo',price:1000,boost:'Fogo'},
  amuagua:{n:'Amuleto da Maré',d:'+10% de dano em golpes de Água',price:1000,boost:'Água'},
  amuplanta:{n:'Amuleto da Raiz',d:'+10% de dano em golpes de Planta',price:1000,boost:'Planta'},
  amueletr:{n:'Amuleto do Raio',d:'+10% de dano em golpes Elétricos',price:1000,boost:'Elétrico'},
};
// skins: só visual. slot = onde vai no personagem; c = cores (principal, detalhe, enfeite)
const SKINS={
  bone_mst:{n:'Boné MST',slot:'cabeca',kind:'bone',c:['#d83a3a','#a02828'],txt:'MST',price:350},
  bone_vero:{n:'Boné VERO',slot:'cabeca',kind:'bone',c:['#3a6ad8','#28489a'],txt:'VERO',price:350},
  peita_brasil:{n:'Peita do Brasil',slot:'corpo',kind:'camisa',c:['#f6d32a','#1e9a4a','#2a5ad8'],num:'10',price:500},
  chapeu:{n:'Chapéu de palha',slot:'cabeca',kind:'chapeu',c:['#e8c870','#c8a050','#c83a3a'],price:400},
  gorro:{n:'Gorro',slot:'cabeca',kind:'gorro',c:['#38a050','#f4f4f4'],price:300},
  coroa:{n:'Coroa dourada',slot:'cabeca',kind:'coroa',c:['#f2c03a','#c88a18','#e83a5a'],price:2500},
  oculos_sol:{n:'Óculos escuros',slot:'rosto',kind:'sol',c:[],price:350},
  oculos_grau:{n:'Óculos de grau',slot:'rosto',kind:'grau',c:[],price:200},
  mochila:{n:'Mochila',slot:'costas',kind:'mochila',c:['#e0a020','#a87010'],price:450},
  cachecol:{n:'Cachecol',slot:'pescoco',kind:'cachecol',c:['#d84040','#f4f4f4'],price:300},
  touca:{n:'Touca de enfermeira',slot:'cabeca',kind:'touca',c:['#ffffff','#e04848'],price:0,hidden:1},
};
const SLOTN={cabeca:'Cabeça',rosto:'Rosto',pescoco:'Pescoço',costas:'Costas',corpo:'Camisa'};
const CLASSES={
  guerreiro:{n:'Guerreiro',d:'+15% de ataque pros seus zoobumons',atk:.15},
  guardiao:{n:'Guardião',d:'+15% de defesa e +10% de vida',def:.15,hp:.1},
  cacador:{n:'Caçador',d:'+25% de captura e acha mais zoobumons',cap:.25,enc:1.35},
  sabio:{n:'Sábio',d:'Seus zoobumons ganham +35% de XP',xp:.35},
};
const ENC={
  praia:[['abelhote',4,22,24],['cervejinha',24,14,18],['gotinho',12,14,18],['zap',12,14,18],['caramelo',12,14,18],['marmitiol',10,15,19],['zumbel',10,14,18],['chopp',4,22,24]],
  cidade:[['zapfone',4,22,24],['lancheriol',4,22,24],['estagiario',22,12,16],['daily',22,12,16],['cafezinho',20,12,16],['marmitiol',10,13,17],['ratuxo',10,12,16],['cocozinho',8,12,16],['puxasaco',5,20,22],['reuniaoemail',4,22,24],['cafeteira',4,22,24]],
  boteco:[['abelhote',4,22,26],['texugomilho',4,24,27],['zapfone',2,24,27],['pericle',3,24,27],['texugo',5,18,22],['cervejinha',18,16,20],['gudang',16,16,20],['caramelo',14,16,20],['cocozinho',12,16,20],['zubumafilho',12,16,20],['marmitiol',8,17,21],['chopp',8,22,25],['ratazao',8,20,24],['caramelao',4,24,27]],
  serra:[['texugomilho',4,28,32],['abelhote',3,26,32],['lancheriol',3,26,32],['zapfone',3,26,32],['galinferno',1,38,40],['tromba',1,38,40],['cobrumetriplo',1,38,40],['reiesgoto',1,36,38],['caramelomito',1,38,40],['zubumavo',1,40,40],['procfatal',1,40,40],['rastarei',1,40,40],['colmeiona',1,38,40],['antena5g',1,38,40],['geladeirol',1,38,40],['texugomel',1,40,40],['pericle',6,26,32],['texugo',9,26,32],['zubumapai',14,26,32],['rastafolha',12,26,32],['caramelao',12,26,32],['ratazao',12,24,30],['chopp',10,24,30],['puxasaco',10,24,30],['cafeteira',8,24,30],['reuniaoemail',8,24,30],
    ['galardente',3,28,32],['zegotinha',3,28,32],['floresko',3,28,32],['garrafa',2,38,40],['alinhamento',2,38,40],['litraco',2,38,40],['lider',2,36,38]],
  rota:[['daily',7,3,5],['ratuxo',42,2,4],['zumbel',32,2,4],['caramelo',8,3,5],['zap',5,3,5],['cocozinho',10,2,4],['estagiario',8,3,5],['cervejinha',6,3,5]],
  pedreira:[['marmitiol',6,7,9],['cafezinho',14,6,9],['daily',14,6,9],['ratuxo',20,7,9],['caramelo',8,6,9],['zap',5,7,9],['gudang',9,6,9],['estagiario',7,6,9],['cervejinha',6,6,9]],
  bosque:[['texugo',3,11,14],['marmitiol',8,10,13],['cafezinho',7,9,12],['cafeteira',3,14,15],['reuniaoemail',3,14,15],['zumbel',25,9,13],['ratazao',20,10,13],['zubumafilho',12,9,12],['zap',5,10,13],['cocozinho',8,9,12],['gudang',6,10,13],['cervejinha',5,10,12]],
};
const ZNAME={vila:'Vila Aurora',rota:'Trilha 1',pedreira:'Barro Vermelho',bosque:'Beco das 7 Facadas',praia:'Praia Brava',cidade:'Distrito Corporativo',boteco:'Rua do Boteco',serra:'Morro do Côco'};
const HAIR=['#3a2a22','#a05828','#e8c050','#c83030','#3858b8','#e4e4ec'];
const BEARDC=['#3a2a22','#6a4428','#a05828','#d8b048','#c83030','#8a8a92','#e4e4ec'];
const SKIN=['#f8d4ac','#dca474','#a8703e','#6e4626'];
const SHIRT=['#d84040','#3870d0','#38a050','#e0a020','#8848c0','#2c2c34'];
const PANTS=['#3a4a7c','#2a2a32','#705038','#4f6a4a'];

