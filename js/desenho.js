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
// os prédios mudam pouco: desenha uma vez num canvas e só copia a cada quadro
const BCACHE={},BPAD=24;
function drawBuilding(b,ox,oy){
  const key=b.kind+b.w+'x'+b.h;
  if(!BCACHE[key]){const c=document.createElement('canvas');c.width=b.w*TS+BPAD*2;c.height=b.h*TS+BPAD*2;const g=c.getContext('2d');
    (b.kind==='centro'?paintCentro:paintLoja)(g,BPAD,BPAD,b.w*TS,b.h*TS,(b.door[0]-b.x)*TS);BCACHE[key]=c}
  ctx.drawImage(BCACHE[key],b.x*TS-ox-BPAD,b.y*TS-oy-BPAD);
}
function bush(g,bx,by){g.fillStyle='rgba(20,50,20,.3)';g.fillRect(bx+2,by+12,16,3);R(g,'#1d5222',bx,by,16,12);R(g,'#3f9a3c',bx+1,by+1,14,10);R(g,'#6cc452',bx+2,by+1,6,3);R(g,'#f05858',bx+10,by+4,2,2);R(g,'#ffd860',bx+5,by+7,2,2)}
// Centro Zoobumon: hospital branco com cúpula vermelha, emblema grande e letreiro
function paintCentro(g,X,Y,W,H,dxo){
  const o='#33293a',red=ramp('#e04848'),cx=X+W/2,base=Y+46;
  g.fillStyle='rgba(20,50,20,.3)';g.fillRect(X+6,Y+H,W-2,6);g.fillRect(X+W,base+6,6,H-46);
  // paredes brancas com colunas nos cantos
  R(g,o,X,base-2,W,H-44);R(g,'#fbf7f2',X+2,base,W-4,H-48);
  for(let y=base+6;y<Y+H-10;y+=10)R(g,'#efe7de',X+2,y,W-4,1);
  for(const px of[X+2,X+W-12]){R(g,'#ffffff',px,base,10,H-48);R(g,'#e2d8ce',px+8,base,2,H-48);R(g,'#ffffff',px-1,base,12,3)}
  R(g,red[1],X+2,Y+H-10,W-4,6);R(g,red[3],X+2,Y+H-10,W-4,1);R(g,o,X+2,Y+H-4,W-4,2);
  // cúpula: meia elipse vermelha com luz de cima à esquerda e faixa branca
  const rx=W/2+6,ry=44;
  for(let y=Y+2;y<base+2;y++)for(let x=X-8;x<X+W+8;x++){
    const nx=(x+.5-cx)/rx,ny=(y+.5-(base+2))/ry,d=nx*nx+ny*ny;if(d>1)continue;
    const edge=d>.9&&((x+.5-cx)**2/(rx-2.2)**2+(y+.5-(base+2))**2/(ry-2.2)**2>1);
    if(edge){R(g,o,x,y);continue}
    const band=y>=base-12&&y<base-5,lt=-nx*.5-ny*.8+(hash(x,y,5)%100)/600;
    const col=band?(lt>.55?'#ffffff':'#ece4ea'):lt>.85?red[3]:lt>.55?red[2]:lt>.2?red[1]:red[0];
    R(g,col,x,y);
  }
  R(g,o,X-8,base+1,W+16,2);
  // emblema: círculo branco com cruz vermelha, saindo pra cima da cúpula
  const ey=Y+8;
  for(let y=-15;y<=15;y++)for(let x=-15;x<=15;x++){const d=x*x+y*y;if(d>225)continue;R(g,d>196?o:d>150?'#d8dce6':'#ffffff',cx+x-.5,ey+y,1,1)}
  R(g,o,cx-5,ey-10,10,20);R(g,o,cx-10,ey-5,20,10);R(g,red[1],cx-4,ey-9,8,18);R(g,red[1],cx-9,ey-4,18,8);R(g,red[3],cx-4,ey-9,8,2);R(g,red[3],cx-9,ey-4,2,8);
  // janelas em arco dos dois lados
  const dx=X+dxo;
  for(const wx of[X+16,X+40,X+W-56,X+W-32]){if(wx+16>dx-4&&wx<dx+36)continue;const wy=base+10;
    R(g,o,wx,wy+4,16,22);R(g,o,wx+2,wy+2,12,2);R(g,o,wx+4,wy,8,2);
    R(g,'#5e9ad6',wx+2,wy+5,12,19);R(g,'#5e9ad6',wx+4,wy+2,8,4);R(g,'#8cc4f2',wx+2,wy+5,12,5);R(g,'#eaf6ff',wx+4,wy+6,2,6);R(g,'#fdf7ea',wx+7,wy+2,2,22);R(g,'#fdf7ea',wx+2,wy+14,12,2);
    R(g,'#e9e2d6',wx-1,wy+26,18,3);R(g,'#f05858',wx+2,wy+24,3,2);R(g,'#f2c03a',wx+11,wy+24,3,2)}
  // letreiro vermelho com UPA em cima da porta
  const tw=pixTextW('UPA'),bw=tw+14,bx=Math.round(cx-bw/2),by=base+4;
  R(g,o,bx-1,by-1,bw+2,16);R(g,red[1],bx,by,bw,14);R(g,red[2],bx,by,bw,2);R(g,red[0],bx,by+12,bw,2);pixText(g,'UPA',bx+7,by+2,'#ffffff',red[0]);
  // porta de vidro automática com moldura vermelha e luz verde
  const dh=36,dy=Y+H-dh;
  R(g,o,dx+1,dy-2,30,dh+2);R(g,red[1],dx+2,dy-1,28,dh+1);R(g,'#c8ccd8',dx+4,dy+2,24,dh-2);
  for(const gx of[dx+5,dx+17]){R(g,'#7cc0f0',gx,dy+3,10,dh-4);R(g,'#bfe2fa',gx,dy+3,10,5);R(g,'#eaf6ff',gx+1,dy+10,1,10)}
  R(g,o,dx+15,dy+3,2,dh-4);R(g,'#58e070',dx+14,dy-5,4,3);
  R(g,'#e8d8d8',dx-2,Y+H,36,4);R(g,red[1],dx+2,Y+H,28,3);R(g,red[3],dx+2,Y+H,28,1);
  for(const bx2 of[X+4,X+W-20])bush(g,bx2,Y+H-12);
}
// Loja: fachada de tijolo, placa amarela com LOJA, toldo verde, vitrines e caixotes
function paintLoja(g,X,Y,W,H,dxo){
  const o='#33293a',grn=ramp('#3aa05a'),cx=X+W/2,top=Y+18;
  g.fillStyle='rgba(20,50,20,.3)';g.fillRect(X+6,Y+H,W-2,6);g.fillRect(X+W,top+6,6,H-18);
  // parede de tijolinho
  R(g,o,X,top-2,W,H-top+Y+2);
  for(let r=0,y=top;y<Y+H-2;r++,y+=6)for(let x=X+2-(r%2?7:0);x<X+W-2;x+=14){
    const x0=Math.max(X+2,x),x1=Math.min(X+W-2,x+13);if(x1<=x0)continue;const t=hash(x,y,9)%3;
    R(g,['#c8744a','#bd6a42','#d07e52'][t],x0,y,x1-x0,5);R(g,'#dc9064',x0,y,x1-x0,1);R(g,'#9a4e30',x0,y+5,x1-x0+1,1);R(g,'#9a4e30',x1,y,1,5)}
  // beiral de cima (telhado reto com platibanda)
  R(g,o,X-4,top-6,W+8,8);R(g,'#5a4a5e',X-3,top-5,W+6,6);R(g,'#7a6a80',X-3,top-5,W+6,2);
  // placa grande amarela com LOJA e sacolinhas
  const tw=pixTextW('LOJA',3),pw=tw+52,px=Math.round(cx-pw/2),py=Y-16;
  R(g,o,px+10,py+26,3,10);R(g,o,px+pw-13,py+26,3,10);
  R(g,o,px-2,py-2,pw+4,32);R(g,'#8a5a30',px,py,pw,28);R(g,'#f2c03a',px+3,py+3,pw-6,22);R(g,'#ffe27a',px+3,py+3,pw-6,3);R(g,'#d89a1c',px+3,py+22,pw-6,3);
  pixText(g,'LOJA',Math.round(cx-tw/2),py+6,'#2c3e8a','#d89a1c',3);
  for(const bx of[px+8,px+pw-22]){R(g,o,bx-1,py+8,16,14);R(g,'#38a050',bx,py+9,14,12);R(g,'#6cc46a',bx,py+9,14,2);R(g,o,bx+3,py+5,2,5);R(g,o,bx+9,py+5,2,5);R(g,o,bx+4,py+5,6,1);R(g,'#ffffff',bx+5,py+13,4,4)}
  // vitrines largas com coisas à venda
  const dx=X+dxo,wy=top+30;
  for(const[wx,ww]of[[X+8,dx-X-14],[dx+38,X+W-dx-46]]){if(ww<12)continue;
    R(g,o,wx-2,wy-2,ww+4,30);R(g,'#f4ead0',wx,wy,ww,26);R(g,'#4e86c4',wx+2,wy+2,ww-4,22);R(g,'#7cb4ea',wx+2,wy+2,ww-4,5);R(g,'#c8a070',wx+2,wy+14,ww-4,2);
    for(let k=0;k*9+6<ww-4;k++){const h=hash(wx,k,31),ix=wx+5+k*9;
      if(h%3===0){R(g,o,ix,wy+7,6,7);R(g,['#e04848','#f2c03a','#a060d0'][h%3+1>2?0:h%3],ix+1,wy+8,4,5);R(g,'#ffffff',ix+1,wy+8,1,2);R(g,o,ix+2,wy+5,2,2)}
      else if(h%3===1){R(g,o,ix,wy+8,7,6);R(g,'#d84a5a',ix+1,wy+9,5,4);R(g,'#f4f4f4',ix+1,wy+11,5,1)}
      else{R(g,'#8a5a30',ix+3,wy+5,1,9);R(g,o,ix,wy+4,7,1);for(let q=0;q<3;q++)R(g,'#e8e8f0',ix+q*2,wy+5+q,1,4)}
      R(g,['#38a050','#f2c03a','#e04848'][h%3],ix+1,wy+17,5,5);R(g,'#ffffff',ix+1,wy+17,2,1)}
    R(g,'#eaf6ff',wx+4,wy+3,ww/3,1);R(g,'#8a5a30',wx-2,wy+28,ww+4,3)}
  // toldo verde e branco inclinado, com borda recortada
  const ay=top+14;
  for(let r=0;r<12;r++){
    for(let x=X-2;x<X+W+2;x++){const st=Math.floor((x-X+2)/10)%2;R(g,r===0||r===11?o:st?(r<3?'#ffffff':'#ecece4'):(r<3?grn[2]:grn[1]),x,ay+r)}}
  for(let x=X-2;x<X+W+2;x+=10){R(g,o,x,ay+12,10,4);const st=Math.floor((x-X+2)/10)%2;R(g,st?'#ecece4':grn[0],x+1,ay+12,8,3);R(g,o,x+4,ay+15,2,2)}
  // porta de madeira dupla com plaquinha ABERTO (verde)
  const dh=34,dy=Y+H-dh;
  R(g,o,dx+2,dy-1,28,dh+1);R(g,'#7c4c2a',dx+3,dy,26,dh);R(g,'#9a6638',dx+3,dy,26,2);R(g,o,dx+15,dy,2,dh);
  for(const gx of[dx+6,dx+19]){R(g,'#7cc0f0',gx,dy+5,7,12);R(g,'#bfe2fa',gx,dy+5,7,3)}
  R(g,'#ffd86a',dx+12,dy+20,2,3);R(g,'#ffd86a',dx+18,dy+20,2,3);
  R(g,o,dx+8,dy+18,16,8);R(g,'#58c070',dx+9,dy+19,14,6);R(g,'#ffffff',dx+11,dy+21,10,2);
  R(g,'#b8a888',dx,Y+H,32,4);R(g,'#d8c8a4',dx,Y+H,32,1);
  // caixotes de um lado e barril com redes do outro
  const cy=Y+H-14;
  for(const[kx,ky]of[[X+4,cy],[X+18,cy],[X+11,cy-12]]){R(g,o,kx-1,ky-1,14,14);R(g,'#c08850',kx,ky,12,12);R(g,'#8a5a30',kx,ky+5,12,2);R(g,'#8a5a30',kx+5,ky,2,12);R(g,'#dcaa70',kx,ky,12,1)}
  const rx=X+W-22;R(g,o,rx-1,cy-5,18,19);R(g,'#8a5a30',rx,cy-4,16,17);R(g,'#a87040',rx+3,cy-4,10,17);R(g,'#5a5a64',rx,cy,16,2);R(g,'#5a5a64',rx,cy+8,16,2);
  for(let q=0;q<3;q++){R(g,'#8a5a30',rx+3+q*5,cy-14,1,10);R(g,'#e8e8f0',rx+1+q*5,cy-15,5,3)}
}
// chão embaixo da árvore combina com a região
function groundUnder(tx,ty,h){const z=zoneAt(tx,ty);return z==='pedreira'||z==='serra'?T.dirt[h%2]:z==='praia'?T.sand[h%2]:z==='cidade'?T.pave[h%2]:T.grass[3]}
// casinha da Rua do Boteco: telhado na fileira de cima, porta no meio da fileira de baixo
function houseTile(tx,ty,h){
  if(tileAt(tx,ty-1)!=='H')return T.house.roof;
  let l=tx,r=tx;while(tileAt(l-1,ty)==='H')l--;while(tileAt(r+1,ty)==='H')r++;
  const col=hash(l,ty-(tileAt(tx,ty-2)==='H'?2:1),5)%T.house.wall.length;
  if(tileAt(tx,ty+1)!=='H'&&tx===Math.floor((l+r)/2))return T.house.door[col];
  return T.house.wall[col];
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
      case'T':img=groundUnder(tx,ty,h);actors.push({x:tx*TS,y:ty*TS,img:T.tree,tree:true});break;
      case'Y':img=T.sand[h%2];actors.push({x:tx*TS,y:ty*TS,img:T.palm,tree:true});break;
      case's':img=T.sand[h%2];break;case'c':img=T.pave[h%2];break;
      case'O':img=tileAt(tx,ty-1)!=='O'?T.office.top:T.office.mid[h%3];break;
      case'H':img=houseTile(tx,ty,h);break;
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
    if(a.tree){ctx.drawImage(a.img,X,Y-(a.img.height-TS));continue}
    ctx.fillStyle='rgba(20,40,20,.26)';ctx.beginPath();ctx.ellipse(X+16,Y+29,9,3.5,0,0,7);ctx.fill();
    ctx.drawImage(a.img,X,Y-18);
    if(a.me){const sx=P.moving&&P.t>.5?P.tx:P.x,sy=P.moving&&P.t>.5?P.ty:P.y;
      if(tileAt(sx,sy)===','){const v=hash(sx,sy)%4,im=(rustle&&rustle.x===sx&&rustle.y===sy&&ts<rustle.until?T.tallFrontRustle:T.tallFront)[v];ctx.drawImage(im,0,14,TS,18,sx*TS-cx,sy*TS-cy+14,TS,18)}}
  }
  if(VIG)ctx.drawImage(VIG,0,0);
}
const BG={vila:['#eef0f6','#d6dbe9','#b9c2d8','#8f9ab8'],rota:['#eef4d8','#d2e6a8','#a8d070','#7cad4c'],pedreira:['#f4ead6','#e6d0a6','#ccac7c','#9e7e56'],bosque:['#d6e4cc','#aecaa0','#82ad6c','#56834a'],praia:['#e2f2fa','#f2e2b0','#e2c88a','#c8a868'],cidade:['#e6eaf2','#c8ccd6','#a8aebc','#7c8494'],boteco:['#f6ead8','#d8e6a8','#b0d078','#86ac56'],serra:['#e0e6f0','#cfc0a4','#a8936e','#7a6448']};
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
  musicTick();
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

