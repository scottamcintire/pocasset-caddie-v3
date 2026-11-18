// GPS zoom (Phase 1, Hole 2 only) — node tests/test_zoom.js
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'prototype','play'),SHOTS=path.join(ROOT,'prototype','screenshots_zoom');
fs.mkdirSync(SHOTS,{recursive:true});
const R={checks:{},errors:[]};function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''))}
const s=http.createServer((q,res)=>{let f=path.join(DIR,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(8796);
(async()=>{const b=await chromium.launch(),pg=await (await b.newContext({...devices['iPhone 13']})).newPage();
 pg.on('pageerror',e=>R.errors.push(e.message));
 await pg.goto('http://localhost:8796/?dev=1');await pg.waitForTimeout(400);await pg.click('#teeGo');
 await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(800);
 const chips=await pg.evaluate(()=>[...document.querySelectorAll('#presets button')].map(b=>b.textContent));
 ok('dev chips present on Hole 2 with ?dev=1',['DEV 150','DEV 75','DEV 50','DEV 25','DEV 10','DEV beyond 10'].every(c=>chips.includes(c)),chips);
 // measure one position
 async function measure(label){
  await pg.evaluate(l=>{[...document.querySelectorAll('#presets button')].find(b=>b.textContent===l).click()},label);await pg.waitForTimeout(300);
  return pg.evaluate(()=>{const P=__play,S=P.S,hd=P.HD[2],v=hd.views[S.view],box=S.box||{x:0,y:0,w:v.width,h:v.height};
   const st=document.getElementById('stage').getBoundingClientRect(),img=document.getElementById('img').getBoundingClientRect();
   const me=hd.hole.frame.toUV(S.me[0],S.me[1]),g=v.V.project(hd.hole.centerUV[0],hd.hole.centerUV[1]),m=v.V.project(me[0],me[1]);
   // screen position of an image pixel through the IMAGE transform, and of the SVG centre marker through the viewBox
   const viaImg=p=>[img.left+p[0]/v.width*img.width,img.top+p[1]/v.height*img.height];
   const circ=[...document.querySelectorAll('#ov circle')].map(c=>c.getBoundingClientRect()).map(r=>[r.left+r.width/2,r.top+r.height/2]);
   const mi=m?viaImg(m):null,meC=[...document.querySelectorAll('#ov circle')].filter(c=>c.getAttribute('fill')==='#1d6fe0').map(c=>c.getBoundingClientRect()).map(r=>[r.left+r.width/2,r.top+r.height/2])[0];
   const gi=viaImg(g),near=Math.min(...circ.map(c=>Math.hypot(c[0]-gi[0],c[1]-gi[1])));
   const inside=(p,mg)=>p[0]>=box.x+mg*box.w&&p[0]<=box.x+box.w*(1-mg)&&p[1]>=box.y+mg*box.h&&p[1]<=box.y+box.h*(1-mg);
   const r=P.course.readout(2,S.me,'sim',null,null),hz=hd.hole.hazards(me,{corridor_m:40*0.9144,max:4}).map(h=>[Math.round(h.reach/0.9144),Math.round(h.carry/0.9144)]);
   const rows=[...document.querySelectorAll('#haz tr')].slice(1).map(tr=>[...tr.querySelectorAll('td.n')].map(td=>+td.textContent)).filter(x=>x.length);
   const lbls=[...document.querySelectorAll('#ov .lbl rect')].map(e=>e.getBoundingClientRect());
   const gy=g[1],my=m?m[1]:null;
   return {meAboveGreenPx:my!==null?+(gy-my).toFixed(1):null,edge:+P.edgeYards(2,S.me).toFixed(1),zoomYd:+S.zoom.yd.toFixed(1),meMarkerPx:mi&&meC?+Math.hypot(mi[0]-meC[0],mi[1]-meC[1]).toFixed(3):null,view:S.view,z:+(v.width/box.w).toFixed(3),header:[+yF.textContent,+yC.textContent,+yB.textContent],engine:[r.front,r.center,r.back],
    hzTable:rows,hzCalc:hz,greenInside:inside(g,0.05),meInside:!!m&&inside(m,0.02),pillShown:document.getElementById('ov').innerHTML.includes('▼ You'),
    alignPx:+near.toFixed(3),labelsInStage:lbls.every(l=>l.left>=st.left-0.5&&l.right<=st.right+0.5&&l.top>=st.top-0.5&&l.bottom<=st.bottom+0.5),labels:lbls.length,
    labelFontPx:(()=>{const t=document.querySelector('#ov .lbl text');return t?+t.getBoundingClientRect().height.toFixed(1):null})()}});
 }
 const res={};
 for(const L of ['DEV 150','DEV 75','DEV 50','DEV 25','DEV 10','DEV beyond 10']){res[L]=await measure(L);await pg.evaluate(()=>window.scrollTo(0,document.getElementById('stage').getBoundingClientRect().top+window.scrollY-260));await pg.screenshot({path:path.join(SHOTS,L.replace(' ','_')+'.png')})}
 R.positions=res;
 ok('DEV buttons are nearest-edge distances (±1 yd) and drive the zoom',[150,75,50,25,10].every(y=>Math.abs(res['DEV '+y].edge-y)<=1&&res['DEV '+y].zoomYd===res['DEV '+y].edge)&&Math.abs(res['DEV beyond 10'].edge-10)<=1,Object.fromEntries(Object.entries(res).map(([k,r])=>[k,[r.edge,r.zoomYd]])));
 ok('blue golfer marker sits exactly on the simulated position (< 1 px), or the "You" pill when off the picture',Object.values(res).every(r=>(r.meMarkerPx!==null&&r.meMarkerPx<1)||(r.meMarkerPx===null&&r.pillShown)),Object.fromEntries(Object.entries(res).map(([k,r])=>[k,r.meMarkerPx])));
 ok('beyond the green: 10 yd from the back edge, marker drawn beyond the green (above it in the approach view)',Math.abs(res['DEV beyond 10'].edge-10)<=1&&res['DEV beyond 10'].meAboveGreenPx>0,{edge:res['DEV beyond 10'].edge,meAboveGreenPx:res['DEV beyond 10'].meAboveGreenPx,header:res['DEV beyond 10'].header});
 const zs=['DEV 150','DEV 75','DEV 50','DEV 25','DEV 10'].map(l=>res[l].z);
 ok('zoom rises smoothly as the golfer nears the green (150→10 yd)',zs.every((z,i)=>i===0||z>=zs[i-1])&&zs[0]===1,zs);
 ok('success criterion: visibly closer at 25 yd than at 50 yd (≥ 1.15×)',res['DEV 25'].z/res['DEV 50'].z>=1.15,[res['DEV 50'].z,res['DEV 25'].z]);
 ok('green stays inside the visible area at every distance (5% margin)',Object.values(res).every(r=>r.greenInside),Object.fromEntries(Object.entries(res).map(([k,r])=>[k,r.greenInside])));
 ok('golfer marker visible (on screen, or the "You" pill)',Object.values(res).every(r=>r.meInside||r.pillShown));
 ok('overlay marks stay on the image: green centre marker within 1 px of the image pixel',Object.values(res).every(r=>r.alignPx<1),Object.fromEntries(Object.entries(res).map(([k,r])=>[k,r.alignPx])));
 ok('labels stay inside the picture',Object.values(res).every(r=>r.labelsInStage));
 ok('label text keeps its on-screen size when zoomed (±10%)',Object.values(res).every(r=>!r.labelFontPx||Math.abs(r.labelFontPx/res['DEV 150'].labelFontPx-1)<0.1),Object.values(res).map(r=>r.labelFontPx));
 ok('front/centre/back unchanged (header = V2.3.1 engine) at every distance',Object.values(res).every(r=>r.header.join()===r.engine.join()),Object.fromEntries(Object.entries(res).map(([k,r])=>[k,r.header])));
 ok('hazard table unchanged (= hazard calculation)',Object.values(res).every(r=>JSON.stringify(r.hzTable)===JSON.stringify(r.hzCalc)));
 ok('beyond the green: front/centre/back = the unchanged V2.3.1 readout (near edge first), green visible',res['DEV beyond 10'].header.join()===res['DEV beyond 10'].engine.join()&&res['DEV beyond 10'].greenInside,res['DEV beyond 10'].header);
 // live GPS: jitter at a standing position → no zoom change; walking in 55 → 25 yd → zoom rises
 const live=await pg.evaluate(async()=>{const P=__play,c=P.course;P.prefs.autoHole=false;
  const p55=c.alongFromGreen(2,55),p25=c.alongFromGreen(2,25),zs=[],boxes=new Set();let seed=1;const rnd=()=>((seed=seed*16807%2147483647)/2147483647-0.5);
  for(let i=0;i<20;i++){P.fix(p55[0]+rnd()*6e-5,p55[1]+rnd()*4.5e-5,6);await new Promise(r=>setTimeout(r,60));zs.push(P.S.zoom.z);boxes.add(P.S.zoom.z.toFixed(3))}
  const still=[...boxes];const walk=[];for(let i=0;i<=12;i++){const t=i/12;P.fix(p55[0]+(p25[0]-p55[0])*t,p55[1]+(p25[1]-p55[1])*t,5);await new Promise(r=>setTimeout(r,80));walk.push(+P.S.zoom.z.toFixed(2))}
  await new Promise(r=>setTimeout(r,600));const end=+(P.S.box?P.HD[2].views[P.S.view].width/P.S.box.w:1).toFixed(2);P.gps.stop(true);return {still,walk,end}});
 ok('live GPS jitter (±3 m) at a standing spot does not change the zoom',live.still.length===1,live.still);
 ok('live walk 55 → 25 yd zooms in smoothly',live.walk[live.walk.length-1]>live.walk[0]&&live.end>1.5,live);
 // other holes unchanged: no zoom, no transform
 await pg.evaluate(()=>__play.goHole(1,true));await pg.waitForTimeout(800);
 await pg.evaluate(()=>{[...document.querySelectorAll('#presets button')].find(b=>/60 yd/.test(b.textContent)).click()});await pg.waitForTimeout(200);
 const h1=await pg.evaluate(()=>({t:document.getElementById('img').style.transform,vb:document.getElementById('ov').getAttribute('viewBox'),dev:[...document.querySelectorAll('#presets button')].some(b=>/^DEV/.test(b.textContent))}));
 ok('Hole 1 (not in the test) keeps fixed framing and no DEV chips',h1.t===''&&/^0 0 /.test(h1.vb)&&!h1.dev,h1);
 const pg2=await (await b.newContext({...devices['iPhone 13']})).newPage();await pg2.goto('http://localhost:8796/');await pg2.waitForTimeout(300);await pg2.click('#teeGo');await pg2.evaluate(()=>__play.goHole(2,true));await pg2.waitForTimeout(700);
 ok('DEV chips hidden without ?dev=1',!(await pg2.evaluate(()=>[...document.querySelectorAll('#presets button')].some(b=>/^DEV/.test(b.textContent)))));
 ok('no page errors',!R.errors.length,R.errors);
 await b.close();s.close();R.pass=Object.values(R.checks).every(c=>c.pass);fs.writeFileSync(path.join(SHOTS,'test_zoom_result.json'),JSON.stringify(R,null,1));
 console.log(JSON.stringify({pass:R.pass,failed:Object.keys(R.checks).filter(k=>!R.checks[k].pass)}));process.exit(R.pass?0:1);
})();
