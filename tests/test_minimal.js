// Minimalist display, Phase 1 (Hole 2 only, v5.3.0 header + v5.3.1 hazard labels by golfer-to-hazard distance) — node tests/test_minimal.js
// Compares the new /play/ (prototype/play) with the previous published /play/ (OLD_PLAY, default: gh-pages checkout)
// at simulated centre distances 300/251/250/200/100/60 yd on Hole 2, in simulated AND live GPS mode.
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),NEW=path.join(ROOT,'prototype','play'),OLD=process.env.OLD_PLAY||'/home/claude/pocasset-caddie-v3/play';
const SHOTS=path.join(ROOT,'prototype','screenshots_minimal');fs.mkdirSync(SHOTS,{recursive:true});
const R={checks:{},rows:[],errors:[]};function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));return !!p}
const serve=(dir,port)=>http.createServer((q,res)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(port);
const s1=serve(NEW,8811),s2=serve(OLD,8812),DIST=[300,261,251,250,200,100,60,40];
// a point on Hole N's playing line whose header centre yardage (V2.3.1 engine) is exactly `yd`
const findPt=(n,yd)=>{const c=__play.course;let lo=Math.max(0,yd-15),hi=yd+15;for(let k=0;k<60;k++){const m=(lo+hi)/2,q=c.alongFromGreen(n,m);if(!q){hi=m;continue}if(c.readout(n,q,'sim',null,null).center<yd)lo=m;else hi=m}const q=c.alongFromGreen(n,hi);return q&&c.readout(n,q,'sim',null,null).center===yd?q:null};
async function open(b,port){const pg=await (await b.newContext({...devices['iPhone 13']})).newPage();pg.on('pageerror',e=>R.errors.push(port+': '+e.message));
 await pg.goto('http://localhost:'+port+'/');await pg.waitForTimeout(400);await pg.click('#teeGo');await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(700);return pg}
// Move Me: tap the golfer's spot on the current picture with "move me" selected (switches to Tee view only if the spot isn't on the picture)
const moveMe=(pg,pt)=>pg.evaluate(p=>{const P=__play,S=P.S,hd=P.HD[2],uv=hd.hole.frame.toUV(p[0],p[1]);
  const tap=()=>{const v=hd.views[S.view],q=v.V.project(uv[0],uv[1]);if(!q)return false;const bx=S.box||{x:0,y:0,w:v.width,h:v.height},fx=(q[0]-bx.x)/bx.w,fy=(q[1]-bx.y)/bx.h;
   if(fx<0.01||fx>0.99||fy<0.01||fy>0.99)return false;const st=document.getElementById('stage').getBoundingClientRect(),want=P.course.readout(2,p,'sim',null,null).center;
   // a finger lands on whole pixels: pick the pixel nearest the spot whose header centre reads exactly the wanted yardage
   let best=null;for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){const X=Math.round(st.left+fx*st.width)+dx,Y=Math.round(st.top+fy*st.height)+dy,
     u=v.V.unproject(bx.x+(X-st.left)/st.width*bx.w,bx.y+(Y-st.top)/st.height*bx.h);if(!u)continue;const ll=hd.hole.frame.toLonLat(u[0],u[1]);
     if(P.course.readout(2,ll,'sim',null,null).center!==want)continue;const e=Math.hypot(u[0]-uv[0],u[1]-uv[1]);if(!best||e<best.e)best={X,Y,e}}
   if(!best)return false;
   document.getElementById('stage').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:best.X,clientY:best.Y}));return true};
  document.getElementById('mMe').click();S.target=null;let how='tapped on '+S.view+' view';
  if(!tap()){document.getElementById('vTee').click();how='switched to Tee view, tapped';if(!tap())return null}
  document.getElementById('mTarget').click();const m=hd.hole.frame.toUV(S.me[0],S.me[1]);
  return {how,errYd:+(Math.hypot(m[0]-uv[0],m[1]-uv[1])/0.9144).toFixed(2),me:S.me,mode:S.mode,view:S.view,manual:S.viewManual}},pt);
// the same spot as a live GPS fix, or (previous release) as a simulated position with the same view
const asLive=(pg,ll)=>pg.evaluate(p=>{const P=__play;P.prefs.autoHole=false;P.S.target=null;P.fix(p[0],p[1],5)},ll);
const asSim=(pg,ll,view,manual)=>pg.evaluate(([p,v,m])=>{const P=__play,S=P.S;S.target=null;S.mode='sim';S.me=p;S.acc=null;S.meLabel='TEST';S.view=v;S.viewManual=m;P.render()},[ll,view,manual]);
const state=pg=>pg.evaluate(()=>{const P=__play,S=P.S,hd=P.HD[2],me=hd.hole.frame.toUV(S.me[0],S.me[1]),vis=id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null&&getComputedStyle(e).display!=='none'};
  const inRing=(q,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
  const all=hd.hole.hazards(me,{corridor_m:40*0.9144,max:99}).map(h=>({id:h.id,cls:h.cls,front:Math.round(h.reach/0.9144),carry:Math.round(h.carry/0.9144),reachYd:h.reach/0.9144,
    inside:h.cls==='water'&&inRing(me,hd.hole.feats.find(f=>f.id===h.id).uv),txt:Math.round(h.reach/0.9144)+' · '+Math.round(h.carry/0.9144)}));
  const pond=hd.hole.feats.find(f=>f.id==='H02-WA-01');
  const labels=[...document.querySelectorAll('#ov .lbl')].map(g=>[...g.querySelectorAll('text')].map(t=>t.textContent));
  return {view:S.view,img:document.getElementById('img').getAttribute('src'),min:document.querySelector('.yard').classList.contains('min'),
   F:vis('yF'),C:vis('yC'),B:vis('yB'),txt:['yF','yC','yB'].map(i=>document.getElementById(i).textContent),
   engine:(r=>[r.front,r.center,r.back].map(String))(P.course.readout(2,S.me,'sim',null,null)),
   hzLabels:labels.filter(l=>/(bunker|pond) front · carry/.test(l[1]||'')).map(l=>l[0]+' '+l[1].split(' ')[0]),all,inPond:inRing(me,pond.uv),
   table:[...document.querySelectorAll('#haz tr')].slice(1).map(tr=>[...tr.querySelectorAll('td.n')].map(td=>td.textContent).join(' · ')).filter(Boolean),
   tags:document.querySelectorAll('#haz .tag').length,
   me:document.getElementById('ov').innerHTML.includes('#1d6fe0')||document.getElementById('ov').innerHTML.includes('▼ You'),
   box:S.box?[S.box.x,S.box.y,S.box.w,S.box.h].map(v=>+v.toFixed(3)):null,tf:document.getElementById('img').style.transform,vb:document.getElementById('ov').getAttribute('viewBox'),
   nav:['prev','next','autoBtn','vTee','vApp','tFly','tGreen','tScore'].every(vis)}});
const nm=h=>h.txt+' '+(h.cls==='water'?'pond':'bunker');
(async()=>{const b=await chromium.launch(),pn=await open(b,8811),po=await open(b,8812);
 const pts={};for(const d of DIST)pts[d]=await pn.evaluate(([f,d])=>eval(f)(2,d),[findPt.toString(),d]);
 ok('test spots found (header centre exactly '+DIST.join('/')+')',DIST.every(d=>pts[d]),DIST.map(d=>!!pts[d]));
 // start from the Green tee via the SIMULATE panel, then Move Me down the hole
 await pn.click('#simBtn');await pn.click('#presets button:first-child');await pn.waitForTimeout(250);
 for(const d of DIST){
  const mv=await moveMe(pn,pts[d]);await pn.waitForTimeout(250);if(!ok(d+' yd: Move Me placed the golfer (simulated) on the spot',mv&&mv.mode==='sim'&&mv.errYd<3,mv))continue;
  const a=await state(pn),c=+a.txt[1],far=c>250,T=d+' yd (Move Me, centre '+c+'): ';
  await pn.evaluate(()=>window.scrollTo(0,0));await pn.screenshot({path:path.join(SHOTS,'hole02_moveme_'+d+'yd.png')});
  const expect=a.all.filter(h=>h.reachYd<=250&&!h.inside).slice(0,3);
  R.rows.push({d,centre:c,how:mv.how,view:a.view,header:a.min?'centre only':'front/centre/back',inPond:a.inPond,labels:a.hzLabels,hazardsAhead:a.all.map(h=>nm(h)+(h.inside?' (you are inside it)':'')),dot:a.me});
  ok(T+'header centre = V2.3.1 engine',a.txt.join()===a.engine.join()&&c===d,a.txt);
  ok(T+(far?'centre only (front/back hidden)':'front/centre/back shown'),far?(a.min&&a.C&&!a.F&&!a.B):(!a.min&&a.C&&a.F&&a.B),{min:a.min,F:a.F,B:a.B});
  ok(T+'labels = hazards ahead whose near edge is ≤250 yd from the golfer (max 3, nearest first)',JSON.stringify(a.hzLabels)===JSON.stringify(expect.map(nm)),{labels:a.hzLabels,expected:expect.map(nm),ahead:a.all.map(nm)});
  ok(T+'no label beyond 250 yd from the golfer',a.all.filter(h=>h.reachYd>250).every(h=>!a.hzLabels.includes(nm(h))));
  ok(T+'hazard table and UNVERIFIED warnings unchanged',a.table.length===a.all.slice(0,4).length&&a.tags===a.table.length);
  // previous release at the same spot and view: zoom and table identical
  await asSim(po,mv.me,mv.view,mv.manual);await po.waitForTimeout(200);const o=await state(po);
  ok(T+'zoom and hazard table identical to previous release',JSON.stringify(a.box)===JSON.stringify(o.box)&&a.tf===o.tf&&a.vb===o.vb&&JSON.stringify(a.table)===JSON.stringify(o.table)&&a.view===o.view&&a.me===o.me&&a.nav,{box:a.box,before:o.box});
  // live GPS at the same spot: same rule, same labels and header
  const keep={view:a.view};await asLive(pn,mv.me);await pn.waitForTimeout(700);const l=await state(pn);
  ok(T+'live GPS shows the same header and hazard labels',l.txt.join()===a.txt.join()&&l.min===a.min&&JSON.stringify(l.hzLabels)===JSON.stringify(a.hzLabels),{live:l.hzLabels,moveMe:a.hzLabels});
  await pn.evaluate(()=>{__play.gps.stop(true)});await asSim(pn,mv.me,keep.view,mv.manual);await pn.waitForTimeout(150);
 }
 const row=d=>R.rows.find(r=>r.d===d)||{labels:[],hazardsAhead:[]};
 ok('golfer-to-hazard, not green distance: at 261 the pond is labelled although the green is >250',row(261).header==='centre only'&&row(261).labels.some(x=>/pond$/.test(x)),row(261));
 ok('golfer-to-hazard, not green distance: at 250 the back bunker (>250 from the golfer) is not labelled although the green is ≤250',row(250).header==='front/centre/back'&&row(250).labels.every(x=>!/^2[5-9]\d|^3\d\d/.test(x)),row(250));
 ok('inside the mapped pond (60 yd): no pond front · carry label',row(60).inPond&&!row(60).labels.some(x=>/pond$/.test(x)),row(60));
 ok('pond behind the golfer (40 yd): not listed or labelled',!row(40).hazardsAhead.some(x=>/pond/.test(x))&&!row(40).labels.some(x=>/pond$/.test(x)),row(40));
 // tap-to-measure in both modes (beyond and inside 250)
 for(const d of [300,200]){await asSim(pn,pts[d],'tee',false);await pn.waitForTimeout(200);
  const t=await pn.evaluate(()=>{const st=document.getElementById('stage').getBoundingClientRect();document.getElementById('stage').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:st.left+st.width*0.5,clientY:st.top+st.height*0.45}));
   return {target:!!__play.S.target,label:[...document.querySelectorAll('#ov .lbl text')].some(x=>/to green$/.test(x.textContent))}});
  ok('tap-to-measure works at '+d+' yd',t.target&&t.label,t)}
 // manual Tee / Approach switching
 await asSim(pn,pts[300],'tee',false);await pn.waitForTimeout(200);await pn.click('#vApp');let v=await state(pn);const v1=v.view==='approach'&&/approach/.test(v.img)&&v.min;
 await asSim(pn,pts[300],'tee',true);await pn.waitForTimeout(200);await pn.click('#vApp');await pn.click('#vTee');v=await state(pn);
 ok('manual Tee/Approach switching preserved (beyond 250: header stays centre-only)',v1&&v.view==='tee'&&/tee/.test(v.img),{v1});
 // SIMULATE collapse
 const sim=async()=>pn.evaluate(()=>({btn:!simBtn.hidden&&simBtn.offsetParent!==null,txt:simBtn.textContent,exp:simBtn.getAttribute('aria-expanded'),box:simBox.offsetParent!==null,chips:[...document.querySelectorAll('#presets button')].map(b=>b.textContent)}));
 await pn.evaluate(()=>__play.goHole(2,true));await pn.waitForTimeout(200);if(await pn.isVisible('#presets'))await pn.click('#simBtn');const c0=await sim();
 await pn.click('#simBtn');const c1=await sim();
 await pn.click('#presets button:first-child');await pn.waitForTimeout(200);const sp=await pn.evaluate(()=>({tag:srcTag.textContent,me:!!__play.S.me}));
 await pn.click('#simBtn');const c2=await sim();
 await pn.evaluate(()=>__play.goHole(1,true));await pn.waitForTimeout(500);const h1=await sim();
 ok('SIMULATE starts collapsed on Hole 2',c0.btn&&/^SIMULATE/.test(c0.txt)&&!c0.box&&c0.exp==='false',c0);
 ok('SIMULATE expands and shows every simulation button',c1.box&&c1.exp==='true'&&/▾/.test(c1.txt)&&c1.chips.length>=7,c1);
 ok('simulated position still works from the expanded panel',sp.tag==='SIMULATED'&&sp.me,sp);
 ok('SIMULATE collapses again',!c2.box&&c2.exp==='false',c2);
 ok('other holes unchanged: no SIMULATE button, controls shown as before (Hole 1)',!h1.btn&&h1.box,h1);
 // other holes byte-identical overlay/header/table to the previous release
 const other=[];for(const n of [1,3,9,14]){for(const d of [300,200,100]){const out=[];for(const pg of [pn,po]){await pg.evaluate(n=>__play.goHole(n,true),n);await pg.waitForTimeout(500);
   out.push(await pg.evaluate(([n,d,f])=>{const p=eval(f)(n,d);if(!p)return null;const S=__play.S;S.mode='sim';S.me=p;S.target=null;S.viewManual=false;__play.render();
    return [document.getElementById('ov').innerHTML,['yF','yC','yB'].map(i=>document.getElementById(i).textContent).join(),document.getElementById('haz').innerHTML,document.querySelector('.yard').className,document.getElementById('img').style.transform].join('|')},[n,d,findPt.toString()]))}
  if(out[0]!==null)other.push([n,d,out[0]===out[1]])}}
 ok('Holes 1, 3, 9, 14: overlay, header, hazard table and zoom identical to previous release',other.every(x=>x[2]),other);
 // navigation and scorekeeping
 await pn.evaluate(()=>__play.goHole(2,true));await pn.click('#next');const nx=await pn.evaluate(()=>__play.R().hole);await pn.click('#prev');const pv=await pn.evaluate(()=>__play.R().hole);
 await pn.click('#tScore');await pn.click('#sPlus');await pn.click('#sPlus');await pn.click('#pPlus');const sc=await pn.evaluate(()=>({s:strokes.textContent,p:putts.textContent,saved:JSON.parse(localStorage.getItem('pocasset_v3:round')).holes[1]}));
 await pn.click('#tGreen');const gr=await pn.evaluate(()=>!pGreen.hidden&&document.querySelector('#greenHost img,#greenHost canvas,#greenHost svg')!==null);await pn.click('#tFly');
 ok('navigation: Next/Prev move between holes',nx===3&&pv===2,{nx,pv});
 ok('scorekeeping on Hole 2: strokes/putts counted and saved',sc.saved.strokes!=null&&sc.saved.putts!=null&&sc.s===String(sc.saved.strokes)&&sc.p===String(sc.saved.putts),sc);
 ok('GREEN tab still shows the approved green',gr);
 ok('no page errors',!R.errors.length,R.errors);
 await b.close();s1.close();s2.close();R.pass=Object.values(R.checks).every(c=>c.pass);
 fs.writeFileSync(path.join(SHOTS,'test_minimal_result.json'),JSON.stringify(R,null,1));
 R.rows.forEach(r=>console.log(r.d+' yd (centre '+r.centre+', '+r.how+'): header '+r.header+' | labels '+JSON.stringify(r.labels)+' | ahead '+JSON.stringify(r.hazardsAhead)+(r.inPond?' | golfer inside mapped pond':'')));
 console.log(JSON.stringify({pass:R.pass,checks:Object.keys(R.checks).length,failed:Object.keys(R.checks).filter(k=>!R.checks[k].pass)}));process.exit(R.pass?0:1);
})();
