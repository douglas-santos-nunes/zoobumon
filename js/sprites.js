'use strict';
/* =================== cores =================== */
function hexToHsl(hex){const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=(mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4)*60}return[h,s,l]}
function hsl(h,s,l){h=((h%360)+360)%360;s=clamp(s,0,1);l=clamp(l,0,1);const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));
  return'#'+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}
// rampa de 4 tons no estilo GBA: sombra puxa pro azul/roxo, luz puxa pro amarelo
function ramp(hex){const[h,s,l]=hexToHsl(hex);return[hsl(h-14,s*1.05,l*.64),hex,hsl(h+8,s*.95,Math.min(.94,l*1.14+.05)),hsl(h+16,s*.75,Math.min(.97,l*1.28+.12))]}
// pele: sombra pouco saturada (a rampa comum deixava o rosto laranja nas bordas)
function skinRamp(hex){const[h,s,l]=hexToHsl(hex);return[hsl(h-4,s*.5,l*.8),hex,hsl(h+4,s*.9,Math.min(.94,l*1.07+.03)),hsl(h+8,s*.7,Math.min(.97,l*1.14+.06))]}
const lineOf=hex=>{const[h,s,l]=hexToHsl(hex);return hsl(h-18,s*.85,Math.max(.09,l*.3))};
const darker=(hex,k=.72)=>{const[h,s,l]=hexToHsl(hex);return hsl(h-8,s,l*k)};

/* =================== renderizador de sprites por formas =================== */
// cada zoobumon é um conjunto de formas (elipses, cápsulas, triângulos) sombreadas como volumes,
// com contorno colorido por fora e linha interna onde uma parte passa por cima de outra
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>v/16-.5);
const LV=(()=>{const v=[-.5,-.68,.55],n=Math.hypot(...v);return v.map(x=>x/n)})();
const FLAT={pupil:'#26202e',shine:'#ffffff',mouth:'#4a2630',blush:'#f4a0a0',lips:'#c85866',eyew:'#ffffff',iris:'#5a3a28',lens:'#1e1e26',frame:'#2a2a32'};
function mirrorPart(p,W){const q={...p};if(p.t==='e'){q.x=W-p.x;q.rot=-(p.rot||0)}else if(p.t==='c'){q.ax=W-p.ax;q.bx=W-p.bx}else q.p=p.p.map((v,i)=>i%2?v:W-v);return q}
function hitPart(p,x,y){
  if(p.t==='e'){const r=p.rot||0,c=Math.cos(r),s=Math.sin(r),dx=x-p.x,dy=y-p.y,nu=(dx*c+dy*s)/p.rx,nv=(-dx*s+dy*c)/p.ry,d=nu*nu+nv*nv;
    if(d>1)return null;return[nu*c-nv*s,nu*s+nv*c,Math.sqrt(1-d)]}
  if(p.t==='c'){const bx=p.bx-p.ax,by=p.by-p.ay,L=bx*bx+by*by||1,t=clamp(((x-p.ax)*bx+(y-p.ay)*by)/L,0,1);
    const dx=x-(p.ax+bx*t),dy=y-(p.ay+by*t),d=Math.hypot(dx,dy);if(d>p.r)return null;return[dx/p.r,dy/p.r,Math.sqrt(1-(d/p.r)**2)]}
  const[a,b,c,d,e,f]=p.p,s1=(x-c)*(b-d)-(a-c)*(y-d),s2=(x-e)*(d-f)-(c-e)*(y-f),s3=(x-a)*(f-b)-(e-a)*(y-b);
  if((s1<0||s2<0||s3<0)&&(s1>0||s2>0||s3>0))return null;
  const cx=(a+c+e)/3,cy=(b+d+f)/3,sz=Math.max(Math.abs(a-c),Math.abs(c-e),Math.abs(a-e),Math.abs(b-d),Math.abs(d-f),Math.abs(b-f),4)*.7;
  const nx=(x-cx)/sz,ny=(y-cy)/sz;return[nx,ny,Math.sqrt(Math.max(.25,1-nx*nx-ny*ny))];
}
function bbox(p){
  if(p.t==='e'){const m=Math.max(p.rx,p.ry);return[p.x-m,p.y-m,p.x+m,p.y+m]}
  if(p.t==='c')return[Math.min(p.ax,p.bx)-p.r,Math.min(p.ay,p.by)-p.r,Math.max(p.ax,p.bx)+p.r,Math.max(p.ay,p.by)+p.r];
  const xs=[p.p[0],p.p[2],p.p[4]],ys=[p.p[1],p.p[3],p.p[5]];return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
}
// k = escala: as formas são pensadas numa grade pequena e desenhadas k vezes maiores, com traço de 1px (mais fino e detalhado)
function renderSprite(W,H,parts,colors,back,k=1){
  const list=[];for(const p of parts){if(back&&(p.f||p.nb))continue;list.push(p);if(p.m)list.push(mirrorPart(p,W/k))}
  const N=W*H,pid=new Int16Array(N).fill(-1),col=new Array(N);
  list.forEach((p,pi)=>{
    const flat=FLAT[p.c],rp=flat?null:colors[p.c],[x0,y0,x1,y1]=bbox(p).map(v=>v*k);
    for(let y=Math.max(0,Math.floor(y0));y<=Math.min(H-1,Math.ceil(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<=Math.min(W-1,Math.ceil(x1));x++){
      let n=hitPart(p,(x+.5)/k,(y+.5)/k);if(!n)continue;if(p.fl)n=[n[0]*.35,n[1]*.35,Math.max(n[2],.92)];const i=y*W+x;
      if(flat)col[i]=flat;else{const b=n[0]*LV[0]+n[1]*LV[1]+n[2]*LV[2]+BAYER[(y&3)*4+(x&3)]*.06;col[i]=rp[b>.84?3:b>.45?2:b>0?1:0]}
      pid[i]=pi;
    }
  });
  const lineC=k=>FLAT[list[k].c]?FLAT.pupil:lineOf(colors[list[k].c][1]);
  const out=col.slice();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x,k=pid[i],nb=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
    if(k<0){let best=-1;for(const[a,b]of nb){if(a<0||b<0||a>=W||b>=H)continue;const q=pid[b*W+a];if(q>best)best=q}if(best>=0)out[i]=lineC(best);continue}
    const p=list[k];if(FLAT[p.c]||p.noLine)continue;
    for(const[a,b]of nb){if(a<0||b<0||a>=W||b>=H)continue;const q=pid[b*W+a];
      if(q>=0&&q<k&&!(p.g&&p.g===list[q].g)&&!FLAT[list[q].c]){out[i]=p.soft?colors[list[q].c][0]:lineC(k);break}}
  }
  return mk(W,H,g=>{const im=g.createImageData(W,H);
    for(let i=0;i<N;i++){const c=out[i];if(!c)continue;const n=parseInt(c.slice(1),16);im.data[i*4]=n>>16&255;im.data[i*4+1]=n>>8&255;im.data[i*4+2]=n&255;im.data[i*4+3]=255}
    g.putImageData(im,0,0)});
}

/* =================== formas dos zoobumons (64x64) =================== */
const E=(x,y,rx,ry,c,o)=>({t:'e',x,y,rx,ry,c,...o});
const Cp=(ax,ay,bx,by,r,c,o)=>({t:'c',ax,ay,bx,by,r,c,...o});
const Tr=(a,b,c,d,e,f,col,o)=>({t:'t',p:[a,b,c,d,e,f],c:col,...o});
const M={m:1},F={f:1},NB={nb:1,soft:1};
const eyes=(x,y,s=1,brow)=>{const r=[E(x,y,2.1*s,3*s,'pupil',{m:1,f:1}),E(x-.7*s,y-1.3*s,.95*s,.95*s,'shine',{m:1,f:1})];
  if(brow)r.push(Tr(x-3.5*s,y-4.8*s,x+3.2*s,y-2.8*s,x-3.5*s,y-3*s,'dark',{m:1,f:1}));return r};
const mouth=(y,w=1.5)=>Cp(32-w,y,32+w,y,.6,'mouth',F);
// cauda anelada (lêmure): gomos alternando preto e branco ao longo do caminho
const ringTail=(pts,r)=>pts.slice(1).map((p,i)=>Cp(pts[i][0],pts[i][1],p[0],p[1],r,i%2?'dark':'belly'));
// olhos de lêmure: mancha escura, íris laranja grande, pupila e brilho
const lemurEyes=(x,y,s=1,brow)=>{const r=[E(x,y,3.9*s,4.5*s,'dark',{m:1,f:1,rot:.5}),E(x,y,2.5*s,2.7*s,'accent',{m:1,f:1}),E(x+.2,y+.2,1.1*s,1.7*s,'pupil',{m:1,f:1}),E(x-.8*s,y-1*s,.8*s,.8*s,'shine',{m:1,f:1})];
  if(brow)r.push(Tr(x-4*s,y-5.4*s,x+3.4*s,y-3.6*s,x-4*s,y-3.6*s,'dark',{m:1,f:1}));return r};
const SHAPES={
  // pinto de fogo: bolinha amarela com topete de chama, asinhas em brasa, bico e pés laranja
  pintobrasa:[E(47,44,3.6,5.6,'flame',{rot:-.7}),E(47.5,45,1.8,3,'ember',{rot:-.7}),
    Cp(27,55,27,59,1.2,'bico',M),Cp(24.4,60,29.6,60,1.1,'bico',M),
    E(32,46,13,11,'base',{g:1}),E(32,30.5,11.8,10.5,'base',{g:1}),E(32,49.5,8,6.8,'belly',NB),
    E(19.5,45,4,6.5,'base',{m:1,rot:.5}),E(17.6,49.4,2.4,2.4,'flame',M),
    Tr(25.5,22.5,26.5,14,30,21,'flame'),Tr(28.5,21,31.5,8,34.5,21,'accent'),Tr(32,21.5,36.5,12,37.5,22.5,'ember'),
    E(22.4,34,1.9,1.3,'pink',{m:1,f:1,noLine:1}),...eyes(26.6,29.5,1.1),Tr(29.4,32.4,34.6,32.4,32,36.6,'bico',F)],
  // galo de fogo: crista em chamas, peito dourado, asas e rabo flamejantes, esporões
  galardente:[E(44,27,4,12,'dark',{rot:.25}),E(49,31,4.6,13,'flame',{rot:.55}),E(53,38,4.2,11,'ember',{rot:.95}),E(50.5,34,2,8,'accent',{rot:.75}),
    Cp(27,48,26,57.5,1.9,'bico',M),Cp(22.6,59.3,29.6,59.3,1.3,'bico',M),Tr(25.4,52,21.6,53,25.4,54.4,'claw',M),
    E(32,40,13,12,'base'),E(32,42.5,8.5,9,'belly',NB),
    E(19,40.5,4.6,9,'dark',{m:1,rot:.35}),Tr(13.5,45,16.5,52.5,19.5,47,'flame',M),
    E(32,25,8.6,8.6,'base',{g:2}),E(32,19.5,8.6,8,'base',{g:2}),
    E(28.6,10.5,2.8,4,'crista',{rot:-.3}),E(32.4,8.5,3,5,'crista'),E(36,10.8,2.6,3.8,'crista',{rot:.35}),Tr(30.6,6,32.4,0.5,34.4,6,'flame'),Tr(27,8,27.4,4,30,7.5,'flame'),Tr(35,8,37.6,4.5,37.8,8.6,'flame'),
    E(32,27.6,1.9,2.8,'crista',F),...eyes(27.6,18.8,.9,1),Tr(29.4,21,34.6,21,32,25.6,'bico',F)],
  gotinho:[Tr(22,36,32,13,42,36,'base',{g:1}),E(32,44,15,14,'base',{g:1}),E(32,49,9,8,'belly',NB),
    E(17.5,44,3.6,7,'base',{m:1,rot:.55}),E(26,57.5,5,3,'base',M),E(22.5,47.5,1.7,1.7,'accent',{m:1,f:1,noLine:1}),
    ...eyes(26,38,1.15),mouth(45,1.4)],
  // Zé Gotinha: gotona em pé, acenando, de sorrisão, luvinhas brancas e sapatinhos
  zegotinha:[Tr(22.5,31,32,3,41.5,31,'base',{g:1}),E(32,40.5,15,16,'base',{g:1}),
    Cp(46,42,52,50,2.6,'base'),E(52.6,51.4,3.1,3.1,'belly'),Cp(18,40,9.5,30,2.6,'base'),E(8.8,28.6,3.2,3.2,'belly'),
    Cp(26,54,25,59,2.8,'base',M),E(24.4,60.3,4.6,2.4,'dark',M),
    E(22,43,2.2,1.5,'pink',{m:1,f:1,noLine:1}),...eyes(26.5,36,1.3),
    E(32,45.2,5.4,2.8,'mouth',F),E(32,43.7,5.8,2.1,'base',{f:1,noLine:1}),E(32,46.6,2.6,1.1,'pink',{f:1,noLine:1})],
  brotelo:[Cp(32,25,32,13,1.3,'dark'),E(26,12,4.5,8,'leaf',{m:1,rot:-.9}),
    E(32,47,11.5,10,'base'),E(32,50,7,6,'belly',NB),E(25,57.5,4.6,3,'base',M),E(22,46,2.6,4.5,'base',{m:1,rot:.45}),
    E(32,32,12.5,10.5,'base'),E(22.5,35.5,2.2,1.4,'pink',{m:1,f:1,noLine:1}),...eyes(27,31),mouth(37,1.1)],
  floresko:[E(51,47,5,10,'leaf',{rot:.9}),E(18,17,5,10,'leaf',{m:1,rot:-.8}),E(25.5,10,4.5,9.5,'leaf',{m:1,rot:-.3}),
    E(32,45,14.5,13,'base'),E(32,48,9,9,'belly',NB),E(16,44,4,9,'leaf',{m:1,rot:.6}),E(23.5,58.5,6,3.2,'base',M),
    E(32,25,13,10.5,'base'),E(28.5,15,2.7,2.7,'accent',M),E(32,11.5,2.7,2.7,'accent'),E(32,18,2.4,2.4,'accent'),E(32,14.8,2.2,2.2,'ember'),
    ...eyes(26.5,25,1,1),mouth(31,1.4)],
  ratuxo:[Cp(41,54,50,52,1.6,'pink'),Cp(50,52,54,44,1.6,'pink'),
    E(20.5,19.5,6.5,7.5,'base',M),E(20.5,20.5,3.8,4.8,'pink',{m:1,soft:1}),
    E(32,47,11,10,'base'),E(32,50,6.5,6.5,'belly',NB),E(25.5,57.5,4.5,2.8,'base',M),E(23,46,2.5,4,'base',{m:1,rot:.45}),
    E(32,32,11.5,9.5,'base'),E(32,37,5,3.4,'belly',NB),E(32,34.6,1.9,1.4,'pink',F),Tr(30.6,39,33.4,39,32,42,'claw',F),...eyes(27,30.5)],
  ratazao:[Cp(42,52,52,50,2,'pink'),Cp(52,50,57,40,2,'pink'),
    E(18.5,15,7.5,8.5,'base',M),E(18.5,16,4.5,5.5,'pink',{m:1,soft:1}),
    E(32,44,14,13,'base'),E(32,47.5,8.5,8.5,'belly',NB),E(23.5,58.5,5.5,3.2,'base',M),Cp(20,40,17,49,3,'base',M),Tr(15,49,17,53,19,49,'claw',M),
    E(32,27,13,10.5,'base'),E(32,32.5,5.8,3.8,'belly',NB),E(32,29.8,2.1,1.5,'pink',F),Tr(29.4,34.5,32,34.5,30.7,39,'claw',{m:1,f:1}),...eyes(26.5,25.5,1,1)],
  zumbel:[E(18,34,7,11,'wing',{m:1,rot:-.5}),Cp(28,24,23,11,.9,'dark',M),E(22.5,10,2.2,2.2,'accent',M),
    E(32,49,10,9.5,'base'),Cp(23.5,47,40.5,47,1.3,'accent',{nb:1}),Cp(24.5,52.5,39.5,52.5,1.3,'accent',{nb:1}),E(26.5,58,3.6,2.4,'dark',M),
    E(32,33,10.5,9,'base'),...eyes(27,32,1.2),mouth(38,1)],
  lodim:[E(32,50,20,11,'base',{g:1}),E(32,41,14,11,'base',{g:1}),E(15.5,57,3.5,4.5,'base',{g:1,m:1}),
    E(25,36,3.5,2,'shine',{rot:-.5}),...eyes(26.5,43,1.1),mouth(49,1.6)],
  faiscol:[Cp(40,52,47,47,2.2,'base',{g:3}),Cp(47,47,44,41,2.2,'base',{g:3}),Cp(44,41,53,32,2.6,'base',{g:3}),E(53.5,31.5,3,3,'dark'),
    Tr(22,27,15,5,29,22,'base',M),Tr(15,5,17.6,12,20.4,10.5,'dark',M),
    E(32,48,10,9,'base'),E(32,50.5,6,5.5,'belly',NB),E(26,57.5,4,2.6,'base',M),E(23.5,47,2.3,3.8,'base',{m:1,rot:.45}),
    E(32,33,12,10,'base'),E(22.8,36.5,2.6,2.1,'accent',{m:1,f:1}),...eyes(27,31.5),mouth(38.5,1.1)],
  voltaro:[Cp(43,50,50,44,3,'base',{g:3}),Cp(50,44,46,37,3,'base',{g:3}),Cp(46,37,57,25,3.4,'base',{g:3}),Tr(53,28,60,17,58,30,'dark'),
    Tr(22.5,21,12,1,28.5,15,'base',M),Tr(12,1,15.5,9,18.5,7.5,'dark',M),Tr(21,35,12,31,23,42,'accent',M),
    E(32,44,13,13.5,'base'),E(32,47,8,8.5,'belly',NB),E(25,58.5,5,3,'base',M),Cp(21.5,40,18,50,3,'base',M),
    E(32,25,11.5,9.5,'base'),E(23.5,28.5,2.2,1.8,'accent',{m:1,f:1}),...eyes(27,23.5,1,1),mouth(30.5,1.2)],
  pedrugo:[E(13,42,7,7,'base',M),E(11,50.5,4.2,3.6,'dark',M),
    E(32,43,17,15,'base'),E(23,32,3.5,2.6,'accent'),E(41.5,48,3,2.4,'accent'),E(27,52,2.6,2,'accent'),E(41,31,2.4,2,'accent'),
    E(24,58.5,6,3.2,'dark',M),...eyes(26.5,37,.85,1),mouth(44,3.5)],
  // vira-lata caramelo: orelhas caídas, língua pra fora, rabo enrolado e coleira com plaquinha
  caramelo:[Cp(41,51,49,45,2.6,'base'),Cp(49,45,51.5,36.5,2.4,'base'),E(51.5,34.5,2.6,2.6,'belly'),
    E(32,47,12.5,10,'base'),E(32,50.5,7,6.5,'belly',NB),E(25,57.5,4.8,3,'base',M),E(25.5,58.3,3.2,1.7,'belly',M),E(23,47.5,2.8,5,'base',{m:1,rot:.2}),
    Cp(23.5,39.5,40.5,39.5,1.6,'accent',{nb:1}),E(32,42,1.9,1.9,'ember',{nb:1}),
    E(32,29,12.5,10.5,'base'),E(32,34.6,6.6,4.5,'belly',NB),E(20.5,26.5,4,7.5,'dark',{m:1,rot:.45}),
    E(32,32,2.3,1.7,'pupil',F),Cp(32,33.6,32,35.2,.5,'mouth',F),Cp(29.4,36,34.6,36,.5,'mouth',F),E(33.2,38.3,1.8,2.3,'pink',F),...eyes(26.8,27.5)],
  // evolução do Caramelo: grandão, bravo, de presas à mostra e coleira de tachinhas
  caramelao:[Cp(44,48,53,40,3.4,'base'),Cp(53,40,55,29.5,3,'base'),E(55,27.5,3.2,3.2,'belly'),
    Tr(19,22,16,5,27.5,13,'dark',M),Tr(20.3,19.5,18,9.5,24.8,14,'pink',{m:1,soft:1}),
    E(32,44,15,13.5,'base'),E(32,46.5,9,9.5,'belly',NB),
    Cp(20.5,35,43.5,35,2.1,'accent',{nb:1}),Tr(22.6,36.4,25.4,36.4,24,39.4,'claw',{m:1,nb:1}),Tr(26.6,36.8,29.4,36.8,28,39.8,'claw',{m:1,nb:1}),Tr(30.6,37,33.4,37,32,40,'claw',{nb:1}),
    Cp(19,39,16.5,51,4.2,'base',M),E(16.5,52.5,4.3,2.7,'belly',M),E(23,58.5,6,3.4,'base',M),E(23.5,59.4,4.2,2,'belly',M),
    E(32,23,13.5,11,'base'),E(32,28.6,7.6,5,'belly',NB),Tr(28.5,13.5,31,7,33.5,13,'dark'),Tr(31.5,13,34.5,8.5,36,13.5,'dark'),
    E(32,25.6,2.6,1.9,'pupil',F),E(32,32,4.6,2,'mouth',F),Tr(28.2,30.4,30.4,30.4,29.3,33.6,'shine',{m:1,f:1}),Cp(31,30.6,33,30.6,.45,'shine',F),...eyes(26.5,20.6,1,1),
    // óculos escuros de Caramelo BR
    Cp(18.8,18.6,22,19.6,.7,'oculos',{m:1,f:1}),E(26,20.8,4.9,3.3,'oculos',{m:1,f:1,rot:-.06}),Cp(29.8,19.8,34.2,19.8,.8,'oculos',F),Cp(21.4,18.2,30.2,18.2,.55,'oculos',{m:1,f:1}),E(24.2,19.6,1.5,.7,'shine',{m:1,f:1,rot:-.35}),E(27.8,22,.8,.45,'shine',{m:1,f:1})],
  // lêmure pequeno: cauda anelada, máscara branca, olhos laranja
  zubumafilho:[...ringTail([[41,52],[47,48.5],[52,43.5],[55,37.5],[56.5,31],[56,24.5],[54.5,18.5]],2.6),
    E(32,47,11,10,'base'),E(32,50,6.5,6.5,'belly',NB),E(25.5,57.5,4.5,2.8,'dark',M),E(22.5,47,2.6,4.6,'base',{m:1,rot:.3}),E(22.8,51.3,2.3,1.6,'dark',M),
    E(20.5,20.5,4,5,'base',{m:1,rot:-.45}),E(20.8,21,2.2,3,'belly',{m:1,soft:1}),
    E(32,30,12,10,'base'),E(32,33,8.6,7,'belly',NB),E(32,36.6,3.4,2.8,'dark',F),E(32,35.3,1.6,1.1,'pupil',F),
    ...lemurEyes(27,30),Cp(31,39.3,33,39.3,.45,'mouth',F)],
  // lêmure pai: grandão, com tufos brancos nas bochechas e cara séria
  zubumapai:[...ringTail([[44,49],[50,45],[55,39],[58,32],[59,25],[58,18],[56,12],[53,7]],3.2),
    E(32,44,14,13,'base'),E(32,47,8.5,9,'belly',NB),E(23.5,58.5,5.8,3.2,'dark',M),Cp(19.5,38,16.5,49,3.6,'base',M),E(16.5,50.5,3.4,2.4,'dark',M),
    E(19,15,4.6,6,'base',{m:1,rot:-.45}),E(19.3,15.6,2.6,3.6,'belly',{m:1,soft:1}),
    Tr(20.5,26,13,31,21.5,33,'belly',M),
    E(32,25,13,10.5,'base'),E(32,28.3,9.4,7.5,'belly',NB),E(32,32.2,3.8,3,'dark',F),E(32,30.8,1.8,1.2,'pupil',F),
    ...lemurEyes(26.6,24.6,1.05,1),Cp(30.6,35.2,33.4,35.2,.5,'mouth',F)],
  // Zap: balão de conversa verde com borda branca, telefone branco de sorriso e dois tracinhos azuis de visto
  zap:[Tr(17,40,9,57,27,47,'belly',{g:1}),E(32,30,21,19,'belly',{g:1}),Tr(18.5,41.5,12.5,53,25.5,46,'base',{g:2}),E(32,30,18,16,'base',{g:2}),
    Cp(27,48,27,52.5,1.8,'base',M),E(26,53.5,3.8,2.2,'dark',M),Cp(12.5,33,8.5,37.5,1.9,'base',M),
    E(22.5,33.5,2.2,1.4,'pink',{m:1,f:1,noLine:1}),...eyes(26.5,26,1.15),
    E(25.8,37.8,2.9,2.2,'belly',{rot:.7,f:1}),E(38.2,37.8,2.9,2.2,'belly',{rot:-.7,f:1}),Cp(27.4,40.4,36.6,40.4,1.7,'belly',F),
    Cp(40.5,14.5,42,16,.7,'accent',F),Cp(42,16,45,12,.7,'accent',F),Cp(44,15.5,45.5,17,.7,'accent',F),Cp(45.5,17,48.5,13,.7,'accent',F)],
  // cocô das figurinhas: três voltas, pontinha enrolada, olhão, sorrisão e mosquinhas
  cocozinho:[E(32,53,19,7.5,'base'),E(32,44.5,15,6.8,'base'),E(32,36.5,10.5,5.8,'base'),Tr(27.5,33,33.5,22.5,37,33,'base',{g:'ponta'}),E(35.4,23.8,2.6,2.2,'base',{g:'ponta'}),
    E(26.6,44,3,3.6,'belly',{m:1,f:1}),E(27.2,44.6,1.5,2,'pupil',{m:1,f:1}),E(26.6,43.6,.6,.6,'shine',{m:1,f:1}),
    E(32,50.4,6,2.6,'mouth',F),E(32,49,6.4,1.9,'base',{f:1,noLine:1}),E(32,51.6,2.8,1,'pink',{f:1,noLine:1}),
    E(12,26,1.5,1.3,'accent'),E(10.8,24.4,1.3,.8,'wing',{rot:-.4}),E(13.2,24.4,1.3,.8,'wing',{rot:.4}),E(51.5,16,1.4,1.2,'accent'),E(50.3,14.5,1.2,.75,'wing',{rot:-.4}),E(52.7,14.5,1.2,.75,'wing',{rot:.4})],
  // Gudang: cigarro de cravo em pé, ponta em brasa com cinza, fumacinha, filtro laranja e cara de cansado
  gudang:[E(37,9.5,3.4,2.9,'fumaca'),E(41.5,5,4.2,3.3,'fumaca'),E(47.5,7.6,3,2.5,'fumaca'),E(45,2.2,2.2,1.8,'fumaca'),
    Cp(28.5,50,28.2,56.6,1.8,'filtro',M),E(27.8,57.8,3.3,1.9,'dark',M),Cp(24.6,33.5,19.4,38.6,1.6,'base',M),E(18.8,39.4,1.9,1.9,'light',M),
    Cp(32,21,32,47,7.5,'base'),Cp(32,43,32,49.5,7.6,'filtro'),Cp(24.8,42.2,39.2,42.2,.9,'ember'),
    E(25.6,46.4,.7,.7,'dark'),E(30.4,47.6,.7,.7,'dark'),E(35.2,46,.7,.7,'dark'),E(38.6,48,.6,.6,'dark'),
    Cp(32,18.6,32,20.8,7.5,'flame'),E(27,19.6,.8,.6,'crista'),E(31.5,20.4,.9,.6,'crista'),E(36.4,19.8,.8,.6,'crista'),E(32,15.8,7.4,3.4,'cinza'),E(28.6,15.4,.7,.5,'dark'),E(33.4,14.6,.6,.45,'dark'),E(35.6,16.4,.6,.45,'dark'),E(29.8,15,1.2,.7,'fumaca'),E(34.4,16,1,.6,'fumaca'),
    ...eyes(27.4,30.4,1),E(27.4,28.9,2.7,1.7,'base',{m:1,f:1,noLine:1}),Cp(24.8,30,30,30,.35,'dark',{m:1,f:1}),Cp(29.4,36.2,34.6,35,.55,'mouth',F)],
  // Estagiário: camisa grande, crachá, café na mão e suor de nervoso
  estagiario:[E(26,59,4.2,2.2,'sapato',M),Cp(27,49,27,57,2.6,'calca',M),
    Cp(41,40,44.5,47,2.3,'camisa'),E(44.8,48,2,2,'pele'),
    E(32,44,10.5,9.5,'camisa'),Cp(28.4,36.5,31.6,45,.45,'base',M),Cp(29.8,46.8,34.2,46.8,1.7,'copo'),Cp(29.8,45.6,34.2,45.6,.6,'base'),
    Cp(23,40,19.4,46,2.3,'camisa'),E(19.2,47.4,2.1,2.1,'pele'),Cp(17.6,44.6,17.8,49.4,2.3,'copo'),Cp(15.6,46,19.8,46,.9,'cafe'),Cp(15.8,44.1,19.6,44.1,.55,'cafe'),
    E(21,27,1.6,2.2,'pele',M),E(32,26,11,10.5,'pele'),
    E(32,18.6,11.6,5.6,'cabelo'),Tr(21.8,20,30,15.8,23.4,25.2,'cabelo'),Tr(28,17,37,16,33.8,22.4,'cabelo'),
    ...eyes(27.6,27.4,1.05),E(23.8,31,1.6,1,'pink',{m:1,f:1,noLine:1}),
    Cp(29.6,33.6,31,32.8,.5,'mouth',F),Cp(31,32.8,32.6,33.6,.5,'mouth',F),Cp(32.6,33.6,34.2,32.8,.5,'mouth',F),
    E(43.6,21,1.3,2,'suor',{noLine:1}),E(43.2,20,.4,.6,'shine')],
  // Puxa-Saco Incompetente: terno, gravata, cabelo lambido, sorrisão e mãos esfregando
  puxasaco:[E(25.6,59.6,4.6,2.2,'sapato',M),Cp(27,49,27,58,2.8,'terno',M),
    E(32,43,11.6,10.2,'terno'),Tr(28.2,34.2,35.8,34.2,32,45.4,'camisa'),Tr(30.9,35.4,33.1,35.4,32,46.6,'gravata'),E(32,35.6,1.4,1.05,'gravata'),
    Cp(21.6,37.6,26.4,46,2.6,'terno',M),E(29.6,46.6,2.3,2.1,'pele',M),
    E(21.6,25.6,1.6,2.2,'pele',M),E(32,25,10.6,10,'pele'),
    E(32,17.4,11.2,5,'cabelo'),Cp(25.6,15.4,30.6,16.8,.35,'dark'),E(28.4,15.6,2.6,.8,'shine'),
    Cp(25.4,26,27.4,24.8,.45,'pupil',{m:1,f:1}),Cp(27.4,24.8,29.4,26,.45,'pupil',{m:1,f:1}),E(24.4,29.4,1.7,1.05,'pink',{m:1,f:1,noLine:1}),
    E(32,31.6,4.8,2.4,'mouth',F),Cp(28.6,30.6,35.4,30.6,.75,'shine',F),E(32,29.8,5.4,1.4,'pele',{f:1,noLine:1})],
  // Líder Despreparado: terno escuro, gravata torta, coçando a cabeça e com um gráfico caindo
  lider:[E(24.6,60,5.2,2.4,'sapato',M),Cp(26.6,49,26.6,58,3.2,'terno',M),
    E(32,42,14,12,'terno'),Tr(27,31,37,31,32,47.6,'camisa'),Tr(31,32.4,34,32,35.6,47,'gravata'),E(32.6,32.6,1.6,1.2,'gravata'),
    Cp(20.4,36,15.6,43.4,3,'terno'),Cp(5.6,40,13.6,40,4.4,'papel'),Cp(6.6,37,9.4,40.6,.45,'vermelho'),Cp(9.4,40.6,12.6,43,.45,'vermelho'),E(15.4,44,2.3,2.3,'pele'),
    Cp(43.6,36,46.4,26.6,3,'terno'),
    E(21.2,22,1.7,2.3,'pele',M),E(32,22,11.6,10.6,'pele'),E(46.6,24.8,2.5,2.5,'pele'),
    E(32,13.6,10.4,3,'cabelo'),E(21.6,19.6,1.8,4,'cabelo',M),Cp(24,14,40,12.4,.6,'cabelo'),E(29.6,12.8,2.2,1,'shine'),
    E(27,22.4,2.2,3,'pupil',F),E(26.3,21.2,.8,.8,'shine',F),E(37.4,22.6,1.6,2.1,'pupil',F),E(36.9,21.8,.55,.55,'shine',F),
    Cp(24.4,17.4,29.2,16.6,.5,'cabelo',F),Cp(35.4,18.6,40,19.4,.5,'cabelo',F),Cp(29.4,29.6,34.6,28.4,.55,'mouth',F),
    E(49,9.6,4.6,4.6,'papel'),Cp(47.4,8.2,48.6,7,.5,'pupil',F),Cp(48.6,7,50.4,7.6,.5,'pupil',F),Cp(50.4,7.6,49.6,9.6,.5,'pupil',F),Cp(49.6,9.6,49.2,10.6,.5,'pupil',F),E(49.2,12.2,.55,.55,'pupil',F)],
  // Cervejinha: copo americano com faces, cerveja dourada, espuma e bolhinhas
  cervejinha:[Cp(28,52.6,28,57.6,1.8,'vidro',M),E(27.4,58.6,3,1.6,'vidro',M),Cp(20.6,33,15.4,38.6,1.7,'vidro',M),E(15,39.2,1.9,1.9,'vidro',M),
    Tr(19.4,16,44.6,16,41.4,53.6,'vidro',{g:'cp'}),Tr(19.4,16,22.6,53.6,41.4,53.6,'vidro',{g:'cp'}),
    Tr(21.6,25,42.4,25,40,51.6,'cerveja',{g:'bv'}),Tr(21.6,25,24,51.6,40,51.6,'cerveja',{g:'bv'}),
    Cp(26.4,26,27,51,.4,'faceta',{noLine:1}),Cp(32,26,32,51,.4,'faceta',{noLine:1}),Cp(37.6,26,37,51,.4,'faceta',{noLine:1}),
    E(25,46,.7,.7,'espuma',{noLine:1}),E(35.4,48.6,.6,.6,'espuma',{noLine:1}),E(38.4,43,.5,.5,'espuma',{noLine:1}),
    E(32,25.4,11,3,'espuma',{g:'es'}),E(25.8,22,6,4.6,'espuma',{g:'es'}),E(33,20.4,7,5,'espuma',{g:'es'}),E(39.6,22.4,5.6,4.2,'espuma',{g:'es'}),
    ...eyes(27.8,35.4,1.05),E(23.8,39.2,1.5,1,'pink',{m:1,f:1,noLine:1}),E(32,41.4,3.4,1.8,'mouth',F),E(32,40.4,3.8,1.2,'cerveja',{f:1,noLine:1}),
    Cp(23,19,24.6,49,.6,'shine')],
  // Chopp Artesanal: caneca com alça, espuma escorrendo e bigode de hipster
  chopp:[Cp(27.6,54,27.6,58.6,2,'vidro',M),E(27,59.4,3.4,1.8,'vidro',M),
    Cp(43,24,50.6,26.4,2.1,'vidro'),Cp(50.6,26.4,50.6,41.6,2.1,'vidro'),Cp(50.6,41.6,43,44.2,2.1,'vidro'),Cp(19,32,13.6,38.6,2,'vidro'),E(13.2,39.4,2.1,2.1,'vidro'),
    Tr(18.6,16.6,43.4,16.6,43.4,54.4,'vidro',{g:'cp'}),Tr(18.6,16.6,18.6,54.4,43.4,54.4,'vidro',{g:'cp'}),Cp(19.6,54,42.4,54,1.8,'vidro',{g:'cp'}),
    Tr(21,25,41,25,41,51.6,'cerveja',{g:'bv'}),Tr(21,25,21,51.6,41,51.6,'cerveja',{g:'bv'}),
    E(26,47,.7,.7,'espuma',{noLine:1}),E(36.6,45,.6,.6,'espuma',{noLine:1}),E(30.4,49.4,.5,.5,'espuma',{noLine:1}),
    E(32,23.4,12,3.6,'espuma',{g:'es'}),E(23.8,20,6.2,5,'espuma',{g:'es'}),E(31.4,17.4,7.6,6,'espuma',{g:'es'}),E(39.2,19.6,6.4,5,'espuma',{g:'es'}),E(20.6,27,1.7,3.4,'espuma',{g:'es'}),
    ...eyes(27.2,33.6,1.1,1),Cp(28,40.2,31.4,39.4,.8,'bigode',{m:1,f:1}),Cp(28,40.2,26.8,38.6,.6,'bigode',{m:1,f:1}),Cp(30.4,42.6,33.6,42.6,.5,'mouth',F),
    Cp(22.4,19,23.4,50,.6,'shine')],
  // Litraço: garrafa de litrão com tampinha, rótulo, bochecha de bêbado e soluço
  litraco:[Cp(27,55.4,27,59.4,2.6,'garrafa',M),E(26.2,60.4,3.8,1.8,'garrafa',M),Cp(21.4,38,15.4,45,2.6,'garrafa',M),E(15,45.6,2.4,2.4,'garrafa',M),
    Cp(32,31.6,32,54,11.2,'garrafa',{g:'gf'}),E(32,29,10.8,6.4,'garrafa',{g:'gf'}),Cp(32,11.6,32,26,4.2,'garrafa',{g:'gf'}),
    Cp(24.6,27,24.6,53,.8,'shine'),Cp(28.4,9.8,35.6,9.8,1.7,'tampa'),Cp(28.4,8.4,35.6,8.4,.5,'tampa'),
    Cp(32,19.6,32,22.4,3.4,'rotulo'),Cp(22,39,42,39,6.4,'rotulo'),Cp(22,47.6,42,47.6,1.3,'vermelho'),Cp(22,31.6,42,31.6,.9,'tampa'),
    ...eyes(27.2,38,1.05),Cp(24.6,36.2,29.6,36.6,.45,'garrafa',{m:1,f:1}),E(23.6,42,2.2,1.4,'vermelho',{m:1,f:1,noLine:1}),
    E(32,43.4,2.6,1.6,'mouth',F),E(32,42.6,3,1,'rotulo',{f:1,noLine:1}),
    E(46,11.6,1.6,1.6,'espuma'),E(49.4,7.4,1.1,1.1,'espuma'),E(51.4,3.8,.7,.7,'espuma')],
  // Rastafolha: folha em leque, carinha relaxada, gorro reggae listrado e dreads
  rastafolha:[E(19.7,33.8,3.0,7.5,'folha',{rot:-1.40,g:'lf'}),Cp(26.1,35.0,13.3,32.7,.35,'dark',{noLine:1}),E(19.7,27.4,3.0,10.0,'folha',{rot:-0.96,g:'lf'}),Cp(27.1,32.6,12.3,22.2,.35,'dark',{noLine:1}),E(23.5,21.3,3.6,12.0,'folha',{rot:-0.52,g:'lf'}),Cp(29.0,30.8,18.0,11.8,.35,'dark',{noLine:1}),E(32.0,17.5,3.6,13.5,'folha',{rot:0.00,g:'lf'}),Cp(32.0,30.0,32.0,5.0,.35,'dark',{noLine:1}),E(40.5,21.3,3.6,12.0,'folha',{rot:0.52,g:'lf'}),Cp(35.0,30.8,46.0,11.8,.35,'dark',{noLine:1}),E(44.3,27.4,3.0,10.0,'folha',{rot:0.96,g:'lf'}),Cp(36.9,32.6,51.7,22.2,.35,'dark',{noLine:1}),E(44.3,33.8,3.0,7.5,'folha',{rot:1.40,g:'lf'}),Cp(37.9,35.0,50.7,32.7,.35,'dark',{noLine:1}),
    Cp(32,44,32,53.6,2.6,'caule'),Cp(28.4,53.4,27.4,58.6,1.9,'caule',M),E(26.8,59.4,3.2,1.7,'caule',M),
    Cp(28.6,46,21.4,50,1.8,'caule',M),E(20.8,50.4,2,2,'folha',M),
    Cp(22.6,34,21.6,46,1.4,'dread',M),Cp(24.6,36,24.2,47.6,1.4,'dread',M),Cp(20.8,32,18.8,42,1.3,'dread',M),
    E(32,37,9.6,8.6,'base'),
    E(32,26.6,11.6,6.4,'gorro_v',{g:'gr'}),E(32,24.4,10.4,5.4,'gorro_a',{g:'gr'}),E(32,22.4,8.6,4.4,'gorro_g',{g:'gr'}),Cp(21.2,30.8,42.8,30.8,1.3,'faixa'),
    Cp(25,36.6,29.4,36.6,.7,'pupil',{m:1,f:1}),Cp(25,35.6,29.4,35.6,.55,'base',{m:1,f:1,noLine:1}),E(24.4,39.6,1.7,1,'pink',{m:1,f:1,noLine:1}),
    E(32,41.6,4,2,'mouth',F),E(32,40.6,4.4,1.3,'base',{f:1,noLine:1}),E(32,42.6,1.8,.8,'pink',{f:1,noLine:1})],
  cinzarel:[Cp(42,52,51,44,3.5,'dark'),E(54,37,5,7.5,'flame'),E(54,39.5,2.5,4,'ember'),
    Tr(20,25,18,6,28,19,'base',M),Tr(21.5,22,20,11.5,25.5,19.5,'flame',{m:1,soft:1}),Tr(20,35,12,31,21,41,'dark',M),
    E(32,47,12,10,'base'),E(32,50,7,6.5,'belly',NB),E(25.5,57.5,4.8,3,'base',M),E(22,46,2.6,4.5,'base',{m:1,rot:.45}),
    E(27,46,1.3,1.3,'ember'),E(38,49,1.2,1.2,'ember'),
    E(32,29,12,10,'base'),E(32,34.5,6,4,'belly',NB),E(32,32.4,1.9,1.4,'pupil',F),...eyes(26.5,27.5,1,1),mouth(37,1.2)],
};
function speciesColors(sp){
  const pal={...PAL[sp.t],...(sp.pal||{})},o={};
  for(const k of['base','belly','accent','dark','light'])o[k]=ramp(pal[k]);
  // cores extras do bicho (roupa, vidro, cerveja...); a pele usa a rampa suave
  for(const k in pal)if(!o[k])o[k]=k==='pele'?skinRamp(pal[k]):ramp(pal[k]);
  Object.assign(o,{flame:ramp('#f89838'),ember:ramp('#ffd860'),pink:ramp('#f2a2b6'),claw:ramp('#f2eee2'),wing:ramp('#d4eef8'),bico:ramp('#f2902a'),oculos:ramp('#26262e'),cinza:ramp('#9a9aa4'),fumaca:ramp('#dcdce6'),filtro:ramp('#e08a34'),crista:ramp('#e02a2a'),leaf:ramp('#3e9a3e')});
  return o;
}
const SPRC={};
function whiteOf(cv){return mk(cv.width,cv.height,g=>{g.drawImage(cv,0,0);g.globalCompositeOperation='source-in';R(g,'#ffffff',0,0,cv.width,cv.height)})}
function SPR(id){if(!SPRC[id]){const c=speciesColors(SPECIES[id]),f=renderSprite(128,128,SHAPES[id],c,false,2);SPRC[id]={f,b:renderSprite(128,128,SHAPES[id],c,true,2),w:whiteOf(f),url:f.toDataURL()}}return SPRC[id]}
const icon=id=>SPR(id).url;
const chip=t=>`<span class="tchip" style="background:${TYPEC[t]}">${t}</span>`;

/* =================== personagens (32x48, desenhados por partes) =================== */
// as partes ficam numa grade de 16x24 e são desenhadas em dobro, com volume e contorno
const TS=32;  // tamanho do bloco do mapa, em pixels
// estilos de cabelo por gênero e barbas (só masculino); a ordem é a ordem na tela de criação
const HAIRSTYLES={m:{curto:'Curto',espetado:'Espetado',raspado:'Careca',topete:'Topete',black:'Black power'},
  f:{longo:'Longo',rabo:'Rabo de cavalo',coque:'Coque',chanel:'Chanel',trancas:'Tranças',black:'Black power'}};
const BEARDS={nenhuma:'Sem barba',bigode:'Bigode',cavanhaque:'Cavanhaque',rala:'Barba rala',cheia:'Barba cheia',longa:'Barba longa'};
const HC='hair',HM={m:1};
// cada estilo: under = atrás da cabeça (cai pelos ombros), front/back/side = por cima, na vista de frente, costas e lado
const HAIR_PARTS={
  curto:{ears:1,front:[E(8,5.3,5,3.3,HC),Tr(4.4,5.4,9,3.6,6.2,8.6,HC),Tr(7,4,11.8,5.2,10.6,7.6,HC)],
    back:[E(8,7.2,5,4.9,HC),E(8,11,3.6,1.6,HC)],side:[E(8.9,5.7,4.7,3.3,HC),E(10.9,8.2,2.6,3.6,HC),Tr(4,6.4,8,3.4,6.8,7.2,HC)]},
  espetado:{ears:1,front:[Tr(3.4,6.6,4.2,0.8,7.4,4.4,HC),Tr(5.8,4.2,8,-0.6,10.2,4.2,HC),Tr(8.6,4.4,11.8,0.8,12.6,6.6,HC),E(8,5.4,4.9,3,HC),Tr(4.6,5.2,7.6,4,5.6,8,HC),Tr(8.4,4,11.4,5.2,10.4,8,HC)],
    back:[Tr(3.4,6.6,4.2,0.8,7.4,4.4,HC),Tr(5.8,4.2,8,-0.6,10.2,4.2,HC),Tr(8.6,4.4,11.8,0.8,12.6,6.6,HC),E(8,7,5,4.8,HC)],
    side:[Tr(6,4,8,-0.4,10,3.6,HC),Tr(9,4,12.6,1,12.4,5.6,HC),Tr(10.6,6,14,4.6,12.4,8.6,HC),E(8.9,5.8,4.6,3.2,HC),E(10.8,8.2,2.4,3.2,HC),Tr(4.2,6.2,8,3.6,6.4,7,HC)]},
  raspado:{ears:1,front:[],back:[],side:[]},
  topete:{ears:1,front:[E(8,5.6,4.9,3,HC),E(7.2,3,3.8,2.2,HC,{rot:-.15}),E(9.4,2.4,2.4,1.6,HC)],
    back:[E(8,7,5,4.8,HC),E(8,2.8,3.6,1.8,HC)],side:[E(8.8,5.8,4.6,3,HC),E(10.8,8,2.3,3,HC),E(5.6,3.2,3.4,2.1,HC,{rot:-.3})]},
  black:{front:[E(8,5,6.6,4.8,HC),E(3,8,1.8,3,HC,HM)],back:[E(8,6.6,6.6,6,HC)],side:[E(8.8,5.8,6,5,HC)]},
  longo:{under:[Cp(3.8,7,3.4,14.4,1.9,HC,HM)],front:[E(8,5.2,5.1,3.4,HC),Tr(4.2,5,9.4,3.4,5.8,9,HC),Tr(7.6,3.8,12,5,11.2,9,HC)],
    back:[E(8,11.4,5,4.2,HC,{g:'cab'}),E(8,7.2,5.3,5.1,HC,{g:'cab'})],side:[E(8.9,5.6,4.8,3.4,HC),Cp(10.6,7,11,14.4,2.4,HC),Tr(4,6.2,8,3.4,6.6,7.4,HC)]},
  rabo:{ears:1,front:[E(8,5.3,5,3.3,HC)],
    back:[E(8,7,5,4.8,HC),Cp(8,8,8.4,15,1.7,HC),E(8,8.4,1.4,1,'shirt')],side:[E(8.9,5.6,4.7,3.3,HC),Cp(12,6.4,14.4,13,1.6,HC),E(12.2,6.6,1,1,'shirt'),Tr(4,6.2,8,3.4,6.6,7.2,HC)]},
  coque:{ears:1,front:[E(8,1.9,2.3,2,HC),E(8,5.3,5,3.3,HC)],
    back:[E(8,2.2,2.5,2.2,HC),E(8,7,5,4.8,HC)],side:[E(11.4,2.8,2.3,2.1,HC),E(8.9,5.6,4.7,3.3,HC),E(10.8,8,2.3,3,HC),Tr(4,6.2,8,3.4,6.6,7.2,HC)]},
  chanel:{under:[E(3.9,9,1.9,3.4,HC,HM)],front:[E(8,5.4,5.2,3.3,HC),Cp(4.4,6,11.6,6,1.4,HC)],
    back:[E(8,7.6,5.3,5.2,HC)],side:[E(8.9,5.8,4.8,3.4,HC),E(10.4,9,3.2,3.8,HC),Cp(4,6.4,7,6.4,1.2,HC)]},
  trancas:{under:[Cp(4,8,3.6,15.6,1.15,HC,HM),E(3.6,15.8,1,.8,'shirt',HM)],front:[E(8,5.3,5,3.3,HC),Cp(8,2.4,8,5,.18,'pupil')],
    back:[E(8,7,5,4.8,HC),Cp(5,10,4.6,15.6,1.2,HC),Cp(11,10,11.4,15.6,1.2,HC)],side:[E(8.9,5.6,4.7,3.3,HC),Cp(11,8,11.8,15.4,1.2,HC),Tr(4,6.2,8,3.4,6.6,7.2,HC)]},
};
// barbas: frente e lado (partes com a cor do cabelo; a rala usa a pele escurecida)
// barbas seguem o maxilar (costeleta até o queixo) e deixam bochecha e boca à mostra; contorno suave
const BS={soft:1},BSM={soft:1,m:1},NL={noLine:1},NLM={noLine:1,m:1};
const JAW=(r,role,o)=>[Cp(3.9,8.3,4.5,10.6,r,role,o),Cp(4.5,10.6,6.1,11.9,r,role,o),Cp(6.1,11.9,8,12.3,r,role,o)];
const MUST=(r,role,o)=>[Cp(6.5,10.05,7.95,9.85,r,role,o)];
const BEARD_PARTS={
  bigode:{front:MUST(.45,'beard',BSM),side:[Cp(4.2,10,5.8,9.9,.42,'beard',BS)]},
  cavanhaque:{front:[...MUST(.4,'beard',BSM),Cp(7.4,10.9,7.6,11.7,.36,'beard',BSM),E(8,11.9,1.25,.95,'beard',BS)],side:[Cp(4.2,10,5.6,9.9,.4,'beard',BS),E(4.9,11.6,.95,.9,'beard',BS)]},
  rala:{front:[...JAW(.8,'stub',NLM),E(8,12,1.8,.75,'stub',NL),...MUST(.32,'stub',NLM)],side:[Cp(8.7,8.3,7.8,10.8,.75,'stub',NL),Cp(7.8,10.8,4.8,11.9,.75,'stub',NL)]},
  cheia:{front:[...JAW(1.05,'beard',BSM),E(8,12.1,2.3,1.15,'beard',BS),...MUST(.46,'beard',BSM)],
    side:[Cp(8.8,8.2,8.1,10.8,1,'beard',BS),Cp(8.1,10.8,5.1,12,1,'beard',BS),E(4.6,11.8,1.05,.95,'beard',BS),Cp(4.2,10,5.6,9.9,.42,'beard',BS)]},
  longa:{front:[...JAW(1.05,'beard',BSM),Tr(5,11.4,11,11.4,8,17.6,'beard',{soft:1,g:'bl'}),E(8,12.3,3.1,1.5,'beard',{soft:1,g:'bl'}),...MUST(.5,'beard',BSM)],
    side:[Cp(8.8,8.2,8.1,10.8,1,'beard',BS),Cp(8.1,10.8,5.1,12,1,'beard',BS),Tr(3.6,11,7.8,11.4,5,16.8,'beard',{soft:1,g:'bl'}),Cp(4.2,10,5.6,9.9,.44,'beard',BS)]},
};
// franja reta com pontas, usada em todos os cabelos femininos
const FRINGE=[E(8,5,5,3,HC,{g:'fr'}),Tr(3.8,5.4,6.4,5.4,4.9,8.6,HC,{g:'fr'}),Tr(5.6,5.4,8.6,5.4,7,9,HC,{g:'fr'}),Tr(7.6,5.4,10.6,5.4,9.2,8.9,HC,{g:'fr'}),Tr(9.6,5.4,12.2,5.4,11.2,8.4,HC,{g:'fr'})];
const EARS_FRONT=[E(3.5,8.7,.95,1.35,'skin',{m:1,fl:1}),E(3.6,8.8,.4,.7,'skind',{m:1,fl:1})];
// acessórios (skins) por tipo e vista; X1/X2/X3 viram as cores da skin daquele lugar
const ACC_PARTS={
  bone:{front:[E(8,4.7,5.2,2.9,'X1'),Cp(4.4,6.7,11.6,6.7,.75,'X2'),E(8,3,1,.6,'X2')],back:[E(8,5,5.2,3.1,'X1'),Cp(6.4,7.4,9.6,7.4,.4,'X2')],side:[E(8.4,4.8,4.9,2.9,'X1'),Cp(2.2,6.7,6.2,6.6,.75,'X2')]},
  chapeu:{front:[E(8,6.2,7.6,1.7,'X2'),E(8,4.2,4.4,2.8,'X1'),Cp(3.8,5.6,12.2,5.6,.6,'X3')],back:[E(8,6.2,7.6,1.7,'X2'),E(8,4.2,4.4,2.8,'X1'),Cp(3.8,5.6,12.2,5.6,.6,'X3')],side:[E(8,6.2,7,1.5,'X2'),E(8.4,4.2,4.2,2.8,'X1'),Cp(4.4,5.6,12.4,5.6,.6,'X3')]},
  gorro:{front:[E(8,4.6,5.3,3.6,'X1'),Cp(3.2,7,12.8,7,1.05,'X2'),E(8,0.9,1.4,1.3,'X2')],back:[E(8,4.8,5.3,3.6,'X1'),Cp(3.2,7.2,12.8,7.2,1.05,'X2'),E(8,1.1,1.4,1.3,'X2')],side:[E(8.6,4.8,5,3.5,'X1'),Cp(3.8,7,13,7,1,'X2'),E(9.6,1.2,1.3,1.2,'X2')]},
  coroa:{front:[Tr(4.4,4.2,5.6,0.8,6.9,4.2,'X1'),Tr(6.8,4.2,8,0.2,9.2,4.2,'X1'),Tr(9.1,4.2,10.4,0.8,11.6,4.2,'X1'),Cp(4.6,4.6,11.4,4.6,1,'X1'),E(8,4.6,.75,.75,'X3'),E(5.6,4.7,.45,.45,'X3',{m:1})],
    back:[Tr(4.4,4.2,5.6,0.8,6.9,4.2,'X1'),Tr(6.8,4.2,8,0.2,9.2,4.2,'X1'),Tr(9.1,4.2,10.4,0.8,11.6,4.2,'X1'),Cp(4.6,4.6,11.4,4.6,1,'X1')],
    side:[Tr(5,4.2,6.4,0.8,7.6,4.2,'X1'),Tr(8,4.2,9.4,0.4,10.8,4.2,'X1'),Cp(5,4.6,11.6,4.6,1,'X1'),E(6.4,4.7,.5,.5,'X3')]},
  touca:{front:[E(8,3.6,3.6,1.8,'X1'),Cp(6.8,3.4,9.2,3.4,.35,'X2'),Cp(8,2.4,8,4.4,.35,'X2')],back:[E(8,3.8,3.6,1.8,'X1')],side:[E(8.2,3.6,3.2,1.6,'X1')]},
  sol:{front:[E(6.2,8.75,1.5,1.1,'lens',{m:1}),Cp(7.5,8.5,8.5,8.5,.26,'lens'),Cp(4.6,8.4,3.5,8.2,.22,'lens',{m:1}),E(5.7,8.35,.42,.26,'shine',{m:1})],back:[],
    side:[E(4.9,8.8,1.2,.95,'lens'),Cp(5.8,8.4,9.2,8.1,.2,'lens'),E(4.6,8.5,.3,.2,'shine')]},
  grau:{front:[Cp(4.9,7.6,7.4,7.6,.2,'frame',{m:1}),Cp(4.9,9.9,7.4,9.9,.2,'frame',{m:1}),Cp(4.9,7.6,4.9,9.9,.2,'frame',{m:1}),Cp(7.4,7.6,7.4,9.9,.2,'frame',{m:1}),Cp(7.4,8.4,8.6,8.4,.2,'frame')],back:[],
    side:[Cp(4,7.7,6.2,7.7,.2,'frame'),Cp(4,9.8,6.2,9.8,.2,'frame'),Cp(4,7.7,4,9.8,.2,'frame'),Cp(6.2,7.7,6.2,9.8,.2,'frame'),Cp(6.2,8.4,9.2,8.1,.18,'frame')]},
  mochila:{front:[Cp(5.3,11.9,5.7,16,.45,'X2',{m:1})],back:[E(8,14.6,4.1,4.5,'X1'),E(8,12.6,3.7,1.5,'X2'),Cp(6,16.8,10,16.8,.5,'X2')],side:[E(11.4,14.6,1.9,3.8,'X1'),Cp(9.2,12,10.6,12.2,.4,'X2')]},
  cachecol:{front:[Cp(4.8,11.7,11.2,11.7,1.05,'X1'),Cp(10.2,12.2,10.8,15.4,.85,'X1'),Cp(10.3,14,10.8,14,.3,'X2'),Cp(5.4,11.7,6.4,11.7,.3,'X2'),Cp(9.4,11.7,10.4,11.7,.3,'X2')],
    back:[Cp(4.8,11.6,11.2,11.6,1.05,'X1'),Cp(7.4,11.6,8.6,11.6,.3,'X2')],side:[Cp(5,11.7,10.6,11.7,1,'X1'),Cp(9.6,12,11,15,.8,'X1')]},
};
function acc(look,slot,view){
  const id=look.acc&&look.acc[slot],sk=SKINS[id];if(!sk||sk.slot!==slot)return[];
  return(ACC_PARTS[sk.kind][view]||[]).map(p=>/^X\d$/.test(p.c)?{...p,c:slot+p.c[1]}:p);
}
const mixHex=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
function charParts(dir,f,back,look){
  const sw=f===1?1:f===2?-1:0,P=[],fem=look.sex==='f';
  const style=HAIR_PARTS[look.style]||HAIR_PARTS[fem?'longo':'curto'],beard=!fem&&BEARD_PARTS[look.beard];
  if(dir==='left'){
    P.push(Cp(8.4,12.6,8.4+sw*1.5,16,1.05,'shirt'),E(8.4+sw*1.5,16.8,.95,.95,'skin'));
    P.push(Cp(8,17,8-1.3*sw,20.7,1.45,'pants'),Cp(8,17,8+1.3*sw,20.7,1.45,'pants'));
    P.push(E(7.3-1.3*sw,21.7,2,1.1,'shoes'),E(7.3+1.3*sw,21.7,2,1.1,'shoes'));
    P.push(E(8,14.8,fem?3.4:3.7,4.4,'shirt'),Cp(6.4,18,9.6,18,1.5,'pants'));
    P.push(Cp(7.6,12.6,7.6-sw*1.5,16,1.15,'shirt'),E(7.6-sw*1.5,16.9,1,1,'skin'));
    P.push(...acc(look,'costas','side'),...acc(look,'pescoco','side'));
    P.push(E(7.7,7.8,4.4,4.3,'skin',{fl:1}),E(3.5,8.8,.85,.75,'skin',{fl:1}));
    if(beard)P.push(...beard.side);
    P.push(...style.side,...acc(look,'cabeca','side'));
    if(style.ears)P.push(E(9.4,8.8,1,1.35,'skin',{fl:1}),E(9.5,8.9,.45,.7,'skind',{fl:1}));
    if(fem&&!['chanel','black'].includes(look.style))P.push(Tr(3.6,5.4,7,4.6,4.4,8.4,HC));
    if(!fem)P.push(Cp(4.2,7.2,5.9,7,.3,'brow',{f:1,noLine:1}));
    P.push(E(5.1,8.75,.75,1.1,'eyew'),E(4.85,8.85,.5,.9,'iris'),E(4.8,8.95,.26,.5,'pupil'),E(4.95,8.35,.22,.22,'shine'),E(6.6,10.1,.7,.4,'blush'),Cp(4.2,10.7,5.2,10.9,.22,fem?'lips':'mouth'));
    if(fem)P.push(Cp(4.5,7.75,5.8,7.5,.22,'pupil'),Cp(5.8,7.5,6.3,7.1,.18,'pupil'));
    P.push(...acc(look,'rosto','side'));
    return P;
  }
  const lA=f===1?-1.1:0,lB=f===2?-1.1:0,a=sw*.7,ax=fem?.4:0;
  P.push(Cp(3.6+ax,12.6,3.3+ax,16.3+a,1.15,'shirt'),E(3.3+ax,17.1+a,1,1,'skin'),Cp(12.4-ax,12.6,12.7-ax,16.3-a,1.15,'shirt'),E(12.7-ax,17.1-a,1,1,'skin'));
  P.push(Cp(6.3,17,6.3,20.6+lA,1.5,'pants'),Cp(9.7,17,9.7,20.6+lB,1.5,'pants'),E(6.2,21.7+lA,1.9,1.1,'shoes'),E(9.8,21.7+lB,1.9,1.1,'shoes'));
  P.push(E(8,14.8,fem?4.1:4.6,4.4,'shirt'),Cp(5.4,18,10.6,18,1.6,'pants'));
  P.push(...(back?[...acc(look,'costas','back'),...acc(look,'pescoco','back')]:[...acc(look,'pescoco','front'),...acc(look,'costas','front')]));
  if(!back&&style.under)P.push(...style.under);
  if(style.ears)P.push(...EARS_FRONT);
  P.push(E(8,7.7,4.6,4.4,'skin',{fl:1}));
  if(back){P.push(...style.back,...acc(look,'cabeca','back'));return P}
  if(beard)P.push(...beard.front);
  P.push(...style.front);
  if(fem&&look.style!=='chanel')P.push(...FRINGE);
  P.push(...acc(look,'cabeca','front'));
  // sobrancelha (a franja cobre nas meninas), olho com branco, íris e brilho, nariz e sorrisinho
  if(!fem)P.push(Cp(5,7.15,6.9,6.95,.3,'brow',{m:1,f:1,noLine:1}));
  P.push(E(6.1,8.75,.95,1.15,'eyew',{m:1,f:1}),E(6.35,8.85,.62,.95,'iris',{m:1,f:1}),E(6.4,8.95,.32,.55,'pupil',{m:1,f:1}),E(6.1,8.35,.24,.24,'shine',{m:1,f:1}));
  P.push(E(8,9.75,.55,.35,'skind',{f:1,noLine:1}),E(4.9,10.15,.75,.4,'blush',{m:1,f:1}));
  P.push(Cp(7.2,10.75,8,11,.22,fem?'lips':'mouth',{m:1,f:1}));
  if(fem)P.push(Cp(5.1,7.75,6.3,7.55,.24,'pupil',{m:1,f:1}),Cp(5.1,7.75,4.7,7.35,.2,'pupil',{m:1,f:1}));
  P.push(...acc(look,'rosto','front'));
  return P;
}
function buildChar(look){
  look={sex:'m',...look};
  const col={skin:skinRamp(look.skin),hair:ramp(look.hair),shirt:ramp(look.shirt),pants:ramp(look.pants),shoes:ramp('#5a3e2e'),skind:skinRamp(darker(look.skin,.82)),brow:ramp(darker(look.beardColor&&look.style==='raspado'?look.beardColor:look.hair,.8)),beard:ramp(look.beardColor||look.hair),stub:ramp(mixHex(darker(look.skin,.8),look.beardColor||look.hair,.35))};
  for(const slot in look.acc||{}){const sk=SKINS[look.acc[slot]];if(sk)(sk.c||[]).forEach((c,i)=>{col[slot+(i+1)]=ramp(c)})}
  const out={};
  for(const dir of['down','up','left']){
    out[dir]=[0,1,2].map(f=>renderSprite(32,48,charParts(dir,f,dir==='up',look),col,false,2));
  }
  out.right=out.left.map(c=>mk(32,48,g=>{g.translate(32,0);g.scale(-1,1);g.drawImage(c,0,0)}));
  return out;
}

/* =================== tiles (32x32) =================== */
const T={};
// ruído suave que se repete a cada 32px, pra textura não ter emenda entre blocos
function pnoise(x,y,seed,cell=8){
  const n=32/cell,gx=x/cell,gy=y/cell,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0;
  const v=(i,j)=>(hash(((i%n)+n)%n,((j%n)+n)%n,seed)%1000)/1000,s=t=>t*t*(3-2*t);
  const a=v(x0,y0),b=v(x0+1,y0),c=v(x0,y0+1),d=v(x0+1,y0+1);
  return a+(b-a)*s(fx)+(c-a)*s(fy)+(a-b-c+d)*s(fx)*s(fy);
}
function texture(g,seed,tones,cut=[.3,.7]){
  for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const n=pnoise(x,y,seed)*.7+pnoise(x,y,seed+7,4)*.3;R(g,n<cut[0]?tones[0]:n>cut[1]?tones[2]:tones[1],x,y)}
}
const GR=['#74c658','#80d062','#8dd86c'],GD='#4e9c3e',GL='#c2f29a';
function grassBase(g,v){
  texture(g,30+v,GR);
  const n=[5,3,6,2][v];
  for(let i=0;i<n;i++){const h=hash(i,v,21),x=2+h%27,y=4+(h>>>5)%25;
    R(g,GD,x,y,1,2);R(g,GD,x+2,y-1,1,3);R(g,GD,x+4,y,1,2);R(g,GL,x+2,y-2,1,1);R(g,GR[2],x+1,y+1,1,1);R(g,GR[2],x+3,y+1,1,1)}
  if(v===3)for(let i=0;i<5;i++){const h=hash(i,9,77);R(g,GL,h%31,(h>>>6)%31)}
}
// mato alto no estilo Fire Red: tufos em leque de folhas curvas por cima da grama normal, cada tufo com
// um contorno só e as folhas separadas por luz e sombra; os tufos da borda se repetem entre blocos vizinhos
const TALL_FRONT={o:'#2a6b2c',d:'#3f9a3c',m:'#4fb046',l:'#66c852',h:'#a6e878'};
const TALL_BACK={o:'#2a6b2c',d:'#378a36',m:'#43a03e',l:'#58b84a',h:'#8cd866'};
function stamp(g,x,y,r,c){for(let dy=-Math.ceil(r);dy<=Math.ceil(r);dy++)for(let dx=-Math.ceil(r);dx<=Math.ceil(r);dx++){
  if(dx*dx+dy*dy>r*r+.3)continue;const px=Math.round(x+dx),py=Math.round(y+dy);if(py<0||py>=TS||px<0||px>=TS)continue;R(g,c,px,py)}}
function fanTuft(g,cx,by,seed,pal,rustle){
  const sw=rustle?1.9:1,blades=[-.62,-.31,0,.31,.62].map((a,i)=>{const h=hash(i,seed,cx);return{a:a*sw+((h%5)-2)*.04,l:(i===2?12:i%2?10:7.8)+(h%4)*.5-(rustle?2:0),bend:Math.sign(a)*(1+(h%3)*.4)*sw,i}});
  const pts=bl=>{const o=[];for(let t=0;t<=1.0001;t+=.07){const x=cx+Math.sin(bl.a)*bl.l*t+bl.bend*t*t,y=by-Math.cos(bl.a)*bl.l*t;o.push([x,y,(1-t)*1.35+.35,t])}return o};
  g.fillStyle='rgba(20,60,20,.32)';g.beginPath();g.ellipse(cx,by+.5,6.5,2.2,0,0,7);g.fill();
  for(const bl of blades)for(const[x,y,w]of pts(bl))stamp(g,x,y,w+1,pal.o);
  for(const bl of[...blades].sort((p,q)=>Math.abs(q.a)-Math.abs(p.a)))for(const[x,y,w,t]of pts(bl)){
    const c=t>.72?pal.h:bl.i<2?pal.l:bl.i===2?pal.m:pal.d;stamp(g,x,y,w,c);
    if(t<.5&&bl.i!==2)stamp(g,x+(bl.i<2?.9:-.9),y,.4,bl.i<2?pal.m:pal.o);
  }
}
// onlyFront: só a fileira da frente, sem fundo (vai por cima das pernas de quem está no mato)
function tallTile(v,rustle,onlyFront){
  return mk(TS,TS,g=>{
    const j=k=>(hash(v,k,41)%3)-1;
    if(!onlyFront){texture(g,90+v,['#5aac48','#63b64e','#6dbf56']);fanTuft(g,9+j(1),14+j(2)*.5,v*7+1,TALL_BACK,rustle);fanTuft(g,23+j(3),15+j(4)*.5,v*7+2,TALL_BACK,rustle)}
    fanTuft(g,9+j(5),30+j(6)*.5,v*7+3,TALL_FRONT,rustle);fanTuft(g,23+j(7),31,v*7+4,TALL_FRONT,rustle);
  });
}
function buildTiles(){
  buildInterior();
  T.grass=[0,1,2,3].map(v=>mk(TS,TS,g=>grassBase(g,v)));
  T.tall=[0,1,2,3].map(v=>tallTile(v,false));T.tallRustle=[0,1,2,3].map(v=>tallTile(v,true));
  T.tallFront=[0,1,2,3].map(v=>tallTile(v,false,true));T.tallFrontRustle=[0,1,2,3].map(v=>tallTile(v,true,true));
  const treeC={leaf:ramp('#3f9a44'),leafd:ramp('#2f7f3a'),trunk:ramp('#8a5a34')};
  const tree=renderSprite(32,40,[Cp(8,15.5,8,19.6,1.7,'trunk'),Cp(6.4,19.4,9.6,19.4,.9,'trunk'),
    E(8,12.4,5.6,2.8,'leafd',{g:1}),E(8,8.4,7.3,6.2,'leaf',{g:1}),E(4,10.6,3.8,3.4,'leaf',{g:1}),E(12,10.6,3.8,3.4,'leaf',{g:1}),
    E(8,3.8,4.8,3.3,'leaf',{g:1}),E(4.8,5.8,3.3,2.9,'leaf',{g:1}),E(11.2,5.8,3.3,2.9,'leaf',{g:1}),E(8,10,3.8,3.2,'leaf',{g:1})],treeC,false,2);
  T.tree=mk(TS,TS+8,g=>{g.fillStyle='rgba(20,60,20,.32)';g.beginPath();g.ellipse(17,36.5,13,4,0,0,7);g.fill();g.drawImage(tree,0,0)});
  T.water=[0,1,2].map(f=>mk(TS,TS,g=>{
    for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const n=pnoise(x,y,60+f,8);R(g,n<.4?'#4a90dc':n>.66?'#68b2f0':'#5aa2ea',x,y)}
    for(let i=0;i<4;i++){const h=hash(i,f,61),x=(h%26+f*3)%28,y=4+i*7+(h>>>7)%3;R(g,'#a8d8fa',x,y,5,1);R(g,'#a8d8fa',x+1,y-1,3,1);R(g,'#3e82cc',x,y+1,5,1)}
    R(g,'#eaf7ff',(9+f*7)%30,(13+f*5)%30,1,1);R(g,'#eaf7ff',(22+f*5)%30,(25+f*3)%30,1,1)}));
  T.path=[0,1].map(v=>mk(TS,TS,g=>{texture(g,70+v,['#d4bb86','#e2cc98','#ecdcae']);
    for(let i=0;i<7;i++){const h=hash(i,v,71),x=2+h%26,y=2+(h>>>6)%26,w=2+h%3,hh=1+(h>>>9)%2;
      R(g,'#a88c5c',x,y+hh,w+1,1);R(g,'#c4a878',x,y,w+1,hh);R(g,'#f4e6c4',x,y,w,1)}}));
  const edge=(seed,fn)=>mk(TS,TS,g=>{for(let i=0;i<TS;i++){const d=2+(hash(i,3,seed)%4);fn(g,i,d)}});
  T.edge={
    u:edge(1,(g,i,d)=>{R(g,GR[1],i,0,1,d);R(g,'#b89c68',i,d,1,1);if(i%5===2)R(g,GD,i,d-1,1,1)}),
    d:edge(2,(g,i,d)=>{R(g,GR[1],i,TS-d,1,d);R(g,'#f0e2b8',i,TS-d-1,1,1)}),
    l:edge(3,(g,i,d)=>{R(g,GR[1],0,i,d,1);R(g,'#b89c68',d,i,1,1)}),
    r:edge(4,(g,i,d)=>{R(g,GR[1],TS-d,i,d,1);R(g,'#c8ac7a',TS-d-1,i,1,1)}),
  };
  T.dirt=[0,1].map(v=>mk(TS,TS,g=>{texture(g,80+v,['#c8a670','#d8ba84','#e6cc9a']);
    for(let i=0;i<3;i++){const h=hash(i,v,81);let x=h%28,y=(h>>>5)%28;for(let k=0;k<6;k++){R(g,'#a88a5a',x,y);x+=1;y+=(hash(k,i,v)%3)-1}}
    for(let i=0;i<5;i++){const h=hash(i,v,82),x=h%29,y=(h>>>6)%29;R(g,'#9a948e',x,y,2,1);R(g,'#c8c2ba',x,y-1,1,1)}}));
  const rock=renderSprite(TS,TS,[E(8,10,6.6,5.2,'stone'),E(11.6,12,2.8,2.1,'stone'),E(4.6,12.4,2.2,1.7,'stone')],{stone:ramp('#a8a2b0')},false,2);
  T.rock=mk(TS,TS,g=>{g.drawImage(T.dirt[0],0,0);g.fillStyle='rgba(60,40,20,.3)';g.beginPath();g.ellipse(16,27,14,4,0,0,7);g.fill();g.drawImage(rock,0,0)});
  T.flower=[0,1].map(f=>mk(TS,TS,g=>{grassBase(g,3);
    for(const[x,y,c]of[[5,6,'#f05858'],[20,18,'#f8f8f8'],[18,4,'#f8a8c8'],[6,22,'#f8f8f8'],[26,10,'#ffd84a']]){
      const o=f&&(x+y)%2?1:0,cc=darker(c,.78);
      R(g,GD,x+1,y+3,1,4);R(g,GR[2],x+2,y+5,2,1);
      R(g,c,x+o,y,2,2);R(g,c,x-2+o,y+1,2,2);R(g,c,x+2+o,y+1,2,2);R(g,c,x+o,y+2,2,2);R(g,cc,x-2+o,y+2,1,1);R(g,cc,x+3+o,y+2,1,1);R(g,'#f8c830',x+o,y+1,2,1)}}));
}

/* =================== interiores (32x32) =================== */
// piso, paredes e móveis do Centro Zoobumon e da Loja; os móveis têm fundo transparente e vão por cima do piso
const TI={};
function buildInterior(){
  const O='#33293a';
  TI.xadrez=mk(TS,TS,g=>{for(let y=0;y<2;y++)for(let x=0;x<2;x++){const a=(x+y)%2;R(g,a?'#e8dcc4':'#f8f2e4',x*16,y*16,16,16);R(g,a?'#f0e6d2':'#ffffff',x*16,y*16,16,1);R(g,a?'#d8caae':'#ece2cc',x*16+15,y*16,1,16)}
    R(g,'#ffffff',3,3,3,1);R(g,'#ffffff',19,19,3,1)});
  TI.madeira=mk(TS,TS,g=>{for(let r=0;r<4;r++){const y=r*8,c=r%2?'#c08a54':'#cc9862';R(g,c,0,y,TS,8);R(g,'#dcaa74',0,y,TS,1);R(g,'#8e6034',0,y+7,TS,1);
    const j=(r*11)%TS;R(g,'#8e6034',j,y,1,7);for(let i=0;i<3;i++){const h=hash(i,r,51);R(g,'#ad7a46',h%30,y+2+(h>>>5)%4,2,1)}}});
  TI.trim=mk(TS,TS,g=>{R(g,'#3e3150',0,0,TS,TS);R(g,'#4e3f62',0,0,TS,2);R(g,'#2a2236',0,TS-3,TS,3)});
  TI.parede={
    xadrez:mk(TS,TS,g=>{R(g,'#f6e6ea',0,0,TS,20);for(let x=2;x<TS;x+=6)R(g,'#ecd4da',x,0,2,20);R(g,'#fff6f8',0,19,TS,2);R(g,O,0,21,TS,1);R(g,'#dba8b6',0,22,TS,8);R(g,'#e8bcc8',0,22,TS,1);R(g,'#b98494',0,29,TS,3)}),
    madeira:mk(TS,TS,g=>{R(g,'#e6eef4',0,0,TS,20);for(let x=3;x<TS;x+=8)R(g,'#d8e4ec',x,0,3,20);R(g,'#f8fbfd',0,19,TS,2);R(g,O,0,21,TS,1);
      for(let x=0;x<TS;x+=8){R(g,'#b88450',x,22,8,8);R(g,'#c89462',x,22,8,1);R(g,'#8e6034',x+7,22,1,8)}R(g,'#7a5028',0,29,TS,3)}),
  };
  TI.janela=mk(TS,TS,g=>{R(g,O,5,2,22,15);R(g,'#ffffff',6,3,20,13);R(g,'#7cc0f0',8,5,16,9);R(g,'#b4dcf8',8,5,16,3);R(g,'#ffffff',15,5,2,9);R(g,'#eaf6ff',10,6,3,1);R(g,'#ffffff',4,16,24,2)});
  TI.balcao={
    xadrez:mk(TS,TS,g=>{R(g,O,0,4,TS,28);R(g,'#ffffff',0,5,TS,8);R(g,'#f2eef6',0,11,TS,2);R(g,O,0,13,TS,1);R(g,'#e05048',0,14,TS,14);R(g,'#f07870',0,14,TS,2);R(g,'#ffffff',0,20,TS,2);R(g,'#b83838',0,26,TS,4)}),
    madeira:mk(TS,TS,g=>{R(g,O,0,4,TS,28);R(g,'#e0b07a',0,5,TS,7);R(g,'#f0c896',0,5,TS,1);R(g,O,0,12,TS,1);R(g,'#a8703e',0,13,TS,17);for(let x=3;x<TS;x+=10){R(g,'#8a5a30',x,15,8,12);R(g,'#b8804c',x,15,8,1)}R(g,'#704820',0,29,TS,3)}),
  };
  TI.maquina=mk(TS,TS,g=>{R(g,O,3,6,26,24);R(g,'#d6dae6',4,7,24,22);R(g,'#f2f4fa',4,7,24,2);R(g,'#a8aec0',4,26,24,3);R(g,O,7,10,18,10);R(g,'#5a6278',8,11,16,8);
    for(let i=0;i<6;i++){const x=9+(i%3)*5,y=12+Math.floor(i/3)*4;R(g,'#e04848',x,y,3,1);R(g,'#ffffff',x,y+1,3,1);R(g,'#2a2236',x,y+2,3,0)}R(g,'#58e080',22,23,3,3);R(g,'#c8f8d0',22,23,1,1)});
  TI.pc=mk(TS,TS,g=>{R(g,O,1,18,30,12);R(g,'#b88450',2,19,28,4);R(g,'#8e6034',2,23,28,6);R(g,O,7,2,18,15);R(g,'#4a4e5e',8,3,16,13);R(g,'#4ab0f0',10,5,12,9);R(g,'#9adcff',10,5,12,2);
    for(let y=8;y<13;y+=2)R(g,'#2a80c8',11,y,8,1);R(g,O,14,16,4,3);R(g,'#e8e8f0',9,19,14,3);R(g,'#b8b8c8',9,21,14,1)});
  const plantC={leaf:ramp('#3f9a44'),pot:ramp('#c8703e')};
  const plant=renderSprite(TS,TS,[Cp(6,12,10,12,2.6,'pot'),E(8,13.6,3.6,2.2,'pot'),E(8,7,4.4,4,'leaf',{g:1}),E(5,8.6,2.8,2.4,'leaf',{g:1}),E(11,8.6,2.8,2.4,'leaf',{g:1}),E(8,3.6,2.6,2.2,'leaf',{g:1})],plantC,false,2);
  TI.planta=mk(TS,TS,g=>{g.fillStyle='rgba(30,20,40,.25)';g.beginPath();g.ellipse(16,29,9,3,0,0,7);g.fill();g.drawImage(plant,0,0)});
  TI.banco=mk(TS,TS,g=>{g.fillStyle='rgba(30,20,40,.22)';g.fillRect(2,26,28,4);R(g,O,2,12,28,10);R(g,'#c89462',3,13,26,4);R(g,'#dcaa74',3,13,26,1);R(g,'#a8703e',3,17,26,4);R(g,O,4,22,3,6);R(g,O,25,22,3,6)});
  TI.prateleira=[0,1].map(v=>mk(TS,TS,g=>{R(g,O,1,0,30,32);R(g,'#a8703e',2,1,28,30);
    for(let r=0;r<3;r++){const y=2+r*10;R(g,'#7a5028',3,y,26,8);R(g,'#c89462',2,y+8,28,2);
      for(let i=0;i<4;i++){const h=hash(i,r,v*9+3),c=['#e04848','#3a6ad8','#f2c03a','#38a050','#f4f4f4','#8848c0'][h%6],w=4+h%2,x=4+i*6;R(g,c,x,y+8-(4+h%3),w,4+h%3);R(g,'#ffffff',x,y+8-(4+h%3),1,1)}}}));
  TI.tapete=mk(TS,TS,g=>{R(g,'#a83a30',3,4,26,24);R(g,'#f0c070',4,5,24,22);R(g,'#c84a3a',6,7,20,18);R(g,'#f0c070',13,11,6,2);R(g,'#f0c070',14,13,4,2);R(g,'#f0c070',15,15,2,4)});
}
