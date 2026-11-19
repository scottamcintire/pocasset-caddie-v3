// Minimalist display, Phase 1 (Hole 2 only, v5.3.0) — node tests/test_minimal.js
// Compares the new /play/ (prototype/play) with the previous published /play/ (OLD_PLAY, default: gh-pages checkout)
// at simulated centre distances 300/251/250/200/100/60 yd on Hole 2, in simulated AND live GPS mode.
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),NEW=path.join(ROOT,'prototype','play'),OLD=process.env.OLD_PLAY||'/home/claude/pocasset-caddie-v3/play';
const SHOTS=path.join(ROOT,'prototype','screenshots_minimal');fs.mkdirSync(SHOTS,{recursive:true});
const R={checks:{},rows:[],errors:[]};function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));return !!p}
const serve=(dir,port)=>http.createServer((q,res)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(port);
const s1=serve(NEW,8811),s2=serve(OLD,8812),DIST=[300,251,250,200,100,60];
// a point on Hole N's playing line whose header centre yardage (V2.3.1 engine) is exactly `yd`
const findPt=(n,yd)=>{const c=__play.course;let lo=Math.max(0,yd-15),hi=yd+15;for(let k=0;k<60;k++){const m=(lo+hi)/2,q=c.alongFromGreen(n,m);if(!q){hi=m;continue}if(c.readout(n,q,'sim',null,null).center<yd)lo=m;else hi=m}const q=c.alongFromGreen(n,hi);return q&&c.readout(n,q,'sim',null,null).center===yd?q:null};
async function open(b,port){const pg=await (await b.newContext({...devices['iPhone 13']})).newPage();pg.on('pageerror',e=>R.errors.push(port+': '+e.message));
 await pg.goto('http://localhost:'+port+'/');await pg.waitForTimeout(400);await pg.click('#teeGo');await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(700);return pg}
// put the golfer at a point, simulated or as a live GPS fix
async function place(pg,pt,mode){await pg.evaluate(([p,m])=>{const P=__play,S=P.S;S.target=null;S.viewManual=false;
  if(m==='live'){P.prefs.autoHole=false;P.fix(p[0],p[1],5)}else{if(P.gps.wanted())P.gps.stop(true);S.mode='sim';S.me=p;S.acc=null;S.meLabel='TEST';P.render()}},[pt,mode]);await pg.waitForTimeout(mode==='live'?700:250)}
const state=pg=>pg.evaluate(()=>{const P=__play,S=P.S,hd=P.HD[2],me=hd.hole.frame.toUV(S.me[0],S.me[1]),vis=id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null&&getComputedStyle(e).display!=='none'};
  const hz=hd.hole.hazards(me,{corridor_m:40*0.9144,max:99}).map(h=>Math.round(h.reach/0.9144)+' · '+Math.round(h.carry/0.9144));
  const labels=[...document.querySelectorAll('#ov .lbl')].map(g=>[...g.querySelectorAll('text')].map(t=>t.textContent));
  const hzl=labels.filter(l=>/(bunker|pond) front · carry/.test(l[1]||'')).map(l=>l[0]);
  return {view:S.view,img:document.getElementById('img').getAttribute('src'),min:document.querySelector('.yard').classList.contains('min'),
   F:vis('yF'),C:vis('yC'),B:vis('yB'),txt:['yF','yC','yB'].map(i=>document.getElementById(i).textContent),
   engine:(r=>[r.front,r.center,r.back].map(String))(P.course.readout(2,S.me,'sim',null,null)),hzLabels:hzl,hzAll:hz,
   table:[...document.querySelectorAll('#haz tr')].slice(1).map(tr=>[...tr.querySelectorAll('td.n')].map(td=>td.textContent).join(' · ')).filter(Boolean),
   me:document.getElementById('ov').innerHTML.includes('#1d6fe0')||document.getElementById('ov').innerHTML.includes('▼ You'),
   box:S.box?[S.box.x,S.box.y,S.box.w,S.box.h].map(v=>+v.toFixed(3)):null,tf:document.getElementById('img').style.transform,vb:document.getElementById('ov').getAttribute('viewBox'),
   nav:['prev','next','autoBtn','vTee','vApp','tFly','tGreen','tScore'].every(vis)}});
(async()=>{const b=await chromium.launch(),pn=await open(b,8811),po=await open(b,8812);
 const pts={};for(const d of DIST)pts[d]=await pn.evaluate(([f,d])=>eval(f)(2,d),[findPt.toString(),d]);
 ok('test points found (header centre exactly 300/251/250/200/100/60)',DIST.every(d=>pts[d]),DIST.map(d=>!!pts[d]));
 for(const mode of ['sim','live'])for(const d of DIST){
  await place(pn,pts[d],mode);await place(po,pts[d],mode);const a=await state(pn),o=await state(po),far=d>250,T=mode+' '+d+' yd: ';
  if(mode==='sim'){await pn.evaluate(()=>window.scrollTo(0,0));await pn.screenshot({path:path.join(SHOTS,'hole02_'+d+'yd.png')})}
  R.rows.push({mode,d,view:a.view,dot:a.me,header:a.min?'center only':'front/center/back',hzLabels:a.hzLabels,hazardsAhead:a.hzAll.length,table:a.table.length,zoomBox:a.box});
  ok(T+'header centre = '+d,a.txt[1]===String(d)&&a.txt.join()===a.engine.join(),a.txt);
  ok(T+(far?'centre only (front/back hidden)':'front/centre/back shown'),far?(a.min&&a.C&&!a.F&&!a.B):(!a.min&&a.C&&a.F&&a.B),{min:a.min,F:a.F,C:a.C,B:a.B});
  ok(T+(far?'no hazard labels on the flyover':'≤3 hazard labels, nearest hazards ahead'),far?a.hzLabels.length===0:(a.hzLabels.length<=3&&a.hzLabels.length===Math.min(3,a.hzAll.length)&&a.hzLabels.every(l=>a.hzAll.slice(0,3).includes(l))),{labels:a.hzLabels,ahead:a.hzAll});
  ok(T+'hazard table below the picture unchanged',JSON.stringify(a.table)===JSON.stringify(o.table),{now:a.table,before:o.table});
  ok(T+'zoom unchanged (box, image transform, overlay viewBox = previous release)',JSON.stringify(a.box)===JSON.stringify(o.box)&&a.tf===o.tf&&a.vb===o.vb,{now:a.box,before:o.box});
  ok(T+'same automatic view, picture and blue-dot marker as before; nav controls present',a.view===o.view&&a.img===o.img&&a.me===o.me&&a.nav,{view:a.view,before:o.view,me:a.me,meBefore:o.me,nav:a.nav});
 }
 // tap-to-measure in both modes (beyond and inside 250)
 for(const d of [300,200]){await place(pn,pts[d],'sim');
  const t=await pn.evaluate(()=>{const st=document.getElementById('stage').getBoundingClientRect();document.getElementById('stage').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:st.left+st.width*0.5,clientY:st.top+st.height*0.45}));
   return {target:!!__play.S.target,label:[...document.querySelectorAll('#ov .lbl text')].some(x=>/to green$/.test(x.textContent))}});
  ok('tap-to-measure works at '+d+' yd',t.target&&t.label,t)}
 // manual Tee / Approach switching
 await place(pn,pts[300],'sim');await pn.click('#vApp');let v=await state(pn);const v1=v.view==='approach'&&/approach/.test(v.img)&&v.min;
 await place(pn,pts[300],'sim');await pn.evaluate(()=>{__play.S.viewManual=true});await pn.click('#vApp');await pn.click('#vTee');v=await state(pn);
 ok('manual Tee/Approach switching preserved (beyond 250: header stays centre-only)',v1&&v.view==='tee'&&/tee/.test(v.img),{v1});
 // SIMULATE collapse
 const sim=async()=>pn.evaluate(()=>({btn:!simBtn.hidden&&simBtn.offsetParent!==null,txt:simBtn.textContent,exp:simBtn.getAttribute('aria-expanded'),box:simBox.offsetParent!==null,chips:[...document.querySelectorAll('#presets button')].map(b=>b.textContent)}));
 await pn.evaluate(()=>__play.goHole(2,true));await pn.waitForTimeout(200);const c0=await sim();
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
 R.rows.filter(r=>r.mode==='sim').forEach(r=>console.log(r.d+' yd: '+r.view+' view | blue dot '+(r.dot?'shown':'off-picture')+' | header '+r.header+' | hazard labels '+JSON.stringify(r.hzLabels)+' of '+r.hazardsAhead+' ahead | zoom box '+JSON.stringify(r.zoomBox)));
 console.log(JSON.stringify({pass:R.pass,checks:Object.keys(R.checks).length,failed:Object.keys(R.checks).filter(k=>!R.checks[k].pass)}));process.exit(R.pass?0:1);
})();
