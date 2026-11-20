// Pin-sheet PDF upload (v5.4.0) — node tests/test_pinsheet.js
// Uses the owner's EZLocator sheet of 3 Nov 2026 and variants made by tests/make_pinsheet_variants.py. These PDFs stay
// OUTSIDE the public repository: PINSHEETS=<dir> (default /home/claude/pinsheet_work/variants).
// Browser: Chromium with iPhone 13 emulation, America/New_York, the phone clock set per test (page.clock).
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),PLAY=path.join(ROOT,'prototype','play'),DIR=process.env.PINSHEETS||'/home/claude/pinsheet_work/variants';
const SHOTS=path.join(ROOT,'prototype','screenshots_pinsheet');fs.mkdirSync(SHOTS,{recursive:true});
const R={checks:{},errors:[],requests:[]};function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,500):''));return !!p}
const MIME={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const srv=http.createServer((q,res)=>{let f=path.join(PLAY,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  R.requests.push(q.url);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(8821);
const URL0='http://localhost:8821/',PDF=n=>path.join(DIR,n);
// ground truth read independently with poppler's pdftotext (-layout) from the same sheet: hole → [front, side, L/R, depth]
const TRUTH={1:[15,8,'L',27],2:[9,8,'L',29],3:[24,7,'R',30],4:[19,6,'L',24],5:[13,9,'L',30],6:[25,6,'L',30],7:[10,7,'L',30],8:[17,6,'R',28],9:[21,5,'L',34],
  10:[14,5,'L',24],11:[16,9,'R',30],12:[18,5,'R',27],13:[15,7,'R',24],14:[18,5,'R',24],15:[10,6,'L',39],16:[19,12,'R',27],17:[23,5,'L',30],18:[14,13,'R',30]};
const local=(s)=>new Date(s);   // ISO without zone = the context's timezone? no: Node parses as host-local; pass explicit offsets below
let ctx,pg,b;
async function openAt(when,{keep=true}={}){if(pg&&!keep)await ctx.close();
  if(!keep||!ctx){ctx=await b.newContext({...devices['iPhone 13'],timezoneId:'America/New_York'})}
  pg=await ctx.newPage();pg.on('pageerror',e=>R.errors.push(e.message));pg.on('console',m=>{if(m.type()==='error')R.errors.push('console: '+m.text())});
  await pg.clock.setFixedTime(new Date(when));await pg.goto(URL0);await pg.waitForTimeout(400);
  if(await pg.isVisible('#teeGo'))await pg.click('#teeGo');await pg.waitForTimeout(200);return pg}
const saved=()=>pg.evaluate(()=>localStorage.getItem('pocasset_v3:pinsheet'));
async function upload(file){await pg.click('#holesBtn');await pg.setInputFiles('#psFile',PDF(file));await pg.waitForSelector('#psReview.open',{timeout:30000});
  return pg.evaluate(()=>({title:psrTitle.textContent,sub:psrSub.textContent,err:[...document.querySelectorAll('#psrErr li')].map(l=>l.textContent),apply:!psrApply.hidden,
    rows:[...document.querySelectorAll('#psrBody tr')].map(tr=>[...tr.children].map(td=>td.textContent)),note:psrNote.textContent}))}
const close=()=>pg.click('#psrCancel');
// flag positions on all 18 greens (GREEN tab) vs the unchanged V2.3.1 placePin with the expected pin
const greenFlags=(pins)=>pg.evaluate(async(T)=>{const P=__play,out=[];P.setTab('green');for(let n=1;n<=18;n++){P.goHole(n,true);await new Promise(r=>setTimeout(r,30));
  const f=document.querySelector('#greenHost #flag'),t=T[n],e=PGreen.placePin(COURSE.greens[n-1],{front:t[0],edge:t[1],side:t[2],depth:t[3]});
  out.push({n,solid:!!f&&!f.innerHTML.includes('stroke-dasharray'),dx:f?Math.abs(+f.dataset.x-e.px[0]):99,dy:f?Math.abs(+f.dataset.y-e.px[1]):99,line:psLine.hidden?'':psLine.textContent,msg:pinMsg.textContent})}
  P.setTab('fly');return out},pins);
const status=()=>pg.evaluate(()=>{__play.goHole(2,true);__play.setTab('green');const s={line:psLine.hidden?'':psLine.textContent,badge:(document.querySelector('#psLine .psb')||{}).className||''};__play.setTab('fly');return s});
(async()=>{b=await chromium.launch();
 ok('test PDFs present (owner sheet + variants, outside the repo)',fs.existsSync(PDF('ezlocator_2026-11-03.pdf'))&&fs.existsSync(PDF('today_valid.pdf')),DIR);
 // ---- 1. upload on the sheet's own day (3 Nov 2026, 10:00 New York)
 await openAt('2026-11-03T10:00:00-05:00',{keep:false});
 ok('pdf.js is not loaded until a file is chosen',!R.requests.some(u=>u.includes('vendor/pdfjs')));
 await pg.click('#holesBtn');const m0=await pg.evaluate(()=>({state:psState.textContent,up:psUpload.textContent,clear:psClear.hidden,link:document.querySelector('#holesMenu a').getAttribute('href')}));
 ok('Holes menu: hole-list link kept (../), Upload Pins PDF, nothing loaded yet',m0.link==='../'&&m0.up==='Upload Pins PDF'&&/No pin sheet/.test(m0.state)&&m0.clear,m0);
 await pg.screenshot({path:path.join(SHOTS,'1_holes_menu.png')});await pg.click('#menuClose');
 const rv=await upload('ezlocator_2026-11-03.pdf');await pg.screenshot({path:path.join(SHOTS,'2_review_2026-11-03.png'),fullPage:true});
 const got={};rv.rows.forEach(r=>{got[+r[0]]=[+r[1],+r[2].split(' ')[0],r[2].split(' ')[1],+r[3],r[4]]});
 const ext=Object.keys(TRUTH).map(n=>({n:+n,ok:JSON.stringify(got[n].slice(0,4))===JSON.stringify(TRUTH[n])&&got[n][4]==='✓'}));
 ok('extraction: all 18 holes = the sheet (independent pdftotext read), each placed ✓',ext.every(e=>e.ok)&&rv.rows.length===18,ext.filter(e=>!e.ok));
 ok('Hole 2 reads 9 yd on, 8 yd left, depth 29',JSON.stringify(got[2].slice(0,4))===JSON.stringify([9,8,'L',29]),got[2]);
 ok('review: date Tuesday, November 3, 2026, CURRENT, Apply offered, no errors',/Tuesday, November 3, 2026/.test(rv.sub)&&/CURRENT/.test(rv.sub)&&rv.apply&&!rv.err.length,rv.sub);
 ok('nothing saved before Apply',(await saved())===null);
 await pg.click('#psrApply');await pg.waitForTimeout(300);const rec=JSON.parse(await saved());
 ok('Apply saves the sheet locally (pocasset_v3:pinsheet)',rec&&rec.date==='2026-11-03'&&Object.keys(rec.pins).length===18&&Object.keys(TRUTH).every(n=>JSON.stringify([rec.pins[n].front,rec.pins[n].edge,rec.pins[n].side,rec.pins[n].depth])===JSON.stringify(TRUTH[n])),rec&&rec.date);
 let gf=await greenFlags(TRUTH);
 ok('orange flags on all 18 greens at the V2.3.1 placePin position (< 0.01 px)',gf.every(g=>g.solid&&g.dx<0.01&&g.dy<0.01),gf.filter(g=>!(g.solid&&g.dx<0.01&&g.dy<0.01)));
 ok('GREEN tab shows CURRENT on every hole',gf.every(g=>/^CURRENT Pin sheet Tuesday, November 3, 2026$/.test(g.line)),gf[1].line);
 await pg.evaluate(()=>{__play.goHole(2,true);__play.setTab('green')});await pg.waitForTimeout(300);await pg.screenshot({path:path.join(SHOTS,'3_hole02_green_current.png')});await pg.evaluate(()=>__play.setTab('fly'));
 // flag distance (header) and flyover flag = the same pin typed the V2.3.1 way
 const fl=await pg.evaluate(()=>{const P=__play,S=P.S;P.goHole(2,true);S.mode='sim';S.me=P.course.alongFromGreen(2,150);P.render();
   const sheetTxt=flagTxt.textContent,ov=document.getElementById('ov').innerHTML;const t=P.pins.placed(2).ll;
   P.pins.set(2,9,8,'L',29);P.render();const typedTxt=flagTxt.textContent,typedLL=P.pins.placed(2).ll;P.pins.clear(2);P.render();
   return {sheetTxt,typedTxt,same:JSON.stringify(t)===JSON.stringify(typedLL),flagOnFly:/flag|🚩|#ec5939|pin/i.test(ov)}});
 ok('header flag yardage from the sheet = the same pin typed in (V2.3.1 method)',fl.same&&fl.sheetTxt===fl.typedTxt&&/^FLAG \d+ yd$/.test(fl.sheetTxt),fl);
 // ---- 2. persistence + EXPIRED (later day, after closing the page)
 const before=await saved();await pg.close();
 await openAt('2026-11-19T21:44:00-05:00');
 let st=await status();ok('after reopening on 19 Nov: EXPIRED + original date + warning',/expired/.test(st.badge)&&/^EXPIRED Pin sheet Tuesday, November 3, 2026Pin positions may have changed\.$/.test(st.line),st);
 gf=await greenFlags(TRUTH);ok('expired pins still drawn at the same positions on all 18 greens',gf.every(g=>g.solid&&g.dx<0.01&&g.dy<0.01));
 ok('expiry changes nothing in storage',(await saved())===before);
 await pg.reload();await pg.waitForTimeout(500);st=await status();
 ok('still EXPIRED and visible after refresh; storage unchanged',/expired/.test(st.badge)&&(await saved())===before,st);
 const hx=await pg.evaluate(()=>{const P=__play,S=P.S;P.goHole(2,true);S.mode='sim';S.me=P.course.alongFromGreen(2,150);P.render();return {txt:flagTxt.textContent,cls:flagTxt.className}});
 ok('pin measurement kept when expired (header FLAG … · EXPIRED)',/^FLAG \d+ yd · EXPIRED$/.test(hx.txt)&&/expired/.test(hx.cls),hx);
 await pg.evaluate(()=>{__play.goHole(2,true);__play.setTab('green')});await pg.waitForTimeout(300);await pg.screenshot({path:path.join(SHOTS,'4_hole02_green_expired.png')});await pg.evaluate(()=>__play.setTab('fly'));
 await pg.click('#holesBtn');const m1=await pg.evaluate(()=>({state:psState.textContent,up:psUpload.textContent,clear:!psClear.hidden}));
 ok('Holes menu shows the loaded date, EXPIRED, "Upload newer", Clear',/EXPIRED/.test(m1.state)&&/Tuesday, November 3, 2026/.test(m1.state)&&m1.up==='Upload newer Pins PDF'&&m1.clear,m1);
 await pg.screenshot({path:path.join(SHOTS,'5_holes_menu_expired.png')});await pg.click('#menuClose');
 // ---- 3. local calendar date, not 24 h / UTC
 await pg.close();await openAt('2026-11-04T03:30:00Z');st=await status();   // = 3 Nov 22:30 in New York (UTC already 4 Nov)
 ok('3 Nov 22:30 New York (4 Nov in UTC): still CURRENT',/current/.test(st.badge),st);
 await pg.close();await openAt('2026-11-04T05:30:00Z');st=await status();   // = 4 Nov 00:30 New York, 14.5 h after upload
 ok('4 Nov 00:30 New York (under 24 h after upload): EXPIRED',/expired/.test(st.badge),st);
 await pg.close();await openAt('2026-11-02T12:00:00-05:00');st=await status();
 ok('2 Nov (before the sheet date): FUTURE DATE, never CURRENT',/future/.test(st.badge)&&/FUTURE DATE/.test(st.line)&&!/CURRENT/.test(st.line),st);
 // ---- 4. crossing midnight while open, and resuming the app
 await pg.close();pg=await ctx.newPage();pg.on('pageerror',e=>R.errors.push(e.message));
 await pg.clock.install({time:new Date('2026-11-03T23:59:20-05:00')});await pg.goto(URL0);await pg.clock.runFor(1000);
 const s1=await status();await pg.clock.runFor(61000);const s2=await status();
 ok('open across midnight: CURRENT → EXPIRED without reload',/current/.test(s1.badge)&&/expired/.test(s2.badge),{s1,s2});
 await pg.close();pg=await ctx.newPage();await pg.clock.setFixedTime(new Date('2026-11-03T20:00:00-05:00'));await pg.goto(URL0);await pg.waitForTimeout(400);const r1=await status();
 await pg.clock.setFixedTime(new Date('2026-11-04T07:00:00-05:00'));await pg.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await pg.waitForTimeout(100);const r2=await status();
 ok('app resumed next morning: re-evaluated to EXPIRED',/current/.test(r1.badge)&&/expired/.test(r2.badge),{r1,r2});
 ok('saved sheet unchanged by every date test',(await saved())===before);
 // ---- 5. invalid files never overwrite
 await pg.close();await openAt('2026-11-19T21:44:00-05:00');
 const bad=[['copies_disagree.pdf',/Hole 2: the copies on the sheet disagree/],['wrong_weekday.pdf',/weekday does not match/],['missing_hole5.pdf',/Hole 5: not found/],
   ['pin_off_green.pdf',/Hole 2: .*outside the mapped green/],['not_a_pinsheet.pdf',/not found on the sheet/],['corrupt.pdf',/Could not read this file as a PDF/]];
 for(const [f,re] of bad){const v=await upload(f);await pg.screenshot({path:path.join(SHOTS,'6_rejected_'+f.replace('.pdf','')+'.png'),fullPage:true});
   const un=(await saved())===before;await close();
   ok('rejected: '+f+' — error shown, no Apply, saved pins unchanged',!v.apply&&v.title==='Pin sheet not applied'&&v.err.some(e=>re.test(e))&&/were not changed/.test(v.sub)&&un,{err:v.err.slice(0,2)})}
 gf=await greenFlags(TRUTH);ok('after the rejected files the 3 Nov flags are still in place',gf.every(g=>g.solid&&g.dx<0.01&&g.dy<0.01));
 // Cancel on a valid sheet changes nothing
 let v=await upload('today_valid.pdf');await close();ok('Cancel on a valid sheet: nothing changed',v.apply&&(await saved())===before);
 // ---- 6. a newer valid sheet replaces the old one (19 Nov = today on the phone)
 v=await upload('today_valid.pdf');await pg.screenshot({path:path.join(SHOTS,'7_review_replace.png'),fullPage:true});
 ok('review of the newer sheet: CURRENT, says it replaces the 3 Nov sheet',v.apply&&/Thursday, November 19, 2026/.test(v.sub)&&/CURRENT/.test(v.sub)&&/Replaces the saved sheet dated Tuesday, November 3, 2026/.test(v.note),{sub:v.sub,note:v.note});
 await pg.click('#psrApply');await pg.waitForTimeout(300);const rec2=JSON.parse(await saved());
 const T2=JSON.parse(JSON.stringify(TRUTH));T2[2]=[20,6,'R',29];
 ok('new sheet saved: date 19 Nov, Hole 2 now 20 yd on, 6 R',rec2.date==='2026-11-19'&&rec2.pins[2].front===20&&rec2.pins[2].edge===6&&rec2.pins[2].side==='R');
 gf=await greenFlags(T2);ok('flags moved to the new positions (Hole 2 moved, others as on the sheet); CURRENT',gf.every(g=>g.solid&&g.dx<0.01&&g.dy<0.01&&/^CURRENT Pin sheet Thursday, November 19, 2026$/.test(g.line)),gf.filter(g=>!(g.dx<0.01&&g.dy<0.01)).map(g=>g.n));
 // typed pin still overrides one hole; sheet untouched
 const ty=await pg.evaluate(()=>{const P=__play;P.goHole(3,true);P.setTab('green');P.pins.set(3,5,5,'L',30);P.render();const m=pinMsg.textContent,l=psLine.hidden;P.pins.clear(3);P.render();P.setTab('fly');return {m,l}});
 ok('a pin typed today on the GREEN tab still takes precedence on that hole',/today’s pin: 5 yd from front/.test(ty.m)&&ty.l,ty);
 // ---- 7. clear (two taps), V2.3.1 storage untouched, no errors
 await pg.click('#holesBtn');await pg.click('#psClear');const one=await saved();await pg.click('#psClear');const two=await saved();await pg.click('#menuClose');
 gf=await greenFlags(TRUTH);
 ok('Clear saved pins needs two taps, then removes the sheet; greens show the dashed sample again',one!==null&&two===null&&gf.every(g=>!g.solid&&g.line===''),{one:!!one,two});
 const keys=await pg.evaluate(()=>Object.keys(localStorage));ok('only pocasset_v3: keys written',keys.every(k=>k.startsWith('pocasset_v3:')),keys);
 ok('no page errors',!R.errors.length,R.errors);
 await b.close();srv.close();R.pass=Object.values(R.checks).every(c=>c.pass);delete R.requests;
 fs.writeFileSync(path.join(SHOTS,'test_pinsheet_result.json'),JSON.stringify(R,null,1));
 console.log(JSON.stringify({pass:R.pass,checks:Object.keys(R.checks).length,failed:Object.keys(R.checks).filter(k=>!R.checks[k].pass)}));process.exit(R.pass?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
