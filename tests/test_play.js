// Integrated /play/ page release tests (Playwright, iPhone 13).  Run: node tests/test_play.js
// Compares against production V2.3.1 run from a READ-ONLY local copy, each app in its own browser context.
//  A. GPS front/center/back + flag: play == V2.3.1 at points on all 18 holes (and off course); flyover overlay == header (Holes 1-9)
//  B. Automatic hole: same hole chosen after every fix on a walk through all 18 holes
//  C. EZLocator: same flag position on the approved green and same pin lon/lat as V2.3.1, all 18 holes
//  D. Approved greens: all 18 images byte-identical to the master checksums; the page shows those files
//  E. Hazards (Holes 1-9): reach/carry from each mapped tee == build-time reference tables
//  F. Scoring: strokes/putts/totals identical to V2.3.1 for the same taps; scorecard table and CSV
//  G. Tee choice: Green default, Blue at start, Gold mid-round, all persisted across reloads (V3 prefs/round)
//  H. Simulated positions: labelled; unmapped Green tee stated, never substituted
//  I. GPS controller: permission denied, weak-signal retry, away-from-course, resume after reload
//  J. Storage isolation: a full V3 session leaves V2.3.1's saved round and pins byte-identical; V3 writes only pocasset_v3:*
//  K. All nine flyovers load and draw in /play/
const {chromium,devices}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),http=require('http');
const ROOT=path.resolve(__dirname,'..'),PLAY=path.join(ROOT,'prototype','play'),SHOTS=path.join(ROOT,'prototype','screenshots_play');
const PROD=process.env.PROD_V231||'/home/claude/pocasset_caddie/index.html';
const R={errors:[],checks:{}};function ok(name,pass,detail){R.checks[name]={pass:!!pass,detail};console.error((pass?'PASS ':'FAIL ')+name+(detail!==undefined?' '+JSON.stringify(detail).slice(0,300):''))}
function serve(dir,port){return new Promise(r=>{const s=http.createServer((q,res)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(port,()=>r(s))})}
const FAKE_GEO=`(()=>{const w={};let id=0;window.__geo={w,opens:0,send(lon,lat,acc){for(const k in w)w[k].ok({coords:{longitude:lon,latitude:lat,accuracy:acc==null?5:acc}})},fail(code){for(const k in w)w[k].err({code,message:'x'})}};
 Object.defineProperty(navigator,'geolocation',{value:{watchPosition(ok,err){id++;w[id]={ok,err};window.__geo.opens++;return id},clearWatch(i){delete w[i]},getCurrentPosition(){}}});})()`;
(async()=>{
 fs.mkdirSync(SHOTS,{recursive:true});
 const prodSha=crypto.createHash('sha256').update(fs.readFileSync(PROD)).digest('hex');R.v231={file:PROD,sha256:prodSha};
 const srv=await serve(PLAY,8781),URL='http://localhost:8781/';
 const b=await chromium.launch();
 async function newPlay(init){const ctx=await b.newContext({...devices['iPhone 13']});if(init)await ctx.addInitScript(init);const pg=await ctx.newPage();
  pg.on('pageerror',e=>R.errors.push('play: '+e.message));pg.on('console',m=>{if(m.type()==='error')R.errors.push('play: '+m.text())});
  await pg.goto(URL);await pg.waitForTimeout(500);return {ctx,pg}}
 const pc=await b.newContext({...devices['iPhone 13']}),pp=await pc.newPage();pp.on('pageerror',e=>R.errors.push('v231: '+e.message));
 await pp.goto('file://'+PROD);await pp.waitForTimeout(500);

 // ---------- main play session
 let {ctx,pg}=await newPlay(FAKE_GEO);
 ok('G1 tee modal opens with Green preselected (default)',await pg.evaluate(()=>document.getElementById('teeModal').classList.contains('open')&&document.querySelector('.teebtn.on').dataset.t==='Green'));
 await pg.click('#teeGo');await pg.waitForTimeout(300);
 // A. GPS readouts vs V2.3.1
 const pts=await pg.evaluate(()=>{const c=__play.course,o=[];for(let n=1;n<=18;n++){const L=c.pathLengthYd(n);for(let y=10;y<L;y+=Math.max(12,L/14)){const p=c.alongFromGreen(n,y);if(!p)continue;for(const dx of [-22,0,22]){const q=[p[0]+dx/(111320*Math.cos(p[1]*Math.PI/180)),p[1]];o.push([n,q])}}}
  o.push([1,[-71.0589,42.3601]],[9,[-70.70,41.70]]);return o});
 const PIN={front:12,edge:6,side:'R',depth:28};
 const play=await pg.evaluate(([pts,PIN])=>{const out=[];for(let n=1;n<=18;n++){const d=__play.pins.depthFor(n);__play.pins.set(n,Math.min(PIN.front,d-2),PIN.edge,PIN.side,d)}
  for(const [n,p] of pts){const r=__play.course.readout(n,p,'live',5,__play.pins.todayPinLL(n));out.push(r.onCourse?[r.front,r.center,r.back,r.flag]:['—','—','—','—'])}return out},[pts,PIN]);
 const prod=await pp.evaluate(([pts,PIN])=>{const out=[];for(let n=1;n<=18;n++){const d=depthFor(n);PINS.pins[n]={front:Math.min(PIN.front,d-2),edge:PIN.edge,side:PIN.side,depth:d}}
  for(const [n,p] of pts){state.hole=n;state.autoHole=false;gpsMode='live';gpsPoint={point:p,accuracy:5};renderGps();out.push([gpsFront.textContent,gpsMiddle.textContent,gpsBack.textContent,gpsPin.textContent].map(x=>x==='—'?x:Number(x)))}return out},[pts,PIN]);
 const mm=play.map((a,i)=>a.join()===prod[i].join()?null:[i,pts[i][0],a,prod[i]]).filter(Boolean);
 ok('A1 front/center/back/flag identical to V2.3.1 ('+pts.length+' positions, 18 holes, incl. off-course)',!mm.length,mm.slice(0,5));
 ok('A2 off-course positions blank (live)',play[play.length-1][1]==='—'&&play[play.length-2][1]==='—');
 // header DOM shows the same numbers after a live fix
 await pg.evaluate(()=>{__play.prefs.autoHole=false});
 const dom=await pg.evaluate(p=>{__play.goHole(4,false);__play.fix(p[0],p[1],5);return ['yF','yC','yB'].map(i=>+document.getElementById(i).textContent)},pts.find(x=>x[0]===4)[1]);
 const i4=pts.findIndex(x=>x[0]===4);ok('A3 header shows the V2.3.1 numbers after a live fix',dom.join()===prod[i4].slice(0,3).join(),[dom,prod[i4]]);
 // flyover overlay (V3 hole model) agrees with the header (V2.3.1 engine) on Holes 1-9
 let fly=[];for(let n=1;n<=9;n++){await pg.evaluate(n=>__play.goHole(n,false),n);await pg.waitForTimeout(400);
  fly=fly.concat(await pg.evaluate(([pts,n])=>{const hd=__play.HD[n];return pts.filter(x=>x[0]===n).map(([_,p])=>{const f=hd.hole.greenFCB(hd.hole.frame.toUV(p[0],p[1])),r=__play.course.readout(n,p,'sim',0,null);return [[f.front,f.center,f.back].map(m=>Math.round(m/0.9144)).join(),[r.front,r.center,r.back].join()]})},[pts,n]))}
 const fm=fly.filter(x=>x[0]!==x[1]);ok('A4 flyover overlay yardages == header yardages, Holes 1-9 ('+fly.length+' positions)',!fm.length,fm.slice(0,5));

 // B. automatic hole on a walk through the course
 const walk=await pg.evaluate(()=>{const c=__play.course,o=[];for(let n=1;n<=18;n++){const P=c.HOLE_PATHS[n].concat([c.GREEN_MAP[n].center]);for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],m=Math.hypot((b[0]-a[0])*83000,(b[1]-a[1])*111000),k=Math.max(1,Math.round(m/15));for(let j=0;j<k;j++)o.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}}return o});
 const aPlay=await pg.evaluate(w=>{__play.prefs.autoHole=true;__play.auto.reset();__play.goHole(1,false);__play.prefs.autoHole=true;return w.map(p=>{__play.fix(p[0],p[1],5);return __play.R().hole})},walk);
 const aProd=await pp.evaluate(w=>{state.hole=1;state.autoHole=true;stableHole=0;stableCount=0;return w.map(p=>{__app.setGps(p[0],p[1]);return state.hole})},walk);
 const am=aPlay.map((h,i)=>h===aProd[i]?null:[i,h,aProd[i]]).filter(Boolean);
 ok('B1 automatic hole identical to V2.3.1 after each of '+walk.length+' fixes',!am.length,am.slice(0,5));
 ok('B2 automatic selection reached hole 18 and visited all holes',new Set(aPlay).size===18,[...new Set(aPlay)]);
 await pg.evaluate(()=>{__play.gps.stop(true)});

 // C. EZLocator placement vs V2.3.1
 const pinsT=[];for(let n=1;n<=18;n++)for(const f of [0.1,0.5,0.85])for(const e of [3,6])for(const s of ['L','R'])pinsT.push([n,{frac:f,edge:e,side:s}]);
 const cPlay=await pg.evaluate(T=>T.map(([n,q])=>{const M=COURSE.greens[n-1],d=M.depth,p={front:Math.round(q.frac*d),edge:q.edge,side:q.side,depth:d},r=PGreen.placePin(M,p);return r.px?[r.px[0],r.px[1]].concat(PCaddie.uv2ll(M,r.uv[0],r.uv[1])):[r.err]}),pinsT);
 const cProd=await pp.evaluate(T=>T.map(([n,q])=>{const M=GREENS[n-1],d=M.depth,p={front:Math.round(q.frac*d),edge:q.edge,side:q.side,depth:d},r=placePin(M,p);return r.px?[r.px[0],r.px[1],r.ll[0],r.ll[1]]:[r.err]}),pinsT);
 const cm=cPlay.map((a,i)=>a.length===cProd[i].length&&a.every((v,k)=>typeof v==='string'?v===cProd[i][k]:Math.abs(v-cProd[i][k])<1e-9)?null:[pinsT[i],a,cProd[i]]).filter(Boolean);
 ok('C1 EZLocator pin placement identical to V2.3.1 ('+pinsT.length+' pins, 18 greens)',!cm.length,cm.slice(0,3));
 // the flag drawn on the green tab sits at V2.3.1's position
 await pg.evaluate(()=>__play.setTab('green'));const fl=[];
 for(let n=1;n<=18;n++){await pg.evaluate(n=>__play.goHole(n,false),n);await pg.waitForTimeout(60);
  const a=await pg.evaluate(()=>{const f=document.querySelector('#greenHost #flag');return f&&[f.dataset.x,f.dataset.y,document.querySelector('#greenHost img').getAttribute('src')]});
  const p=await pp.evaluate(n=>{state.hole=n;render();const f=document.getElementById('flag');return f&&[f.dataset.x,f.dataset.y]},n);fl.push([n,a,p])}
 ok('C2 flag drawn at the V2.3.1 position on all 18 greens',fl.every(([n,a,p])=>a&&p&&a[0]===p[0]&&a[1]===p[1]),fl.filter(([n,a,p])=>!(a&&p&&a[0]===p[0]&&a[1]===p[1])));
 // D. approved images
 const man=JSON.parse(fs.readFileSync(path.join(ROOT,'data/greens/approved_manifest.json'))).files;const dimg=[];
 for(const [n,a] of fl){const f=path.join(PLAY,a[2]),h=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),e=man.find(m=>m.path==='03_greens/hole_'+String(n).padStart(2,'0')+'/approved/'+path.basename(f));dimg.push([n,path.basename(f),!!e&&e.sha256===h])}
 ok('D1 all 18 approved greens shown byte-identical to the master checksums',dimg.every(x=>x[2]),dimg.filter(x=>!x[2]));
 await pg.evaluate(()=>{__play.goHole(2,false)});await pg.waitForTimeout(150);await pg.screenshot({path:path.join(SHOTS,'3_green_today_pin.png')});

 // E. hazards from mapped tees vs build-time references
 const hzBad=[];let hzN=0;
 for(let n=1;n<=9;n++){const HH=String(n).padStart(2,'0'),ref=fs.readFileSync(path.join(ROOT,'data/holes/hole'+HH+'/checks/check_report.md'),'utf8');
  await pg.evaluate(n=>__play.goHole(n,false),n);await pg.waitForTimeout(300);
  const hz=await pg.evaluate(n=>{const h=__play.HD[n].hole,r={};for(const t of __play.HD[n].tees){r[t.id]=h.hazards(t.uv,{corridor_m:1e6,max:99}).map(z=>[z.id,Math.floor(z.reach/0.9144),Math.floor(z.carry/0.9144)])}return r},n);
  for(const [tee,list] of Object.entries(hz))for(const [id,re,ca] of list){hzN++;const m=ref.match(new RegExp('\\| '+tee+' \\| '+id+' \\([^)]*\\) \\| reach (\\d+) · carry (\\d+)'));if(!(m&&+m[1]===re&&+m[2]===ca))hzBad.push([tee,id,re,ca,m&&m.slice(1)])}}
 ok('E1 hazard reach/carry from every mapped tee == build-time reference ('+hzN+' checks, Holes 1-9)',!hzBad.length&&hzN>0,hzBad.slice(0,5));
 const hzLive=await pg.evaluate(()=>{__play.setTab('fly');__play.goHole(5,false);return 1});await pg.waitForTimeout(300);
 const live5=await pg.evaluate(()=>{const c=__play.course,p=c.alongFromGreen(5,150);__play.fix(p[0],p[1],4);const hd=__play.HD[5],uv=hd.hole.frame.toUV(p[0],p[1]),hz=hd.hole.hazards(uv,{corridor_m:40*0.9144,max:4});
  const rows=[...document.querySelectorAll('#haz tr')].slice(1).map(tr=>[...tr.querySelectorAll('td.n')].map(td=>+td.textContent));return {rows,hz:hz.map(h=>[Math.round(h.reach/0.9144),Math.round(h.carry/0.9144)]),tags:document.querySelectorAll('#haz .tag').length}});
 ok('E2 hazard table follows the live position and marks hazards UNVERIFIED',JSON.stringify(live5.rows)===JSON.stringify(live5.hz)&&live5.tags===live5.hz.length,live5);
 await pg.screenshot({path:path.join(SHOTS,'1_flyover_live_150.png')});
 await pg.evaluate(()=>__play.gps.stop(true));

 // F. scoring vs V2.3.1
 const ops=[];for(let n=1;n<=18;n++){const k=(n*7)%5;ops.push([n,'strokes',1]);for(let j=0;j<k;j++)ops.push([n,'strokes',j%3===2?-1:1]);ops.push([n,'putts',n%3===0?-1:1]);if(n%4===0)ops.push([n,'putts',1])}
 await pg.evaluate(()=>__play.setTab('score'));
 for(const [n,f,d] of ops.slice(0,6)){await pg.evaluate(n=>__play.goHole(n,false),n);await pg.click({strokes:{'1':'#sPlus','-1':'#sMinus'},putts:{'1':'#pPlus','-1':'#pMinus'}}[f][String(d)])}
 await pg.evaluate(ops=>{for(const [n,f,d] of ops){PCaddie.adjust(__play.R(),n,f,d,__play.card.par)}__play.render()},ops.slice(6));
 for(const [n,fw] of [[1,'hit'],[2,'left'],[4,'hit'],[5,'right'],[7,'hit']]){await pg.evaluate(n=>__play.goHole(n,false),n);await pg.selectOption('#fairway',fw)}
 const sPlay=await pg.evaluate(()=>{__play.render();return {holes:__play.R().holes.map(h=>[h.strokes,h.putts]),t:[tStrokes.textContent,tPar.textContent,tPutts.textContent,tFw.textContent]}});
 const sProd=await pp.evaluate(ops=>{state.holes=Array.from({length:18},()=>({strokes:null,putts:null,fairway:'',notes:'',pin:''}));for(const [n,f,d] of ops){state.hole=n;adjust(f,d)}render();return {holes:state.holes.map(h=>[h.strokes,h.putts]),t:[total.textContent,relative.textContent,puttTotal.textContent]}},ops);
 ok('F1 strokes and putts identical to V2.3.1 for the same '+ops.length+' taps',JSON.stringify(sPlay.holes)===JSON.stringify(sProd.holes));
 ok('F2 totals identical (strokes, to par, putts)',sPlay.t.slice(0,3).join()===sProd.t.join(),[sPlay.t,sProd.t]);
 ok('F3 fairways stat counts par 4/5 tee shots (3 hit of 5 recorded)',sPlay.t[3]==='3/5',sPlay.t[3]);
 const table=await pg.evaluate(()=>[...document.querySelectorAll('#scTable tr.sum')].map(tr=>[...tr.children].map(td=>td.textContent)));
 const exp=s=>s.filter(x=>x!==null).reduce((a,b)=>a+b,0);const outS=exp(sProd.holes.slice(0,9).map(h=>h[0])),inS=exp(sProd.holes.slice(9).map(h=>h[0]));
 ok('F4 scorecard OUT/IN/TOT rows (par 36/36/72, Green 2,994/2,992/5,986 provisional)',table[0].join()===['OUT','36','2994',String(outS),table[0][4]].join()&&table[1][2]==='2992'&&table[2][1]==='72'&&table[2][2]==='5986'&&table[2][3]===String(outS+inS),table);
 const csv=await pg.evaluate(()=>PCaddie.csv(__play.R(),__play.card.par,__play.card.yards('Green'),'newer card (provisional)'));
 ok('F5 CSV has 18 holes with V2.3.1 columns + yardage source',csv.split('\r\n').length===19&&csv.startsWith('"Date","Tee","Hole","Par","Tee Yards","Strokes","Putts","Fairway","Pin Notes","Hole Notes","Yardage source"'));
 await pg.evaluate(()=>window.scrollTo(0,0));await pg.screenshot({path:path.join(SHOTS,'4_score.png')});

 // J (part 1). seed V2.3.1's real saved data into this origin, then run more V3 actions incl. copy pins and finish round
 await pp.evaluate(()=>{for(let n=1;n<=5;n++)PINS.pins[n]={front:10+n,edge:4,side:'L',depth:depthFor(n),entered:'x'};savePins();save()});
 const v231={round:await pp.evaluate(()=>localStorage.getItem('pocasset_caddie_v1')),pins:await pp.evaluate(()=>localStorage.getItem('pocasset_pins_v1'))};
 await pg.evaluate(v=>{localStorage.setItem('pocasset_caddie_v1',v.round);localStorage.setItem('pocasset_pins_v1',v.pins)},v231);
 await pg.reload();await pg.waitForTimeout(500);
 await pg.evaluate(()=>__play.setTab('green'));await pg.click('#copyPins');await pg.waitForTimeout(100);
 const copied=await pg.evaluate(()=>[1,2,3,4,5].map(n=>__play.pins.P.pins[n]&&__play.pins.P.pins[n].front));
 ok('J1 "Copy today\'s pins from V2.3.1" copies them into V3 (read only)',copied.join()==='11,12,13,14,15',copied);
 await pg.fill('#inFront','9');await pg.fill('#inEdge','5');await pg.click('#sideR');
 await pg.evaluate(()=>{__play.setTab('score')});await pg.fill('#notes','test note');
 pg.once('dialog',d=>d.accept());await pg.click('#finish');await pg.waitForTimeout(200);
 const hist=await pg.evaluate(()=>JSON.parse(localStorage.getItem('pocasset_v3:history')||'[]').length);
 ok('F6 finished round saved to V3 history; new-round tee screen opens',hist===1&&await pg.evaluate(()=>document.getElementById('teeModal').classList.contains('open')));
 await pg.click('#teeGo');
 const after={round:await pg.evaluate(()=>localStorage.getItem('pocasset_caddie_v1')),pins:await pg.evaluate(()=>localStorage.getItem('pocasset_pins_v1'))};
 ok('J2 V2.3.1 saved round byte-identical after a full V3 session',after.round===v231.round&&!!v231.round);
 ok('J3 V2.3.1 pins byte-identical after a full V3 session',after.pins===v231.pins&&!!v231.pins);
 const keys=await pg.evaluate(()=>Object.keys(localStorage));
 ok('J4 V3 wrote only pocasset_v3: keys',keys.filter(k=>!k.startsWith('pocasset_v3:')).sort().join()==='pocasset_caddie_v1,pocasset_pins_v1',keys);
 await ctx.close();

 // G. tee choice & persistence
 ({ctx,pg}=await newPlay());
 await pg.click('.teebtn[data-t="Blue"]');await pg.click('#teeGo');await pg.waitForTimeout(200);
 let g=await pg.evaluate(()=>document.getElementById('cardTxt').textContent);ok('G2 Blue chosen at start shows Blue card yardage (H1 470, provisional)',/Blue tee 470 yd/.test(g)&&/PROVISIONAL/.test(await pg.evaluate(()=>provTag.textContent)),g);
 await pg.reload();await pg.waitForTimeout(400);
 g=await pg.evaluate(()=>({t:cardTxt.textContent,modal:teeModal.classList.contains('open'),p:JSON.parse(localStorage.getItem('pocasset_v3:prefs')).tee,r:JSON.parse(localStorage.getItem('pocasset_v3:round')).tee}));
 ok('G3 Blue persists after reload (prefs + round), round resumes without the start screen',/Blue/.test(g.t)&&!g.modal&&g.p==='Blue'&&g.r==='Blue',g);
 await pg.evaluate(()=>{__play.goHole(3,true)});const s3=await pg.evaluate(()=>__play.R().holes[0]);
 await pg.click('#cardBtn');await pg.click('.teebtn[data-t="Gold"]');await pg.click('#teeGo');await pg.reload();await pg.waitForTimeout(400);
 g=await pg.evaluate(()=>({t:cardTxt.textContent,p:JSON.parse(localStorage.getItem('pocasset_v3:prefs')).tee,r:__play.R().tee,h:__play.R().hole,src:provTag.textContent}));
 ok('G4 tee changed mid-round to Gold persists; hole kept; Gold uses the published card',/Gold tee 170 yd/.test(g.t)&&g.p==='Gold'&&g.r==='Gold'&&g.h===3&&/PUBLISHED/.test(g.src),g);
 // live GPS distances do not depend on the tee
 const gi=await pg.evaluate(()=>{const p=__play.course.alongFromGreen(3,120);const a=__play.course.readout(3,p,'live',5,null);return a.center});
 ok('G5 GPS distance independent of the selected tee',gi===await pg.evaluate(()=>{__play.prefs.tee='Silver';const p=__play.course.alongFromGreen(3,120);return __play.course.readout(3,p,'live',5,null).center}));
 await ctx.close();

 // H. simulated positions & unmapped tees
 ({ctx,pg}=await newPlay());await pg.click('#teeGo');await pg.evaluate(()=>__play.goHole(6,true));await pg.waitForTimeout(500);
 const h6=await pg.evaluate(()=>({chips:[...document.querySelectorAll('#presets button')].map(b=>b.textContent),note:teeNote.textContent}));
 ok('H1 Hole 6: Green tee not mapped is stated; no Green tee start; Gold labelled simulated',!h6.chips.includes('Green tee')&&/Green tee position isn’t mapped/.test(h6.note)&&h6.chips.includes('Gold tee (sim)'),h6);
 await pg.click('#presets button:first-child');await pg.waitForTimeout(150);
 const st=await pg.evaluate(()=>({tag:srcTag.textContent,status:gpsStatus.textContent,kind:liveKind.textContent}));
 ok('H2 simulated Gold start says so (tag, status, header)',st.tag==='SIMULATED'&&/SIMULATED from the Gold tee — not your tee/.test(st.status)&&st.kind==='SIMULATED',st);
 await pg.evaluate(()=>window.scrollTo(0,0));await pg.screenshot({path:path.join(SHOTS,'5_hole6_sim_gold.png')});
 await pg.evaluate(()=>__play.goHole(14,true));await pg.waitForTimeout(150);
 const h14=await pg.evaluate(()=>({chips:[...document.querySelectorAll('#presets button')].map(b=>b.textContent),nf:noFly.textContent}));
 ok('H3 Hole 14 (no flyover): playing-line start labelled "not a tee"; hazards stated as not mapped',h14.chips[0]==='Line start (not a tee)'&&/not mapped yet/.test(h14.nf),h14);
 await pg.click('#presets button:first-child');await pg.evaluate(()=>window.scrollTo(0,0));await pg.screenshot({path:path.join(SHOTS,'6_hole14_no_flyover.png')});
 // K. nine flyovers in /play/
 const K9=[];for(let n=1;n<=9;n++){await pg.evaluate(n=>{__play.goHole(n,true)},n);await pg.waitForTimeout(500);await pg.click('#presets button:first-child');await pg.waitForTimeout(300);
  K9.push(await pg.evaluate(n=>{const i=document.getElementById('img');return [n,i.complete&&i.naturalWidth>0,document.getElementById('ov').innerHTML.length>200,!flyWrap.hidden]},n));
  if(n===8){await pg.evaluate(()=>window.scrollTo(0,0));await pg.screenshot({path:path.join(SHOTS,'2_hole8_tee.png')})}}
 ok('K1 all nine flyovers load and draw overlays in /play/',K9.every(x=>x[1]&&x[2]&&x[3]),K9);
 await ctx.close();

 // I. GPS controller behaviour (fake iPhone location)
 ({ctx,pg}=await newPlay(FAKE_GEO));await pg.click('#teeGo');
 await pg.click('#gpsBtn');let gs=await pg.evaluate(()=>gpsStatus.textContent);ok('I1 start asks for location',/Requesting iPhone location/.test(gs),gs);
 const p1=await pg.evaluate(()=>__play.course.alongFromGreen(1,200));await pg.evaluate(p=>__geo.send(p[0],p[1],6),p1);await pg.waitForTimeout(100);
 gs=await pg.evaluate(()=>({s:gpsStatus.textContent,tag:srcTag.textContent,c:yC.textContent,btn:gpsBtn.textContent}));ok('I2 live fix shows LIVE, accuracy and yardage',/LIVE GPS · accuracy approximately ±7 yd/.test(gs.s)&&/LIVE ±7/.test(gs.tag)&&+gs.c>150&&gs.btn==='Stop GPS',gs);
 await pg.evaluate(()=>__geo.fail(2));gs=await pg.evaluate(()=>({s:gpsStatus.textContent,c:yC.textContent}));ok('I3 weak signal keeps GPS on and last yardages, retries',/Weak GPS signal — retrying/.test(gs.s)&&gs.c!=='—',gs);
 await pg.waitForTimeout(3300);ok('I4 watch reopened after 3 s',await pg.evaluate(()=>__geo.opens>=2));
 await pg.evaluate(()=>__geo.send(-71.0589,42.3601,8));gs=await pg.evaluate(()=>({s:gpsStatus.textContent,c:yC.textContent}));ok('I5 away from the course: no yardages, says so',gs.c==='—'&&/away from Pocasset/.test(gs.s),gs);
 await pg.reload();await pg.waitForTimeout(400);gs=await pg.evaluate(()=>({s:gpsStatus.textContent,o:__geo.opens}));ok('I6 GPS resumes after reload (within 3 h)',/Resuming live GPS/.test(gs.s)&&gs.o===1,gs);
 await pg.evaluate(()=>__geo.fail(1));gs=await pg.evaluate(()=>({s:gpsStatus.textContent,b:gpsBtn.textContent,on:JSON.parse(localStorage.getItem('pocasset_v3:gps')).on}));
 ok('I7 permission denied: stops and shows iPhone settings help',/permission denied/.test(gs.s)&&/Settings → Privacy/.test(gs.s)&&gs.on===false&&gs.b==='Start live GPS',gs);
 await ctx.close();

 await b.close();srv.close();
 ok('Z1 no page errors',!R.errors.length,R.errors.slice(0,5));
 R.pass=Object.values(R.checks).every(c=>c.pass);
 fs.writeFileSync(path.join(SHOTS,'test_play_result.json'),JSON.stringify(R,null,1));
 console.log(JSON.stringify({pass:R.pass,checks:Object.keys(R.checks).length,failed:Object.entries(R.checks).filter(([k,v])=>!v.pass).map(([k])=>k)}));
 process.exit(R.pass?0:1);
})();
