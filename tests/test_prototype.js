// V3 prototype tests (Playwright, iPhone 13). Run: node tests/test_prototype.js
// 1. Green front/center/back identical to production (the V2.2.1 page itself, run side by side) at 60 positions.
// 2. Hazard reach/carry from the mapped tees equal the build-time reference (checks/check_report.md).
// 3. Overlay alignment: green outline projected in the browser equals the renderer's projection.
// 4. Approved green image in the prototype is byte-identical to the master checksum.
// 5. No storage writes outside the pocasset_v3: prefix; no console errors. Screenshots for review.
const {chromium,devices}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),http=require('http');
const ROOT=path.resolve(__dirname,'..'),PROTO=path.join(ROOT,'prototype','hole02'),SHOTS=path.join(ROOT,'prototype','screenshots');
const PROD=process.env.PROD_V221||'/home/claude/app/v221_original.html';
function serve(dir,port){return new Promise(r=>{const s=http.createServer((q,res)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)){res.writeHead(404);return res.end()}const ext=path.extname(f);res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(port,()=>r(s))})}
(async()=>{
 fs.mkdirSync(SHOTS,{recursive:true});
 const out={errors:[]},s1=await serve(PROTO,8771);
 const b=await chromium.launch(),ctx=await b.newContext({...devices['iPhone 13']}),pg=await ctx.newPage();
 pg.on('pageerror',e=>out.errors.push(e.message));pg.on('console',m=>{if(m.type()==='error')out.errors.push(m.text())});
 await pg.goto('http://localhost:8771/');await pg.waitForTimeout(600);
 // positions: along the line and off to the sides, as lon/lat
 const pts=await pg.evaluate(()=>{const h=__proto.hole,o=[];for(let y=20;y<=470;y+=15){const p=h.alongFromGreen(y);for(const dx of [-25,0,25]){if(o.length<60)o.push(h.frame.toLonLat(p[0]+dx,p[1]))}}return o});
 const v3=await pg.evaluate(pts=>pts.map(ll=>{const h=__proto.hole,uv=h.frame.toUV(ll[0],ll[1]),f=h.greenFCB(uv);return [f.front,f.center,f.back].map(m=>Math.round(m/0.9144))}),pts);
 // production page, same points
 const pp=await ctx.newPage();await pp.goto('file://'+PROD);await pp.waitForTimeout(400);
 const prod=await pp.evaluate(pts=>pts.map(ll=>{state.hole=2;state.autoHole=false;gpsMode='demo';gpsPoint={point:ll,accuracy:0};renderGps();return [gpsFront.textContent,gpsMiddle.textContent,gpsBack.textContent].map(Number)}),pts);
 out.green_fcb_mismatches=v3.map((a,i)=>a.join()===prod[i].join()?null:[i,a,prod[i]]).filter(Boolean);
 out.green_fcb_compared=v3.length;
 // hazards from tees vs the build-time reference table
 const ref=fs.readFileSync(path.join(ROOT,'data/holes/hole02/checks/check_report.md'),'utf8');
 const hz=await pg.evaluate(()=>{const h=__proto.hole,r={};for(const t of window.HOLEDATA.hole.tees){const f=h.feats.find(x=>x.id===t.feature_id),c=PGeo.centroid(f.uv);r[t.feature_id]=h.hazards(c,{corridor_m:1e6,max:99}).map(z=>[z.id,Math.floor(z.reach/0.9144),Math.floor(z.carry/0.9144)])}return r});
 out.hazard_checks=[];for(const [tee,list] of Object.entries(hz))for(const [id,re,ca] of list){const m=ref.match(new RegExp('\\| '+tee+' \\| '+id+' \\([^)]*\\) \\| reach (\\d+) · carry (\\d+)'));out.hazard_checks.push([tee,id,re,ca,m?+m[1]:null,m?+m[2]:null,m&&+m[1]===re&&+m[2]===ca])}
 // alignment: browser projection of the green ring == python renderer's homography (same JSON) — compare against JSON math in Node
 const pj=JSON.parse(fs.readFileSync(path.join(ROOT,'data/holes/hole02/render/hole02_tee.json'),'utf8')),G=require(path.join(ROOT,'app/geo.js'));
 const brow=await pg.evaluate(()=>{const h=__proto.hole;return h.green.map(q=>PGeo.project(__proto.views.tee.ground_to_image_homography,q[0],q[1]))});
 const node=JSON.parse(await pg.evaluate(()=>JSON.stringify(__proto.hole.green))).map(q=>G.project(pj.ground_to_image_homography,q[0],q[1]));
 out.alignment_max_px=Math.max(...brow.map((p,i)=>Math.hypot(p[0]-node[i][0],p[1]-node[i][1])));
 // approved green byte check
 const man=JSON.parse(fs.readFileSync(path.join(ROOT,'data/greens/approved_manifest.json'))).files.find(f=>f.path.endsWith('Pocasset_Hole02_Green_1400x1576.png'));
 out.green_image_identical=crypto.createHash('sha256').update(fs.readFileSync(path.join(PROTO,'img/Pocasset_Hole02_Green_1400x1576.png'))).digest('hex')===man.sha256;
 // screenshots
 const shot=async n=>{await pg.waitForTimeout(250);await pg.screenshot({path:path.join(SHOTS,n+'.png')})};
 await pg.evaluate(()=>window.scrollTo(0,0));await shot('1_tee_view_blue_tee');
 await pg.evaluate(()=>{const h=__proto.hole;__proto.setMe(h.alongFromGreen(150),'sim')});
 await pg.evaluate(()=>{const h=__proto.hole;__proto.S.target=h.alongFromGreen(60);__proto.setView('tee')});await shot('2_tee_view_150yd_with_target');
 await pg.evaluate(()=>{__proto.S.target=null;__proto.setView('approach')});await shot('3_approach_view_150yd');
 await pg.evaluate(()=>__proto.setView('green'));await shot('4_green_view');
 await pg.evaluate(()=>{__proto.setView('tee');window.scrollTo(0,document.body.scrollHeight)});await shot('5_controls');
 out.storage_keys=await pg.evaluate(()=>Object.keys(localStorage));
 await b.close();s1.close();
 out.pass=!out.errors.length&&!out.green_fcb_mismatches.length&&out.hazard_checks.every(x=>x[6])&&out.alignment_max_px<0.01&&out.green_image_identical&&out.storage_keys.every(k=>k.startsWith('pocasset_v3:'));
 console.log(JSON.stringify(out,null,1));process.exit(out.pass?0:1);
})();
