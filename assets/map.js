(function(){
const BODY=document.body,ST=BODY.dataset.st||null,ROOT=BODY.dataset.root||'./';
const M=window.BALLOT_DATA,$=s=>document.querySelector(s),fmt=n=>n.toLocaleString('en-US');
const INFO={OH:['Ohio','ohio'],ME:['Maine','maine'],IL:['Illinois','illinois'],KS:['Kansas','kansas'],NJ:['New Jersey','new-jersey'],WI:['Wisconsin','wisconsin'],CA:['California','california'],NV:['Nevada','nevada'],FL:['Florida','florida'],ND:['North Dakota','north-dakota']};
const CODE=Object.fromEntries(Object.entries(INFO).map(([k,v])=>[v[0],k]));
const pageUrl=st=>ROOT+INFO[st][1]+'/index.html';
const SHORT={'Joliet Township':'Joliet Twp.','Morgan County':'Morgan Co.','Sprigg Township':'Sprigg Twp.','Monroe Township':'Monroe Twp.','Downe Township':'Downe Twp.'};
M.forEach(m=>{
  if(m.noCount){m.side='limit';m.cls='d-bind';m.flag='';m.short=SHORT[m.place]||m.place;m.winPct=m.reported;m.limPct=m.reported;return}
  m.total=m.y+m.n;m.lim=m.ym==='limit'?m.y:m.n;m.limPct=100*m.lim/m.total;
  m.side=m.lim*2>m.total?'limit':'dc';m.winPct=m.side==='limit'?m.limPct:100-m.limPct;
  m.cls=m.side==='dc'?'d-dc':m.kind==='Advisory'?'d-adv':'d-bind';
  m.flag=m.counting?'*':'';m.short=SHORT[m.place]||m.place;
});
const scope=ST?M.filter(m=>m.st===ST):M,count=f=>scope.filter(f).length;

/* key and notes */
[['d-bind','No to data centers'],['d-adv','No to data centers (non-binding vote)'],['d-dc','Yes to data centers']].forEach(([c,t])=>{
  const n=count(m=>m.cls===c);if(!n)return;
  const d=document.createElement('div');d.className='k';
  d.innerHTML=`<svg width="16" height="16" aria-hidden="true"><circle class="${c}" cx="8" cy="8" r="${c==='d-adv'?5.4:6.4}"/></svg>`;
  d.append(document.createTextNode(t+' '));const b=document.createElement('b');b.textContent=n;d.append(b);$('#key').append(d);
});
const k=document.createElement('div');k.className='k pct';k.textContent='% = winning side\'s share of the vote';if(ST)$('#key').append(k);
if(count(m=>m.cls==='d-adv')){const a=document.createElement('div');a.className='k pct';a.textContent='Non-binding: on the official ballot, but the result does not change any law';$('#key').append(a)}
const marks=[];if(ST&&count(m=>m.counting))marks.push('*Still counting');
$('#src').textContent=(marks.length?marks.join('. ')+'. ':'')+'Sources: County, town and state election offices; local news. Unofficial results as of November 8th 2026';

/* tooltip */
const tip=$('#tip');let pinned=false,hideT,showT,cur=null;
function addSources(m,parent){
  (m.sources||[]).forEach(s=>{const r=document.createElement('div');r.className='s';r.append(document.createTextNode(s.label+': '));if(s.url){const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener';a.textContent=s.name;r.append(a)}else r.append(document.createTextNode(s.name));if(s.hint){const h=document.createElement('span');h.textContent=' ('+s.hint+')';r.append(h)}parent.append(r)});
}
function keepTipInView(){const r=tip.getBoundingClientRect();if(r.bottom>innerHeight-8)tip.style.top=Math.max(8,innerHeight-r.height-8)+'px'}
function closeTip(){pinned=false;cur=null;clearTimeout(hideT);clearTimeout(showT);tip.classList.remove('pin');tip.hidden=true}
function tipFor(m,pin){
  pinned=!!pin;cur=m;tip.classList.toggle('pin',pinned);tip.textContent='';
  const add=(t,x,c,p)=>{const e=document.createElement(t);e.textContent=x;if(c)e.className=c;(p||tip).append(e);return e};
  if(pinned){const x=add('button','×','tip-x');x.type='button';x.setAttribute('aria-label','Close');x.addEventListener('click',closeTip)}
  add('b',`${m.place}, ${INFO[m.st][0]}`);add('p',m.plain);
  if(!m.noCount){
    const v=add('div','','v');
    const part=(l,val)=>add('span',`${l} ${fmt(val)} (${(100*val/m.total).toFixed(1)}%)`,'',v);
    part('Yes',m.y);part('No',m.n);
    if(m.counting)add('span','Still counting.','c');
  }
  if(!pinned){add('span','Click to keep open and see sources','hint');tip.hidden=false;return}
  const more=document.createElement('div');more.className='more';more.hidden=true;
  add('span',`${m.county} County`,'c',more);
  if(m.advisory)add('span',m.advisory,'c',more);
  addSources(m,more);
  const row=add('div','','acts');
  const btn=add('button','More','more-btn',row);btn.type='button';btn.setAttribute('aria-expanded','false');
  btn.addEventListener('click',()=>{const open=more.hidden;more.hidden=!open;btn.textContent=open?'Less':'More';btn.setAttribute('aria-expanded',String(open));keepTipInView()});
  if(!ST){const a=add('a',`Open ${INFO[m.st][0]} map`,'',row);a.href=pageUrl(m.st)}
  tip.append(more);
  tip.hidden=false;
  keepTipInView();
}
function moveTip(e){const r=tip.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(e.clientX+14,innerWidth-r.width-8))+'px';tip.style.top=(e.clientY+r.height+22>innerHeight?Math.max(8,e.clientY-r.height-12):e.clientY+14)+'px'}
const hideTip=()=>{if(pinned)return;clearTimeout(hideT);hideT=setTimeout(()=>{tip.hidden=true;cur=null},260)};
tip.addEventListener('pointerenter',()=>{clearTimeout(hideT);clearTimeout(showT)});tip.addEventListener('pointerleave',hideTip);
tip.addEventListener('click',e=>{if(!pinned&&cur){clearTimeout(hideT);const r=tip.getBoundingClientRect();tipFor(cur,true);tip.style.left=r.left+'px';tip.style.top=r.top+'px';keepTipInView()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTip()});
document.addEventListener('pointerdown',e=>{if(e.target.closest&&(e.target.closest('.hit')||e.target.closest('#tip')))return;closeTip()});

const cv=document.createElement('canvas').getContext('2d');
const tw=(t,size,w)=>{cv.font=`${w} ${size}px "Libre Franklin","Helvetica Neue",Arial,sans-serif`;return cv.measureText(t).width};
function rng(seed){return ()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296}
const DIRS=[[1,0,0],[-1,0,2],[1,-1,3],[1,1,3],[-1,-1,5],[-1,1,5],[0,-1,6],[0,1,6]],DIST=[0,10,22,36,54,76];
function solve(items,dots,W,H){
  const GAP=3,E=5,hitsBox=(p,b,m)=>p.x+p.r+m>b.x&&p.x-p.r-m<b.x+b.w&&p.y+p.r+m>b.y&&p.y-p.r-m<b.y+b.h;
  items.forEach(it=>{
    if(it.fixed){it.cands=[{x:it.anchor==='start'?it.x:it.x-it.w/2,y:it.y-it.h/2,w:it.w,h:it.h,a:it.anchor,d:0,ux:0,uy:0,ex:it.x,ey:it.y,cost:0}];it.cur=0;return}
    it.cands=[];const dd=it.ref?[0]:it.always?DIST.slice(1):DIST;
    DIRS.forEach(([ux,uy,pref])=>dd.forEach(d=>{
      const reach=it.ar+GAP+d;let x,y,a;
      if(uy===0){x=ux>0?it.x+reach:it.x-reach-it.w;y=it.y-it.h/2;a=ux>0?'start':'end'}
      else if(ux===0){x=it.x-it.w/2;y=uy<0?it.y-reach-it.h:it.y+reach;a='middle'}
      else{const k=reach*.74;x=ux>0?it.x+k:it.x-k-it.w;y=uy<0?it.y-k-it.h:it.y+k;a=ux>0?'start':'end'}
      const c={x,y,w:it.w,h:it.h,a,uy,ux,d};
      c.ex=a==='start'?x-2:a==='end'?x+it.w+2:x+it.w/2;c.ey=a==='middle'?(uy<0?y+it.h+1:y-1):y+it.h/2;
      const out=Math.max(0,E-x)+Math.max(0,x+it.w-W+E)+Math.max(0,E-y)+Math.max(0,y+it.h-H+E);
      let cost=pref*(it.ref?8:1.2)+d*(it.ref?4:1.5)+out*400;
      dots.forEach(p=>{if(it.own&&it.own.has(p))return;if(hitsBox(p,c,1.5))cost+=it.ref?500:2600;
        if(d>0)for(let t=.1;t<1;t+=.1){const sx=it.x+(c.ex-it.x)*t,sy=it.y+(c.ey-it.y)*t;if(Math.hypot(sx-p.x,sy-p.y)<p.r+1.5){cost+=900;break}}});
      c.cost=cost;it.cands.push(c);
    }));
    it.cur=it.cands.reduce((b,c,j)=>c.cost<it.cands[b].cost?j:b,0);
  });
  const boxHit=(a,b)=>{const m=2,ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)+m,oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)+m;return ox>0&&oy>0?ox*oy:0};
  const ccw=(ax,ay,bx,by,cx,cy)=>(cy-ay)*(bx-ax)>(by-ay)*(cx-ax);
  const cross=(p1,q1,p2,q2)=>ccw(p1.x,p1.y,p2.x,p2.y,q2.x,q2.y)!==ccw(q1.x,q1.y,p2.x,p2.y,q2.x,q2.y)&&ccw(p1.x,p1.y,q1.x,q1.y,p2.x,p2.y)!==ccw(p1.x,p1.y,q1.x,q1.y,q2.x,q2.y);
  function pair(ia,ca,ib,cb){
    let c=0;const ov=boxHit(ca,cb);if(ov)c+=(ia.ref||ib.ref?1800:9000)+ov*12;
    const line=(it,k,o)=>{if(!k.d)return 0;for(let t=.05;t<1;t+=.08){const x=it.x+(k.ex-it.x)*t,y=it.y+(k.ey-it.y)*t;if(x>o.x-1&&x<o.x+o.w+1&&y>o.y-1&&y<o.y+o.h+1)return 2400}return 0};
    c+=line(ia,ca,cb)+line(ib,cb,ca);
    if(ca.d&&cb.d&&cross({x:ia.x,y:ia.y},{x:ca.ex,y:ca.ey},{x:ib.x,y:ib.y},{x:cb.ex,y:cb.ey}))c+=3200;
    return c;
  }
  const local=(i,ci)=>{const a=items[i],ca=a.cands[ci];let c=ca.cost;items.forEach((b,j)=>{if(j!==i)c+=pair(a,ca,b,b.cands[b.cur])});return c};
  const R=rng(20261103);let T=3000;const N=items.length*1400,cool=Math.pow(.5/T,1/N);
  for(let n=0;n<N;n++){const i=Math.floor(R()*items.length),it=items[i],nx=Math.floor(R()*it.cands.length);if(nx!==it.cur){const dE=local(i,nx)-local(i,it.cur);if(dE<0||R()<Math.exp(-dE/T))it.cur=nx}T*=cool}
  for(let p=0;p<4;p++)items.forEach((it,i)=>{let bi=it.cur,bc=local(i,bi);it.cands.forEach((c,j)=>{const v=local(i,j);if(v<bc){bc=v;bi=j}});it.cur=bi});
  items.forEach(it=>it.box=it.cands[it.cur]);
}

const single=m=>{const name=m.short+m.flag,pct=(m.noCount?'about ':'')+m.winPct.toFixed(0)+'%';return {name,pct,text:name+' '+pct}};
function stateNodes(st){
  const ms=M.filter(m=>m.st===st),done=new Set(),out=[];
  const grp=(test,lines)=>{const g=ms.filter(test);g.forEach(m=>done.add(m));out.push({ms:g,lines})};
  if(st==='OH')grp(m=>m.id.startsWith('oh-wilmington'),[{text:'Wilmington 80% each',name:'Wilmington',pct:'80% each'},{text:'4 rezoning votes',cls:'sub'}]);
  if(st==='IL'){const L=[{text:'Madison Co. townships',cls:'sub'}];ms.filter(m=>m.county==='Madison').sort((a,b)=>a.place.localeCompare(b.place)).forEach(m=>L.push(single({...m,short:m.place.replace(' Township','')})));grp(m=>m.county==='Madison',L)}
  ms.filter(m=>!done.has(m)).forEach(m=>out.push({ms:[m],lines:[single(m)]}));
  return out;
}
const REFS={OH:[['Cleveland',41.4993,-81.6944],['Columbus',39.9612,-82.9988,1],['Cincinnati',39.1031,-84.512]],IL:[['Chicago',41.8781,-87.6298],['Springfield',39.7817,-89.6501]],ME:[['Bangor',44.8016,-68.7712],['Augusta',44.3106,-69.7795],['Portland',43.6591,-70.2568]],KS:[['Wichita',37.6872,-97.3301],['Topeka',39.0473,-95.6752]],NJ:[['Newark',40.7357,-74.1724],['Trenton',40.2206,-74.7597],['Atlantic City',39.3643,-74.4229]],WI:[['Milwaukee',43.0389,-87.9065],['Madison',43.0731,-89.4012]],CA:[['Los Angeles',34.0522,-118.2437,1],['San Francisco',37.7749,-122.4194],['Sacramento',38.5816,-121.4944]],NV:[['Las Vegas',36.1699,-115.1398,1],['Reno',39.5296,-119.8138]],FL:[['Orlando',28.5383,-81.3792],['Jacksonville',30.3322,-81.6557],['Miami',25.7617,-80.1918]],ND:[['Fargo',46.8772,-96.7898,1],['Bismarck',46.8083,-100.7837]]};

let F;
function draw(){
  const host=$('#map'),W=Math.round(host.clientWidth);if(!W)return;
  const small=W<480,vh=Math.max(420,innerHeight-190);
  const focal=ST?F.find(f=>f.code===ST):null;
  let H;
  if(ST){const b=d3.geoPath(d3.geoConicConformal().parallels([38,42]).rotate([-d3.geoCentroid(focal)[0],0]).scale(1000)).bounds(focal),a=(b[1][1]-b[0][1])/(b[1][0]-b[0][0]);
    H=small?Math.round(W*Math.max(a*1.02,.72)):Math.round(Math.min(vh,Math.max(W*a*.9,W*.58)))}
  else H=small?Math.round(W*.92):Math.round(Math.min(vh,W*.62));
  const fs=small?13.5:(ST?16:15),lh=fs*1.2,R=ST?(small?5.4:7.5):Math.max(2.6,Math.min(4.4,W*0.00355));
  const proj=ST?(()=>{const c=d3.geoCentroid(focal),[l,t,r,b]=small?[.15,.06,.15,.06]:[.09,.06,.09,.06];return d3.geoConicConformal().parallels([c[1]-1.5,c[1]+1.5]).rotate([-c[0],0]).fitExtent([[W*l,H*t],[W*(1-r),H*(1-b)]],focal)})()
    :d3.geoAlbersUsa().fitExtent([[W*.03,H*(small?.14:.04)],[W*.95,H*(small?.86:.97)]],{type:'FeatureCollection',features:F});
  const path=d3.geoPath(proj);host.textContent='';
  const label=ST?`${INFO[ST][0]}: ${scope.length} local data center ballot measures.`:`United States: ${M.length} local data center ballot measures in 10 states. Select a state to open its map.`;
  const svg=d3.select(host).append('svg').attr('class','map').attr('viewBox',`0 0 ${W} ${H}`).attr('height',H).attr('role','img').attr('aria-label',label);
  const relevant=new Set(M.map(m=>m.st));
  const vis=F.filter(f=>{const b=path.bounds(f);return isFinite(b[0][0])&&b[1][0]>0&&b[0][0]<W&&b[1][1]>0&&b[0][1]<H});
  const gs=svg.append('g');
  vis.filter(f=>!(ST?f.code===ST:relevant.has(f.code))).forEach(f=>gs.append('path').attr('d',path(f)).attr('class','st'));
  vis.filter(f=> (ST?f.code===ST:relevant.has(f.code))).forEach(f=>{
    if(ST)gs.append('path').attr('d',path(f)).attr('class','st on');
    else{const a=gs.append('a').attr('href',pageUrl(f.code)).attr('aria-label',INFO[f.code][0]);a.append('path').attr('d',path(f)).attr('class','st on link')}
  });
  const nodeList=ST?stateNodes(ST):M.map(m=>({ms:[m]}));
  const nodes=nodeList.map(n=>{const pts=n.ms.map(m=>proj([m.lon,m.lat])),tx=d3.mean(pts,p=>p[0]),ty=d3.mean(pts,p=>p[1]);return {...n,tx,ty,x:tx,y:ty,rad:n.ms.length>1?(R+.8)*Math.SQRT2+R*.9:R}});
  /* spread overlapping dots apart, but never across their own state's border: a dot pushed outside is pulled back toward its true spot, so crowded states overlap slightly instead of spilling */
  const featBy=Object.fromEntries(F.map(f=>[f.code,f]));
  const g=R+.8,inAt=(n,x,y)=>{const pts=n.ms.length>1?[[x-g,y-g],[x+g,y-g],[x-g,y+g],[x+g,y+g]]:[[x,y]];return pts.every(q=>{const ll=proj.invert(q);return !!ll&&d3.geoContains(featBy[n.ms[0].st],ll)})};
  const inState=n=>inAt(n,n.x,n.y);
  const sim=d3.forceSimulation(nodes).force('x',d3.forceX(d=>d.tx).strength(.8)).force('y',d3.forceY(d=>d.ty).strength(.8)).force('c',d3.forceCollide(d=>d.rad+.9).iterations(4)).stop();
  for(let i=0;i<240;i++){sim.tick();nodes.forEach(n=>{if(!inState(n)){n.x=(n.x+n.tx)/2;n.y=(n.y+n.ty)/2;n.vx=0;n.vy=0}})}
  nodes.forEach(n=>{if(inState(n))return;n.x=n.tx;n.y=n.ty;if(inState(n))return;
    /* a dot or group sitting right on a border: step inward to the nearest spot fully inside */
    for(let r=1;r<=8*R;r+=1){let done=false;for(let a=0;a<16&&!done;a++){const x=n.tx+r*Math.cos(a*Math.PI/8),y=n.ty+r*Math.sin(a*Math.PI/8);if(inAt(n,x,y)){n.x=x;n.y=y;done=true}}if(done)break}});
  const dots=[];
  nodes.forEach(n=>{n.parts=n.ms.length===1?[{m:n.ms[0],x:n.x,y:n.y,r:R}]:n.ms.map((m,i)=>({m,r:R,x:n.x+(i%2?1:-1)*(R+.8),y:n.y+(i<2?-1:1)*(R+.8)}));dots.push(...n.parts)});
  const items=[],size=(c)=>({h:c.lines.length*lh,w:Math.ceil(d3.max(c.lines,l=>tw(l.text,fs,400)))+2});
  if(ST){
    nodes.filter(n=>n.lines).forEach(n=>items.push({x:n.x,y:n.y,ar:n.rad,lines:n.lines,own:new Set(n.parts),...size(n)}));
    (REFS[ST]||[]).forEach(([name,lat,lon,wide])=>{if(wide&&small)return;const p=proj([lon,lat]);if(!p||p[0]<0||p[0]>W||p[1]<0||p[1]>H)return;const s=fs-2;items.push({x:p[0],y:p[1],ar:2.6,w:Math.ceil(tw(name,s,400))+1,h:s*1.2,ref:name,refSize:s})});
  }else{
    /* hand-placed state names: [lat, lon, text-anchor] */
    const NAME_AT={CA:[37.3,-119.7],NV:[39.6,-116.9],ND:[47.45,-100.6],KS:[38.5,-99.6],WI:[44.7,-90.15],FL:[27.75,-81.42],IL:[41.65,-89.92],ME:[45.75,-69.15],OH:[40.62,-81.42],NJ:[40.05,-73.55,'start']};
    const NAME_PHONE={IL:[41.55,-89.95],ME:[47.25,-69.05],OH:[40.35,-81.45],FL:[26.9,-81.3],KS:[38.5,-100.4],WI:[45.4,-90.1],ND:[47.5,-101.2],NJ:[40.1,-73.1,'start']};
    /* each state name tests itself at the size it is drawn: full name, then postal code, then hidden.
       It must sit inside its own state (New Jersey's sits in the ocean beside it) and clear every dot. */
    const lf=W<700?11.5:W<1000?12.5:fs-1.5;
    const feat=Object.fromEntries(F.map(f=>[f.code,f]));
    const fitsPx=(st,text,px,py,anchor)=>{
      const w=Math.ceil(tw(text,lf,400))+2,h=lf*1.15,x0=anchor==='start'?px:px-w/2,y0=py-h/2;
      if(x0<2||x0+w>W-2||y0<2||y0+h>H-2)return null;
      if(anchor!=='start'){for(const x of [x0+1,x0+w/2,x0+w-1])for(const y of [py]){const ll=proj.invert([x,y]);if(!ll||!d3.geoContains(feat[st],ll))return null}}
      for(const d of dots){if(d.x+d.r+1>x0&&d.x-d.r-1<x0+w&&d.y+d.r+1>y0-1&&d.y-d.r-1<y0+h+1)return null}
      return {p:[px,py],anchor,w,h};
    };
    const fixedTry=(st,text)=>{for(const pos of [NAME_AT[st],NAME_PHONE[st]].filter(Boolean)){const [lat,lon,anchor='middle']=pos,p=proj([lon,lat]);if(p){const f=fitsPx(st,text,p[0],p[1],anchor);if(f)return f}}return null};
    const gridTry=(st,text)=>{
      if(st==='NJ')return null;
      const [[bx0,by0],[bx1,by1]]=path.bounds(feat[st]),pref=proj([NAME_AT[st][1],NAME_AT[st][0]]),c=[];
      for(let x=bx0;x<=bx1;x+=3)for(let y=by0;y<=by1;y+=3)c.push([x,y,Math.hypot(x-pref[0],y-pref[1])]);
      c.sort((a,b)=>a[2]-b[2]);
      for(const [x,y] of c){const f=fitsPx(st,text,x,y,'middle');if(f)return f}
      return null;
    };
    Object.keys(INFO).forEach(st=>{
      const own=nodes.filter(n=>n.ms[0].st===st);
      let hit=null,text=null;
      /* full name at its usual spot, then anywhere open inside the state; then the postal code the same way */
      for(const t of [INFO[st][0],st]){hit=fixedTry(st,t)||gridTry(st,t);if(hit){text=t;break}}
      if(!hit)return; /* no room at this size; the state shape still links to its page */
      items.push({x:hit.p[0],y:hit.p[1],ar:0,fixed:true,anchor:hit.anchor,own:new Set(own.flatMap(n=>n.parts)),go:st,fs:lf,lines:[{text}],w:hit.w,h:lh});
    });
  }
  solve(items,dots,W,H);
  items.filter(i=>(i.box.d&&!i.ref)||i.always).forEach(it=>{const b=it.box,dx=b.ex-it.x,dy=b.ey-it.y,len=Math.hypot(dx,dy)||1,o=it.ar+.5;svg.append('line').attr('class','lead').attr('x1',it.x+dx/len*o).attr('y1',it.y+dy/len*o).attr('x2',b.ex).attr('y2',b.ey)});
  items.filter(i=>i.ref).forEach(it=>svg.append('rect').attr('class','refdot').attr('x',it.x-2.2).attr('y',it.y-2.2).attr('width',4.4).attr('height',4.4));
  dots.forEach(p=>{
    const c=svg.append('g');
    c.append('circle').attr('class',p.m.cls).attr('data-st',p.m.st).attr('cx',p.x).attr('cy',p.y).attr('r',p.m.cls==='d-adv'?p.r-1:p.r).style('stroke-width',p.m.cls==='d-adv'?Math.min(2.6,p.r*.36)+'px':null);
    c.append('circle').attr('class','hit').attr('cx',p.x).attr('cy',p.y).attr('r',Math.max(p.r+3,small?11:8))
      .on('pointerenter',e=>{clearTimeout(hideT);clearTimeout(showT);if(pinned)return;const go=()=>{tipFor(p.m,false);moveTip(e)};if(tip.hidden)go();else showT=setTimeout(go,180)}).on('pointerleave',()=>{clearTimeout(showT);hideTip()})
      .on('click',e=>{e.stopPropagation();clearTimeout(showT);clearTimeout(hideT);tipFor(p.m,true);moveTip(e);keepTipInView()});
  });
  items.forEach(it=>{
    const b=it.box,tx=b.a==='start'?b.x:b.a==='end'?b.x+b.w:b.x+b.w/2;
    if(it.ref){svg.append('text').attr('class','ref').attr('font-size',it.refSize).attr('text-anchor',b.a).attr('x',tx).attr('y',b.y+it.refSize*.95).text(it.ref);return}
    const parent=it.go?svg.append('a').attr('href',pageUrl(it.go)):svg;
    const t=parent.append('text').attr('class','lbl'+(it.go?' go':'')).attr('text-anchor',b.a).attr('font-size',it.fs||fs);
    it.lines.forEach((l,k)=>{const row=t.append('tspan').attr('x',tx).attr('y',b.y+lh*k+lh*.8);if(l.cls==='sub')row.attr('class','sub');if(l.name!=null){row.append('tspan').text(l.name+' ');row.append('tspan').attr('class','p').text(l.pct)}else row.text(l.text)});
  });
}
function render(){
  try{
    F=F||topojson.feature(window.US_STATES,window.US_STATES.objects.states).features.filter(f=>+f.id<=56);
    F.forEach(f=>{f.code=CODE[f.properties.name]||f.id});
    draw();
  }catch(e){console.error(e);$('#map').textContent='The map could not load. Check your internet connection and reload.'}
}
window.renderMap=render;
render();
if(document.fonts&&document.fonts.load)Promise.all([400,500,700].map(w=>document.fonts.load(w+' 15px "Libre Franklin"'))).then(render).catch(()=>{});
let lastW=innerWidth,rt;addEventListener('resize',()=>{if(innerWidth===lastW)return;lastW=innerWidth;clearTimeout(rt);rt=setTimeout(render,120)});
})();
