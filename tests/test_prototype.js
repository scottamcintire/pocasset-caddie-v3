// V3 per-hole release tests (Playwright, iPhone 13). Run: HOLE=4 node tests/test_prototype.js   (default HOLE=2)
// 1. Green front/center/back identical to production at 60 positions: the V2.3.1 production page (baseline) AND the
//    archived V2.2.1 page, each run side by side in its own browser context (read-only local copies; nothing deployed).
// 2. Hazard reach/carry from the mapped tees equal the build-time reference (checks/check_report.md).
// 3. Overlay alignment: green outline projected in the browser (camera matrix + terrain) equals the Python renderer's
//    projection; tap -> ground -> picture round trip within 0.5 px.
// 4. Approved green image in the prototype is byte-identical to the master checksum.
// 5. No storage writes outside the pocasset_v3: prefix; no console errors. Screenshots for review.
const {chromium,devices}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),http=require('http');
const HOLE=+(process.env.HOLE||2),HH=String(HOLE).padStart(2,'0');
const ROOT=path.resolve(__dirname,'..'),PROTO=path.join(ROOT,'prototype','hole'+HH),SHOTS=path.join(ROOT,'prototype',process.env.SHOTS_DIR||(HOLE===2?'screenshots':'screenshots_hole'+HH));
const PRODS={'V2.3.1':process.env.PROD_V231||'/home/claude/pocasset_caddie/index.html','V2.2.1':process.env.PROD_V221||'/home/claude/app/v221_original.html'};
const {execFileSync}=require('child_process');
function serve(dir,port){return new Promise(r=>{const s=http.createServer((q,res)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)){res.writeHead(404);return res.end()}const ext=path.extname(f);res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(port,()=>r(s))})}
(async()=>{
 fs.mkdirSync(SHOTS,{recursive:true});
 const out={errors:[]},s1=await serve(PROTO,8771);
 const b=await chromium.launch(),ctx=await b.newContext({...devices['iPhone 13']}),pg=await ctx.newPage();
 pg.on('pageerror',e=>out.errors.push(e.message));pg.on('console',m=>{if(m.type()==='error')out.errors.push(m.text())});
 await pg.goto('http://localhost:8771/');await pg.waitForTimeout(600);
 // positions: along the line and off to the sides, as lon/lat
 const pts=await pg.evaluate(()=>{const h=__proto.hole,o=[];let L=0;for(const t of window.HOLEDATA.hole.tees){const f=h.feats.find(x=>x.id===t.feature_id);if(f){const c=PGeo.centroid(f.uv);L=Math.max(L,Math.hypot(c[0],c[1]))}}L=Math.min(470,(L||470)+10);
  const st=Math.max(5,Math.floor((L-20)/20));for(let y=20;y<=L;y+=st){const p=h.alongFromGreen(y);for(const dx of [-25,0,25]){if(o.length<60)o.push(h.frame.toLonLat(p[0]+dx,p[1]))}}return o});
 const v3=await pg.evaluate(pts=>pts.map(ll=>{const h=__proto.hole,uv=h.frame.toUV(ll[0],ll[1]),f=h.greenFCB(uv);return [f.front,f.center,f.back].map(m=>Math.round(m/0.9144))}),pts);
 // production pages, same points (each in its own context so their storage never touches the prototype's)
 out.green_fcb={};
 for(const [name,file] of Object.entries(PRODS)){
  out.green_fcb[name]={file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
  const pc=await b.newContext({...devices['iPhone 13']}),pp=await pc.newPage();await pp.goto('file://'+file);await pp.waitForTimeout(500);
  const prod=await pp.evaluate(([pts,HOLE])=>pts.map(ll=>{state.hole=HOLE;state.autoHole=false;gpsMode='demo';gpsPoint={point:ll,accuracy:0};renderGps();return [gpsFront.textContent,gpsMiddle.textContent,gpsBack.textContent].map(Number)}),[pts,HOLE]);
  out.green_fcb[name].compared=v3.length;out.green_fcb[name].mismatches=v3.map((a,i)=>a.join()===prod[i].join()?null:[i,a,prod[i]]).filter(Boolean);
  await pc.close();
 }
 // hazards from tees vs the build-time reference table
 const ref=fs.readFileSync(path.join(ROOT,'data/holes/hole'+HH+'/checks/check_report.md'),'utf8');
 const hz=await pg.evaluate(()=>{const h=__proto.hole,r={};for(const t of window.HOLEDATA.hole.tees){const f=h.feats.find(x=>x.id===t.feature_id),c=PGeo.centroid(f.uv);r[t.feature_id]=h.hazards(c,{corridor_m:1e6,max:99}).map(z=>[z.id,Math.floor(z.reach/0.9144),Math.floor(z.carry/0.9144)])}for(const t of (window.HOLEDATA.hole.tee_positions||[])){const c=h.frame.toUV(t.lonlat[0],t.lonlat[1]);r[t.id]=h.hazards(c,{corridor_m:1e6,max:99}).map(z=>[z.id,Math.floor(z.reach/0.9144),Math.floor(z.carry/0.9144)])}return r});
 out.hazard_checks=[];for(const [tee,list] of Object.entries(hz))for(const [id,re,ca] of list){const m=ref.match(new RegExp('\\| '+tee+' \\| '+id+' \\([^)]*\\) \\| reach (\\d+) · carry (\\d+)'));out.hazard_checks.push([tee,id,re,ca,m?+m[1]:null,m?+m[2]:null,m&&+m[1]===re&&+m[2]===ca])}
 // alignment: browser projection (camera matrix + terrain) of the green ring and tee centres == Python renderer math
 out.alignment={};
 for(const view of ['tee','approach']){
  const uvs=await pg.evaluate(()=>{const h=__proto.hole;return h.green.concat(h.feats.filter(f=>f.cls==='tee'||f.cls==='bunker').map(f=>PGeo.centroid(f.uv)))});
  const brow=await pg.evaluate(([uvs,view])=>uvs.map(q=>__proto.views[view].V.project(q[0],q[1])),[uvs,view]);
  const py=JSON.parse(execFileSync('python3',['-c',`
import json,sys,numpy as np
sys.path.insert(0,'tools'); from render_flyover import TerrainLookup
pj=json.load(open('data/holes/hole${HH}/render/hole${HH}_${view}.json')); T=TerrainLookup(json.load(open('data/holes/hole${HH}/terrain.json')))
M=np.array(pj['camera_matrix']); hm=pj['height_model']; out=[]
for u,v in json.loads(sys.argv[1]):
    z=(float(T.h(u,v))-hm['z_ref_m'])*hm['vertical_exaggeration']; h=M@[u,v,z,1]; out.append([h[0]/h[2],h[1]/h[2]] if h[2]>0 else None)
print(json.dumps(out))`,JSON.stringify(uvs)],{cwd:ROOT}).toString());
  const d=brow.map((p,i)=>p&&py[i]?Math.hypot(p[0]-py[i][0],p[1]-py[i][1]):0);
  // round trip: picture -> ground -> picture for points on the hole that are on screen
  const rt=await pg.evaluate(([uvs,view])=>{const V=__proto.views[view].V,W=__proto.views[view].width,H=__proto.views[view].height;return uvs.map(q=>{const p=V.project(q[0],q[1]);if(!p||p[0]<0||p[1]<0||p[0]>W||p[1]>H)return null;const g=V.unproject(p[0],p[1]);if(!g)return 99;const p2=V.project(g[0],g[1]);return Math.hypot(p2[0]-p[0],p2[1]-p[1])}).filter(x=>x!=null)},[uvs,view]);
  out.alignment[view]={points:uvs.length,max_px_vs_python:Math.max(...d),roundtrip_points:rt.length,roundtrip_max_px:Math.max(...rt)};
 }
 // approved green byte check
 const gimg=fs.readdirSync(path.join(PROTO,'img')).find(f=>/^Pocasset_Hole\d\d_Green_\d+x\d+\.png$/.test(f)&&f.startsWith('Pocasset_Hole'+HH));
 const man=JSON.parse(fs.readFileSync(path.join(ROOT,'data/greens/approved_manifest.json'))).files.find(f=>path.basename(f.path)===gimg);
 out.green_image={file:gimg,manifest_entry:man?man.path:null};
 out.green_image_identical=!!man&&crypto.createHash('sha256').update(fs.readFileSync(path.join(PROTO,'img',gimg))).digest('hex')===man.sha256;
 // screenshots
 const shot=async n=>{await pg.waitForTimeout(250);await pg.screenshot({path:path.join(SHOTS,n+'.png')})};
 await pg.evaluate(()=>window.scrollTo(0,0));await shot('1_tee_view_green_tee');
 await pg.evaluate(()=>{const h=__proto.hole;__proto.setMe(h.alongFromGreen(Math.min(150,0.7*h.lineLen/0.9144)),'sim')});
 await pg.evaluate(()=>{const h=__proto.hole;__proto.S.target=h.alongFromGreen(Math.min(60,0.3*h.lineLen/0.9144));__proto.setView('tee')});await shot('2_tee_view_mid_with_target');
 await pg.evaluate(()=>{__proto.S.target=null;__proto.setView('approach')});await shot('3_approach_view_mid');
 await pg.evaluate(()=>__proto.setView('green'));await shot('4_green_view');
 await pg.evaluate(()=>{__proto.setView('tee');window.scrollTo(0,document.body.scrollHeight)});await shot('5_controls');
 out.storage_keys=await pg.evaluate(()=>Object.keys(localStorage));
 await b.close();s1.close();
 out.pass=!out.errors.length&&Object.values(out.green_fcb).every(r=>!r.mismatches.length)&&out.hazard_checks.every(x=>x[6])&&
  Object.values(out.alignment).every(a=>a.max_px_vs_python<0.05&&a.roundtrip_max_px<0.5)&&out.green_image_identical&&out.storage_keys.every(k=>k.startsWith('pocasset_v3:'));
 console.log(JSON.stringify(out,null,1));process.exit(out.pass?0:1);
})();
