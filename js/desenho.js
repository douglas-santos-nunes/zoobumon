'use strict';
/* =================== desenho =================== */
const cv=$('#cv'),ctx=cv.getContext('2d'),bcv=$('#bcv'),bctx=bcv.getContext('2d');bctx.imageSmoothingEnabled=false;
let VW=240,VH=160,VIG=null;
// o mapa usa a tela toda: cada pixel do jogo vira "s" pixels da tela (1 no celular, 2 no computador)
function resize(){
  const g=$('#game'),w=g.clientWidth||innerWidth,h=g.clientHeight||innerHeight;
  let s=Math.max(1,Math.round(Math.min(w,h)/380));
  if(w/s>840)s=Math.ceil(w/840);
  VW=Math.ceil(w/s);VH=Math.ceil(h/s);cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
  // sombreado suave nas bordas da tela
  VIG=mk(VW,VH,v=>{const gr=v.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.hypot(VW,VH)*.62);
    gr.addColorStop(0,'rgba(10,20,40,0)');gr.addColorStop(1,'rgba(10,20,40,.28)');v.fillStyle=gr;v.fillRect(0,0,VW,VH)});
  // celular em pé: centraliza a cena da batalha no espaço acima dos textos
  const sw=Math.min(w,(h-170)*1.5),free=h-(w<=560?260:170)-sw/1.5;
  const top=Math.max(0,Math.round(free/2));
  $('#stage').style.top=`max(env(safe-area-inset-top,0px),${top}px)`;
  horizon=top+Math.round(sw/1.5*55/160);lastBg='';
}
let horizon=0;
addEventListener('resize',resize);
function drawBuilding(b,ox,oy){
  const X=b.x*TS-ox,Y=b.y*TS-oy,W=b.w*TS,H=b.h*TS,rh=Math.round(H*.42),o='#33293a',centro=b.kind==='centro';
  const rr=ramp(centro?'#e05048':'#3f6fd0');
  ctx.fillStyle='rgba(20,50,20,.3)';ctx.fillRect(X+6,Y+H,W-2,6);ctx.fillRect(X+W,Y+rh+6,6,H-rh);
  // parede clara com faixa na base
  R(ctx,o,X,Y+rh-4,W,H-rh+4);R(ctx,centro?'#fbf7f2':'#f4ecda',X+2,Y+rh,W-4,H-rh-2);
  for(let y=Y+rh+4;y<Y+H-8;y+=8)R(ctx,centro?'#f0e8e0':'#e6dabe',X+2,y,W-4,1);
  R(ctx,centro?'#e05048':'#3f6fd0',X+2,Y+H-9,W-4,5);R(ctx,centro?'#f07870':'#6a94e8',X+2,Y+H-9,W-4,1);R(ctx,o,X+2,Y+H-4,W-4,2);
  // telhado em telhas
  R(ctx,o,X-6,Y-2,W+12,rh+4);
  for(let r=0,y=Y;y<Y+rh-2;r++,y+=6)for(let x=X-5-(r%2?6:0);x<X+W+5;x+=12){
    const x0=Math.max(X-5,x),x1=Math.min(X+W+5,x+12),w=x1-x0;if(w<=0)continue;
    R(ctx,rr[1],x0,y,w,6);R(ctx,rr[2],x0,y,w,1);R(ctx,rr[3],x0+1,y,Math.min(3,w-1),1);R(ctx,rr[0],x0,y+5,w,1);R(ctx,darker(rr[0],.8),x1-1,y+1,1,4);
  }
  R(ctx,rr[3],X-5,Y-1,W+10,2);R(ctx,rr[0],X-5,Y+rh-3,W+10,3);R(ctx,o,X-6,Y+rh,W+12,2);
  if(!centro){
    // toldo listrado azul e branco com borda ondulada
    const ay=Y+rh+2;R(ctx,o,X-2,ay,W+4,13);
    for(let x=X-1;x<X+W+1;x+=8){R(ctx,'#3f6fd0',x,ay+1,4,10);R(ctx,'#f8f8f8',x+4,ay+1,4,10);R(ctx,'#2c54a8',x,ay+9,4,2)}
    for(let x=X-1;x<X+W+1;x+=4)R(ctx,o,x+1,ay+12,2,2);
  }
  // janelas grandes (vitrine na loja)
  for(let c=0;c<b.w;c++){if(b.x+c===b.door[0])continue;const tx=X+c*TS,wy=Y+rh+(centro?8:18);
    R(ctx,o,tx+4,wy,24,centro?20:16);R(ctx,'#fdf7ea',tx+5,wy+1,22,centro?18:14);R(ctx,'#5e9ad6',tx+7,wy+3,18,centro?14:10);R(ctx,'#8cc4f2',tx+7,wy+3,18,4);
    R(ctx,'#eaf6ff',tx+9,wy+4,4,1);R(ctx,'#eaf6ff',tx+9,wy+5,2,1);
    if(centro)R(ctx,'#fdf7ea',tx+15,wy+3,2,14);
    else for(let k=0;k<3;k++){const h=hash(c,k,77),col=['#e04848','#f2c03a','#38a050','#f4f4f4'][h%4];R(ctx,col,tx+9+k*5,wy+9,4,4);R(ctx,'#ffffff',tx+9+k*5,wy+9,1,1)}}
  // porta: de vidro automática no Centro, de madeira com vidro na Loja
  const dx=X+(b.door[0]-b.x)*TS,dh=centro?34:30;
  R(ctx,o,dx+3,Y+H-dh,26,dh);
  if(centro){R(ctx,'#c8ccd8',dx+4,Y+H-dh+1,24,dh-1);R(ctx,'#7cc0f0',dx+6,Y+H-dh+3,9,dh-4);R(ctx,'#7cc0f0',dx+17,Y+H-dh+3,9,dh-4);R(ctx,'#bfe2fa',dx+6,Y+H-dh+3,9,4);R(ctx,'#bfe2fa',dx+17,Y+H-dh+3,9,4);R(ctx,'#eaf6ff',dx+7,Y+H-dh+8,1,8);R(ctx,'#eaf6ff',dx+18,Y+H-dh+8,1,8);R(ctx,o,dx+15,Y+H-dh+3,2,dh-4)}
  else{R(ctx,'#7c4c2a',dx+5,Y+H-dh+1,22,dh-1);R(ctx,'#7cc0f0',dx+9,Y+H-dh+5,14,10);R(ctx,'#bfe2fa',dx+9,Y+H-dh+5,14,3);R(ctx,'#ffd86a',dx+22,Y+H-12,2,3)}
  R(ctx,'#b8a888',dx+1,Y+H,30,4);R(ctx,'#d8c8a4',dx+1,Y+H,30,1);
  // placa no telhado: cruz no Centro, sacola na Loja
  const sx=X+W/2-16,sy=Y+3;
  R(ctx,o,sx-2,sy-2,36,28);R(ctx,'#fdfcf8',sx,sy,32,24);R(ctx,'#dcdce4',sx,sy+21,32,3);R(ctx,'#ffffff',sx+1,sy+1,30,1);
  if(centro){
    for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++){const d=x*x+y*y;if(d<=81)R(ctx,d>64?o:'#e04848',sx+16+x,sy+12+y,1,1)}
    R(ctx,'#ffffff',sx+13,sy+5,6,14);R(ctx,'#ffffff',sx+9,sy+9,14,6);R(ctx,'#ffd0d0',sx+11,sy+5,2,2);
  }else{R(ctx,'#2c54a8',sx+9,sy+8,14,13);R(ctx,'#2c54a8',sx+12,sy+4,8,2);R(ctx,'#2c54a8',sx+11,sy+4,2,5);R(ctx,'#2c54a8',sx+19,sy+4,2,5);R(ctx,'#5a8ae0',sx+9,sy+8,14,2);R(ctx,'#fdfcf8',sx+14,sy+12,4,4)}
  // arbustos dos lados da porta
  for(const bx of[X+4,X+W-20]){ctx.fillStyle='rgba(20,50,20,.3)';ctx.fillRect(bx+2,Y+H+2,16,3);R(ctx,'#1d5222',bx,Y+H-10,16,12);R(ctx,'#3f9a3c',bx+1,Y+H-9,14,10);R(ctx,'#6cc452',bx+2,Y+H-9,6,3);R(ctx,'#f05858',bx+10,Y+H-6,2,2)}
}
function drawInteriorTile(ch,tx,ty,X,Y,h){
  const I=INT[scene],fl=I.floor;
  if(ch==='#'){
    if(ty===1&&tx>0&&tx<I.w-1){ctx.drawImage(TI.parede[fl],X,Y);if(tx===2||tx===I.w-3)ctx.drawImage(TI.janela,X,Y)}
    else ctx.drawImage(TI.trim,X,Y);
    return;
  }
  ctx.drawImage(TI[fl],X,Y);
  const obj={C:TI.balcao[fl],M:TI.maquina,P:TI.pc,p:TI.planta,b:TI.banco,S:TI.prateleira[h%2],E:TI.tapete}[ch];
  if(obj)ctx.drawImage(obj,X,Y);
}
// quadro na parede: emblema do Centro, promoção na Loja
function drawInteriorDecor(cx,cy){
  const I=INT[scene],X=Math.round(I.w/2*TS-cx)-20,Y=TS-cy+2,o='#33293a';
  R(ctx,o,X,Y,40,24);R(ctx,'#fdfcf8',X+2,Y+2,36,20);
  if(scene==='centro'){for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const d=x*x+y*y;if(d<=64)R(ctx,d>49?o:'#e04848',X+20+x,Y+12+y,1,1)}R(ctx,'#ffffff',X+18,Y+6,4,12);R(ctx,'#ffffff',X+14,Y+10,12,4)}
  else{R(ctx,'#f2c03a',X+4,Y+4,32,16);R(ctx,'#e04848',X+6,Y+6,28,12);R(ctx,'#ffffff',X+9,Y+10,4,4);R(ctx,'#ffffff',X+16,Y+10,4,4);R(ctx,'#ffffff',X+23,Y+10,4,4);R(ctx,'#ffffff',X+30,Y+10,2,4)}
}
function drawWorld(ts){
  const fx=P.moving?P.x+(P.tx-P.x)*P.t:P.x,fy=P.moving?P.y+(P.ty-P.y)*P.t:P.y;
  const ppx=Math.round(fx*TS),ppy=Math.round(fy*TS);
  const SW=SC().w*TS,SH=SC().h*TS,inside=scene!=='mundo';
  // cômodo menor que a tela fica centralizado
  const cx=SW<VW?Math.round((SW-VW)/2):Math.round(clamp(ppx+TS/2-VW/2,0,SW-VW)),cy=SH<VH?Math.round((SH-VH)/2):Math.round(clamp(ppy+TS/2-VH/2,0,SH-VH));
  camX=cx;camY=cy;
  R(ctx,inside?'#17121f':'#1a4420',0,0,VW,VH);
  const t0x=Math.floor(cx/TS),t0y=Math.floor(cy/TS),wf=Math.floor(ts/650)%2,wf3=Math.floor(ts/420)%3;
  const actors=[];
  for(let ty=t0y;ty<=t0y+Math.ceil(VH/TS)+1;ty++)for(let tx=t0x;tx<=t0x+Math.ceil(VW/TS);tx++){
    const ch=tileAt(tx,ty),X=tx*TS-cx,Y=ty*TS-cy,h=hash(tx,ty);
    if(inside){if(tx<0||ty<0||tx>=SC().w||ty>=SC().h)continue;drawInteriorTile(ch,tx,ty,X,Y,h);continue}
    let img;
    switch(ch){
      case',':img=(rustle&&rustle.x===tx&&rustle.y===ty&&ts<rustle.until?T.tallRustle:T.tall)[h%4];break;case'~':img=T.water[(wf3+tx+ty)%3];break;
      case'=':img=T.path[h%2];break;case'f':img=T.flower[wf];break;case'd':img=T.dirt[h%2];break;case'R':img=T.rock;break;
      case'T':img=ty<=15&&tx>=25?T.dirt[h%2]:T.grass[3];actors.push({x:tx*TS,y:ty*TS,img:T.tree,tree:true});break;
      default:img=T.grass[[0,1,2,3,3,3,1][h%7]];
    }
    ctx.drawImage(img,X,Y);
    if(ch==='='){const g=(a,b)=>'.,fT'.includes(tileAt(a,b));
      if(g(tx,ty-1))ctx.drawImage(T.edge.u,X,Y);if(g(tx,ty+1))ctx.drawImage(T.edge.d,X,Y);
      if(g(tx-1,ty))ctx.drawImage(T.edge.l,X,Y);if(g(tx+1,ty))ctx.drawImage(T.edge.r,X,Y)}
    if(ch==='~'){
      const sand='#efe0a8',sd='#cdb882',foam='#e8f6ff';
      if(tileAt(tx,ty-1)!=='~'){R(ctx,sand,X,Y,TS,4);R(ctx,sd,X,Y+4,TS,1);R(ctx,foam,X,Y+5,TS,1)}
      if(tileAt(tx-1,ty)!=='~'){R(ctx,sand,X,Y,4,TS);R(ctx,sd,X+4,Y,1,TS);R(ctx,foam,X+5,Y,1,TS)}
      if(tileAt(tx+1,ty)!=='~'){R(ctx,sand,X+TS-4,Y,4,TS);R(ctx,sd,X+TS-5,Y,1,TS);R(ctx,foam,X+TS-6,Y,1,TS)}
      if(tileAt(tx,ty+1)!=='~'){R(ctx,sand,X,Y+TS-4,TS,4);R(ctx,'#f8ecc0',X,Y+TS-4,TS,1);R(ctx,foam,X,Y+TS-5,TS,1)}
    }
  }
  if(!inside)for(const b of BUILDINGS)drawBuilding(b,cx,cy);
  else drawInteriorDecor(cx,cy);
  if(goal&&Math.floor(ts/250)%2){const gx=goal.x*TS-cx,gy=goal.y*TS-cy;
    for(const[ox,oy]of[[1,1],[25,1],[1,25],[25,25]]){R(ctx,'#ffffff',gx+ox,gy+oy,6,2);R(ctx,'#ffffff',gx+ox+(ox>2?4:0),gy+oy,2,6)}}
  const frame=P.moving?(P.t<.5?(P.step?1:2):0):0;
  for(const n of sceneNPCs())actors.push({x:n.x*TS,y:n.y*TS,img:n.spr[n.dir][0]});
  actors.push(...othersActors());
  actors.push({x:ppx,y:ppy,img:charSpr[P.dir][frame],me:true});
  actors.sort((a,b)=>a.y-b.y||(a.tree?-1:1));
  for(const a of actors){
    const X=a.x-cx,Y=a.y-cy;
    if(a.tree){ctx.drawImage(a.img,X,Y-8);continue}
    ctx.fillStyle='rgba(20,40,20,.26)';ctx.beginPath();ctx.ellipse(X+16,Y+29,9,3.5,0,0,7);ctx.fill();
    ctx.drawImage(a.img,X,Y-18);
    if(a.me){const sx=P.moving&&P.t>.5?P.tx:P.x,sy=P.moving&&P.t>.5?P.ty:P.y;
      if(tileAt(sx,sy)===','){const v=hash(sx,sy)%4,im=(rustle&&rustle.x===sx&&rustle.y===sy&&ts<rustle.until?T.tallFrontRustle:T.tallFront)[v];ctx.drawImage(im,0,14,TS,18,sx*TS-cx,sy*TS-cy+14,TS,18)}}
  }
  if(VIG)ctx.drawImage(VIG,0,0);
}
const BG={vila:['#eef0f6','#d6dbe9','#b9c2d8','#8f9ab8'],rota:['#eef4d8','#d2e6a8','#a8d070','#7cad4c'],pedreira:['#f4ead6','#e6d0a6','#ccac7c','#9e7e56'],bosque:['#d6e4cc','#aecaa0','#82ad6c','#56834a']};
// fundo da batalha em 480x320: céu em faixas, morros e árvores ao longe, chão com textura (guardado pronto por área)
const BGC={};
function battleBg(key){
  if(BGC[key])return BGC[key];
  const c=BG[key]||BG.rota,sky=ramp(c[0]),gr=ramp(c[1]);
  return BGC[key]=mk(480,320,g=>{
    const bands=[sky[3],sky[2],c[0],sky[1]];
    for(let y=0;y<112;y++){const b=Math.min(3,Math.floor(y/28)),nb=Math.min(3,b+1),edge=y%28>=24;
      for(let x=0;x<480;x+=2)R(g,edge&&((x/2+y)%2)?bands[nb]:bands[b],x,y,2,1)}
    for(let i=0;i<6;i++){const h=hash(i,7,key.length),x=h%440,y=10+(h>>>8)%40;R(g,'#ffffff',x,y,30+(h%20),4);R(g,'#ffffff',x+6,y-3,18,3);R(g,sky[2],x,y+4,34,1)}
    for(let x=0;x<480;x++){const hh=Math.round(14+Math.sin(x*.018)*9+Math.sin(x*.047+1.3)*5);R(g,ramp(c[2])[2],x,112-hh,1,hh)}
    for(let x=0;x<480;x+=9){const hh=6+hash(x,3,9)%6;R(g,c[3],x,104-hh,9,hh+8);R(g,ramp(c[3])[2],x+2,104-hh,4,2)}
    R(g,c[1],0,110,480,210);
    // linhas do chão mais espaçadas perto da câmera (perspectiva), bem suaves
    g.globalAlpha=.45;for(let k=1;k<12;k++){const y=Math.round(112+k*k*1.75);if(y<320)R(g,gr[2],0,y,480,1)}g.globalAlpha=1;
    for(let i=0;i<260;i++){const h=hash(i,11,key.length),x=h%478,y=114+(h>>>9)%204;R(g,i%3?c[2]:gr[2],x,y,2,1);if(i%4===0)R(g,c[2],x+1,y-1,1,1)}
  });
}
// elipse desenhada pixel a pixel (sem borrão), em camadas: borda, terreno, luz e tufos
function pxEll(cx,cy,rx,ry,col){cx=Math.round(cx);for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y/ry)**2)));if(w>0)R(bctx,col,cx-w,cy+y,w*2,1)}}
function plat(c,x,y,rx,ry){
  pxEll(x,y+4,rx,ry,darker(c[3],.75));pxEll(x,y+2,rx-2,ry-2,c[3]);pxEll(x,y,rx-5,ry-4,c[2]);pxEll(x-rx*.15,y-ry*.3,rx*.55,Math.max(3,Math.round(ry*.4)),ramp(c[2])[2]);
  for(let i=0;i<26;i++){const h=hash(i,rx,5),tx=Math.round(x+((h%100)/100-.5)*rx*1.5),ty=Math.round(y+(((h>>>8)%100)/100-.5)*ry*1.2);
    R(bctx,c[3],tx,ty,1,2);R(bctx,c[3],tx+2,ty-1,1,3);R(bctx,c[3],tx+4,ty,1,2);R(bctx,ramp(c[2])[3],tx+2,ty-2,1,1)}
}
// rede de corda: enrolada voando, ou aberta como uma cúpula de malha por cima do zoobumon
function drawNet(N){
  const ctx=bctx,rope=N.gold?['#fff2a0','#e0b030','#6a4a10']:['#f4e8c4','#c8a868','#5a4428'];
  ctx.globalAlpha=N.a??1;
  if(N.bundle){
    const cx=Math.round(N.x),cy=Math.round(N.y),ph=Math.floor(N.rot*3);
    for(let k=1;k<8;k++)R(ctx,rope[1],cx-Math.round(k*1.6),cy+Math.round(Math.sin(N.rot+k*.8)*1.5)+k,1,1);
    for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const d=Math.hypot(i,j);
      if(d<=5.2){const mesh=((i+j+ph)%3+3)%3===0||((i-j+ph)%3+3)%3===0;R(ctx,mesh?(j<0?rope[0]:rope[1]):(d<3?'#8a6a40':'#6a5030'),cx+i,cy+j)}
      else if(d<=6.2)R(ctx,rope[2],cx+i,cy+j)}
    ctx.globalAlpha=1;return;
  }
  const w=N.w,h=N.h,top=Math.round(N.top),dome=Math.max(4,h*.38),cx=N.x,st=7;
  for(let py=0;py<=h;py++){
    const rf=py/h,sk=(N.wob||0)*(1-rf),hw=py<dome?w/2*Math.sqrt(Math.max(0,1-((dome-py)/dome)**2)):w/2*(1+.08*(py-dome)/(h-dome+1));
    const y=top+py;
    for(let x=Math.floor(cx-hw);x<=Math.ceil(cx+hw);x++){
      const dx=x-(cx+sk);if(Math.abs(dx)>hw)continue;
      const ix=Math.round(dx+60),edge=Math.abs(dx)>hw-1.3||py===0;
      if(edge){R(ctx,rope[2],x,y);continue}
      if((ix+py)%st===0||(ix-py+700)%st===0){R(ctx,py<dome?rope[0]:rope[1],x,y);R(ctx,'rgba(40,30,20,.35)',x,y+1)}
    }
  }
  // pesos na barra da rede
  const by=top+h,hwb=w/2*1.08;
  for(let x=Math.round(cx-hwb)+2;x<cx+hwb-1;x+=9){R(ctx,rope[2],x-1,by-1,4,4);R(ctx,'#686878',x,by,2,2);R(ctx,'#a8a8b8',x,by,1,1)}
  ctx.globalAlpha=1;
}
function drawStars(){
  const t=B.starT||0;
  for(const s of B.stars){const x=Math.round(s.x+s.dx*t*22),y=Math.round(s.y+s.dy*t*22-Math.sin(t*Math.PI)*6);
    bctx.globalAlpha=1-t*t;R(bctx,'#ffe860',x-2,y,5,1);R(bctx,'#ffe860',x,y-2,1,5);R(bctx,'#ffffff',x,y,1,1);bctx.globalAlpha=1}
}
function drawBattle(){
  const ctx=bctx,c=BG[B.bg]||BG.rota;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(battleBg(B.bg||'rota'),0,0);
  plat(c,(176+B.eX)*2,140,92,22);plat(c,(72+B.pX)*2,232,112,26);
  // daqui pra baixo, coordenadas da tela clássica 240x160 (os zoobumons têm 128px e entram em caixas de 64)
  ctx.setTransform(2,0,0,2,0,0);
  const e=B.team[B.ei],m=S.party[B.me];
  if(e&&B.eA>0&&!B.eBlink){ctx.globalAlpha=B.eA;ctx.drawImage(SPR(e.s).f,Math.round((144+B.eX+(B.eShake||0))*2)/2,Math.round((10+B.eY)*2)/2,64,64);ctx.globalAlpha=1}
  if(m&&B.pA>0&&!B.pBlink){ctx.globalAlpha=B.pA;ctx.drawImage(SPR(m.s).b,Math.round((40+B.pX)*2)/2,Math.round((52+B.pY)*2)/2,64,64);ctx.globalAlpha=1}
  if(B.net)drawNet(B.net);
  if(B.stars)drawStars();
  ctx.setTransform(1,0,0,1,0,0);
}
function drawEvo(ts){
  const ctx=bctx;
  ctx.setTransform(2,0,0,2,0,0);
  R(ctx,'#14121c',0,0,240,160);
  for(let i=0;i<14;i++){const h=hash(i,Math.floor(ts/200));R(ctx,'#3a3460',h%240,(h>>>8)%110,1,1)}
  const s=SPR(EVO.show[1]==='a'?EVO.a:EVO.b);
  ctx.drawImage(EVO.show[0]==='w'?s.w:s.f,88,22,64,64);
  ctx.setTransform(1,0,0,1,0,0);
}
let last=0,lastBg='';
function frame(ts){
  const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  for(let i=tweens.length-1;i>=0;i--){const w=tweens[i],t=Math.min(1,(ts-w.t0)/w.ms);w.fn(t);if(t>=1){tweens.splice(i,1);w.res()}}
  if(started){
    update(dt);drawTags();updatePad();
    const inStage=mode==='battle'||mode==='evo',st_=$('#stage');
    if(st_.hidden===inStage){st_.hidden=!inStage;$('#cv').style.visibility=inStage?'hidden':'visible'}
    const bc=B?(BG[B.bg]||BG.rota):null;
    const gbg=mode==='battle'&&bc?`linear-gradient(${bc[0]} ${horizon}px,${bc[1]} ${horizon}px)`:mode==='evo'?'#14121c':'#000';
    if(lastBg!==gbg){lastBg=gbg;$('#game').style.background=gbg}
    const mb=$('#menuBtn'),showMb=mode==='world'&&!busy;if(mb.hidden===showMb)mb.hidden=!showMb;
    if(mode==='world')drawWorld(ts);else if(mode==='battle'&&B)drawBattle();else if(mode==='evo'&&EVO)drawEvo(ts);
  }
  requestAnimationFrame(frame);
}

