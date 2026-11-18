// GPS zoom (nearest-green-edge distance) on every flyover hole — node tests/test_zoom.js   (HOLES=2,5 to limit)
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'prototype','play'),SHOTS=path.join(ROOT,'prototype','screenshots_zoom');
fs.mkdirSync(SHOTS,{recursive:true});
const R={checks:{},holes:{},errors:[]};function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};if(!p||process.env.VERBOSE)console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));return !!p}
const DIST=[150,75,50,25,10],BEY='DEV beyond 15';
const s=http.createServer((q,res)=>{let f=path.join(DIR,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(8796);
(async()=>{const b=await chromium.launch(),pg=await (await b.newContext({...devices['iPhone 13']})).newPage();
 pg.on('pageerror',e=>R.errors.push(e.message));
 await pg.goto('http://localhost:8796/?dev=1');await pg.waitForTimeout(400);await pg.click('#teeGo');
 const HOLES=process.env.HOLES?process.env.HOLES.split(',').map(Number):await pg.evaluate(()=>COURSE.flyover_holes);
 async function measure(n,label){
  await pg.evaluate(l=>{[...document.querySelectorAll('#presets button')].find(b=>b.textContent===l).click()},label);await pg.waitForTimeout(250);
  return pg.evaluate(n=>{const P=__play,S=P.S,hd=P.HD[n],v=hd.views[S.view],box=S.box||{x:0,y:0,w:v.width,h:v.height};
   const st=document.getElementById('stage').getBoundingClientRect(),img=document.getElementById('img').getBoundingClientRect();
   const me=hd.hole.frame.toUV(S.me[0],S.me[1]),g=v.V.project(hd.hole.centerUV[0],hd.hole.centerUV[1]),m=v.V.project(me[0],me[1]);
   const viaImg=p=>[img.left+p[0]/v.width*img.width,img.top+p[1]/v.height*img.height];
   const circ=[...document.querySelectorAll('#ov circle')].map(c=>c.getBoundingClientRect()).map(r=>[r.left+r.width/2,r.top+r.height/2]);
   const meC=[...document.querySelectorAll('#ov circle')].filter(c=>c.getAttribute('fill')==='#1d6fe0').map(c=>c.getBoundingClientRect()).map(r=>[r.left+r.width/2,r.top+r.height/2])[0];
   const gi=viaImg(g),mi=m?viaImg(m):null;
   const inside=(p,mg)=>p[0]>=box.x+mg*box.w&&p[0]<=box.x+box.w*(1-mg)&&p[1]>=box.y+mg*box.h&&p[1]<=box.y+box.h*(1-mg);
   const r=P.course.readout(n,S.me,'sim',null,null),hz=hd.hole.hazards(me,{corridor_m:40*0.9144,max:4}).map(h=>[Math.round(h.reach/0.9144),Math.round(h.carry/0.9144)]);
   const rows=[...document.querySelectorAll('#haz tr')].slice(1).map(tr=>[...tr.querySelectorAll('td.n')].map(td=>+td.textContent)).filter(x=>x.length);
   const lbls=[...document.querySelectorAll('#ov .lbl rect')].map(e=>e.getBoundingClientRect());const t=document.querySelector('#ov .lbl text');
   return {view:S.view,z:+(v.width/box.w).toFixed(3),edge:+P.edgeYards(n,S.me).toFixed(1),zoomYd:+S.zoom.yd.toFixed(1),
    header:[+yF.textContent,+yC.textContent,+yB.textContent],engine:[r.front,r.center,r.back],hzTable:rows,hzCalc:hz,
    greenInside:inside(g,0.05),meInside:!!m&&inside(m,0.02),pill:document.getElementById('ov').innerHTML.includes('▼ You'),
    alignPx:+Math.min(...circ.map(c=>Math.hypot(c[0]-gi[0],c[1]-gi[1]))).toFixed(3),meMarkerPx:mi&&meC?+Math.hypot(mi[0]-meC[0],mi[1]-meC[1]).toFixed(3):null,
    meAboveGreen:m?g[1]-m[1]:null,labelsIn:lbls.every(l=>l.left>=st.left-0.5&&l.right<=st.right+0.5&&l.top>=st.top-0.5&&l.bottom<=st.bottom+0.5),
    font:t?+t.getBoundingClientRect().height.toFixed(1):null}},n);
 }
 for(const n of HOLES){
  await pg.evaluate(n=>__play.goHole(n,true),n);await pg.waitForTimeout(700);
  const chips=await pg.evaluate(()=>[...document.querySelectorAll('#presets button')].map(b=>b.textContent));
  const len=await pg.evaluate(n=>{const c=__play.course,L=c.pathLengthYd(n);let m=0;for(let d=0;d<=L;d+=1){const q=c.alongFromGreen(n,d);if(q)m=Math.max(m,__play.edgeYards(n,q))}return m},n);   // farthest nearest-edge distance on the hole
  const labels=DIST.map(y=>'DEV '+y).concat([BEY]),res={},na=[];
  for(const L of labels){if(!chips.includes(L)){na.push(L);continue}res[L]=await measure(n,L);
   if(L==='DEV 25'||L===BEY){await pg.evaluate(()=>window.scrollTo(0,document.getElementById('stage').getBoundingClientRect().top+window.scrollY-260));await pg.screenshot({path:path.join(SHOTS,'h'+String(n).padStart(2,'0')+'_'+L.replace(/ /g,'_')+'.png')})}}
  const H='H'+n+' ',E=Object.entries(res),V=Object.values(res),fails=[];const chk=(name,p,d)=>{if(!ok(H+name,p,d))fails.push(name)};
  chk('DEV buttons present (missing only where the hole never reaches that edge distance)',na.every(L=>L!==BEY&&+L.split(' ')[1]>len-1),{na,maxEdgeYd:Math.round(len)});
  chk('edge distance = button (±1 yd) and drives the zoom',E.every(([k,r])=>Math.abs(r.edge-(k===BEY?15:+k.split(' ')[1]))<=1&&r.zoomYd===r.edge),E.map(([k,r])=>[k,r.edge]));
  chk('golfer marker on its position (<1 px) or "You" pill',V.every(r=>(r.meMarkerPx!==null&&r.meMarkerPx<1)||(r.meMarkerPx===null&&r.pill)));
  chk('green inside the visible area whenever zoomed',V.every(r=>r.z<=1||r.greenInside),E.filter(([k,r])=>r.z>1&&!r.greenInside).map(([k])=>k));
  const unz=E.filter(([k,r])=>r.z<=1&&!r.greenInside).map(([k])=>k);   // unzoomed = existing approved framing: report, don't fail
  chk('overlay aligned with image (<1 px)',V.every(r=>r.alignPx<1));
  chk('labels inside the picture',V.every(r=>r.labelsIn),E.filter(([k,r])=>!r.labelsIn).map(([k])=>k));
  chk('label size constant',V.every(r=>!r.font||Math.abs(r.font/V[0].font-1)<0.1));
  chk('front/centre/back = V2.3.1 engine',V.every(r=>r.header.join()===r.engine.join()));
  chk('hazard table = hazard calculation',V.every(r=>JSON.stringify(r.hzTable)===JSON.stringify(r.hzCalc)));
  const zs=DIST.filter(y=>res['DEV '+y]).map(y=>res['DEV '+y].z);
  chk('zoom never decreases as the golfer approaches',zs.every((z,i)=>i===0||z>=zs[i-1]-1e-6),zs);
  chk('beyond the green: 15 yd from the back edge, marker beyond the green',res[BEY]&&Math.abs(res[BEY].edge-15)<=1&&res[BEY].meAboveGreen>0,res[BEY]&&{edge:res[BEY].edge,above:res[BEY].meAboveGreen});
  const z50=res['DEV 50']&&res['DEV 50'].z,z25=res['DEV 25']&&res['DEV 25'].z;
  R.holes[n]={pass:!fails.length,fails,view25:res['DEV 25']&&res['DEV 25'].view,zoom:Object.fromEntries(E.map(([k,r])=>[k.replace('DEV ',''),r.z])),na,
   flag:unz.length?'unzoomed framing (unchanged from v5.0): green within 5% of the picture edge at '+unz.join(', '):'',note:z50&&z25&&z25/z50<1.1?'zoom at 25 yd only '+(z25/z50).toFixed(2)+'x of 50 yd (golfer kept in frame)':''};
 }
 // live GPS on Hole 2 (approved behaviour): jitter → no change; walk 55 → 25 yd → zooms in
 await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(500);
 const live=await pg.evaluate(async()=>{const P=__play,c=P.course;P.prefs.autoHole=false;
  const p55=c.alongFromGreen(2,55),p25=c.alongFromGreen(2,25),still=new Set();let seed=1;const rnd=()=>((seed=seed*16807%2147483647)/2147483647-0.5);
  for(let i=0;i<20;i++){P.fix(p55[0]+rnd()*6e-5,p55[1]+rnd()*4.5e-5,6);await new Promise(r=>setTimeout(r,60));still.add(P.S.zoom.z.toFixed(3))}
  const walk=[];for(let i=0;i<=12;i++){const t=i/12;P.fix(p55[0]+(p25[0]-p55[0])*t,p55[1]+(p25[1]-p55[1])*t,5);await new Promise(r=>setTimeout(r,80));walk.push(+P.S.zoom.z.toFixed(2))}
  P.gps.stop(true);return {still:[...still],walk}});
 ok('live GPS jitter (±3 m) does not change the zoom (Hole 2)',live.still.length===1,live.still);
 ok('live walk 55 → 25 yd zooms in smoothly (Hole 2)',live.walk[live.walk.length-1]>live.walk[0],live.walk);
 const pg2=await (await b.newContext({...devices['iPhone 13']})).newPage();await pg2.goto('http://localhost:8796/');await pg2.waitForTimeout(300);await pg2.click('#teeGo');await pg2.evaluate(()=>__play.goHole(2,true));await pg2.waitForTimeout(700);
 ok('DEV buttons hidden without ?dev=1',!(await pg2.evaluate(()=>[...document.querySelectorAll('#presets button')].some(b=>/^DEV/.test(b.textContent)))));
 ok('no page errors',!R.errors.length,R.errors);
 await b.close();s.close();R.pass=Object.values(R.checks).every(c=>c.pass);fs.writeFileSync(path.join(SHOTS,'test_zoom_result.json'),JSON.stringify(R,null,1));
 for(const [n,h] of Object.entries(R.holes))console.log('Hole '+n+': '+(h.pass?'PASS':'FAIL '+h.fails.join('; '))+' | zoom '+JSON.stringify(h.zoom)+(h.na.length?' | n/a '+h.na.join(','):'')+(h.note?' | NOTE '+h.note:'')+(h.flag?' | FLAG '+h.flag:''));
 console.log(JSON.stringify({pass:R.pass,checks:Object.keys(R.checks).length,failed:Object.keys(R.checks).filter(k=>!R.checks[k].pass)}));process.exit(R.pass?0:1);
})();
