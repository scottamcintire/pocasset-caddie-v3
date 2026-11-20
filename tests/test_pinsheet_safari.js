// Safari stream gap (v5.4.1) — node tests/test_pinsheet_safari.js
// Chromium with ReadableStream async iteration REMOVED on the page and in the pdf.js worker (as in iPhone Safari).
// Without the fix the upload must fail like the owner's iPhone did; with the fix all 18 holes must read.
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),PLAY=path.join(ROOT,'prototype','play'),DIR=process.env.PINSHEETS||'/home/claude/pinsheet_work/variants';
const R={checks:{}};function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));return !!p}
const srv=http.createServer((q,res)=>{let f=path.join(PLAY,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}
  res.writeHead(200,{'content-type':/\.js$/.test(f)?'text/javascript':/\.html$/.test(f)?'text/html':'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(8823);
const STRIP="delete ReadableStream.prototype[Symbol.asyncIterator];delete ReadableStream.prototype.values;";
async function run(b,withFix){const c=await b.newContext({...devices['iPhone 13'],timezoneId:'America/New_York',serviceWorkers:'block'}),pg=await c.newPage();
  await pg.addInitScript(STRIP);   // page: like Safari
  await pg.route('**/vendor/pdfjs/__strip.js',r=>r.fulfill({contentType:'text/javascript',body:STRIP}));   // worker: like Safari
  await pg.route('**/vendor/pdfjs/pdf.worker.safari.js',r=>r.fulfill({contentType:'text/javascript',body:"import './__strip.js';import './pdfjs_safari.js';import './pdf.worker.min.js';"}));
  if(!withFix)await pg.route('**/vendor/pdfjs/pdfjs_safari.js',r=>r.fulfill({contentType:'text/javascript',body:'/* fix removed */'}));
  const workers=[];pg.on('worker',w=>workers.push(w.url()));
  await pg.clock.setFixedTime(new Date('2026-11-03T10:00:00-05:00'));await pg.goto('http://localhost:8823/');await pg.waitForTimeout(400);await pg.click('#teeGo');
  const before=await pg.evaluate(()=>typeof ReadableStream.prototype[Symbol.asyncIterator]);
  await pg.click('#holesBtn');await pg.setInputFiles('#psFile',path.join(DIR,'ezlocator_2026-11-03.pdf'));await pg.waitForSelector('#psReview.open',{timeout:30000});
  const v=await pg.evaluate(()=>({title:psrTitle.textContent,err:[...document.querySelectorAll('#psrErr li')].map(l=>l.textContent),rows:document.querySelectorAll('#psrBody tr').length,
    ok:document.querySelectorAll('#psrBody td.st.ok').length,h2:[...document.querySelectorAll('#psrBody tr')][1]?.textContent}));
  if(withFix){await pg.click('#psrApply');await pg.waitForTimeout(200)}
  const saved=await pg.evaluate(()=>localStorage.getItem('pocasset_v3:pinsheet'));await c.close();return {before,v,saved:!!saved,worker:workers.some(u=>/pdf\.worker\.safari\.js/.test(u))}}
(async()=>{const b=await chromium.launch();
 const a=await run(b,false);ok('without the fix (Safari-like): upload fails as on the iPhone, nothing saved',a.before==='undefined'&&a.v.title==='Pin sheet not applied'&&a.v.err.some(e=>/Could not read this file as a PDF \(.*(not a function|not async iterable|is not iterable)/.test(e))&&!a.saved,a);
 const f=await run(b,true);ok('with the fix (Safari-like): all 18 holes read and placed, Hole 2 9 / 8 L / 29, applied',f.before==='undefined'&&f.v.title==='Review pin sheet'&&f.v.rows===18&&f.v.ok===18&&f.v.h2==='298 L29✓'&&f.saved,f);
 ok('pdf.js ran in its own worker (module worker with the fix), not on the page',f.worker,f.worker);
 await b.close();srv.close();R.pass=Object.values(R.checks).every(c=>c.pass);
 fs.writeFileSync(path.join(ROOT,'prototype','screenshots_pinsheet','test_pinsheet_safari_result.json'),JSON.stringify(R,null,1));
 console.log(JSON.stringify({pass:R.pass,checks:Object.keys(R.checks).length,failed:Object.keys(R.checks).filter(k=>!R.checks[k].pass)}));process.exit(R.pass?0:1)})().catch(e=>{console.error(e);process.exit(2)});
