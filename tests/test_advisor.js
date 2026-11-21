// AI Caddie Shot Advisor (v5.5.0, Hole 2 only) — node tests/test_advisor.js   (Playwright, iPhone 13)
// Moves the golfer with the SIMULATE presets and with Move Me taps, then checks both recommendations against the
// expected Hole 2 picks, that they update between positions, the flag/centre target rule, the on/off switch, and
// that the advisor never appears on other holes or on the GREEN / SCORE tabs.
const {chromium,devices}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),PLAY=path.join(ROOT,'prototype','play'),SHOTS=path.join(ROOT,'prototype','screenshots_advisor');fs.mkdirSync(SHOTS,{recursive:true});
const R={checks:{},errors:[]};let fails=0;function ok(n,p,d){R.checks[n]={pass:!!p,detail:d};if(!p)fails++;console.error((p?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));return !!p}
const srv=http.createServer((q,res)=>{let f=path.join(PLAY,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(8831);
const readAdv=pg=>pg.evaluate(()=>{const el=document.getElementById('adv'),c=k=>{const d=document.querySelector('.advc[data-k="'+k+'"]');return d?{star:d.classList.contains('star'),club:d.querySelector('.advclub').textContent,n:d.querySelector('.advn').textContent,note:d.querySelector('.advnote').textContent}:null};
  return {shown:!el.hidden,attack:c('attack'),smart:c('smart'),fine:(document.querySelector('.advfine')||{}).textContent||'',msg:(document.querySelector('.advmsg')||{}).textContent||'',center:document.getElementById('yC').textContent,mode:__play.S.mode,adv:__play.S.adv}});
async function open(b,init){const ctx=await b.newContext({...devices['iPhone 13']});if(init)await ctx.addInitScript(init);const pg=await ctx.newPage();pg.on('pageerror',e=>R.errors.push(e.message));pg.on('console',m=>{if(m.type()==='error')R.errors.push(m.text())});
  await pg.goto('http://localhost:8831/');await pg.waitForTimeout(400);await pg.click('#teeGo');await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(700);return pg}
const preset=async(pg,label)=>{await pg.evaluate(()=>{if(document.getElementById('simBox').hidden)document.getElementById('simBtn').click()});const b=pg.locator('#presets button',{hasText:label}).first();await b.click();await pg.waitForTimeout(250)};
// Move Me: select "move me" and tap the picture at a hole-frame point (Tee view if the point is off the current view)
const moveMe=(pg,uv)=>pg.evaluate(p=>{const P=__play,S=P.S,hd=P.HD[2];document.getElementById('mMe').click();
  const tap=()=>{const v=hd.views[S.view],q=v.V.project(p[0],p[1]);if(!q)return false;const bx=S.box||{x:0,y:0,w:v.width,h:v.height},fx=(q[0]-bx.x)/bx.w,fy=(q[1]-bx.y)/bx.h;if(fx<.01||fx>.99||fy<.01||fy>.99)return false;
    const st=document.getElementById('stage').getBoundingClientRect();document.getElementById('stage').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:st.left+fx*st.width,clientY:st.top+fy*st.height}));return true};
  if(!tap()){document.getElementById('vApp').click();if(!tap()){document.getElementById('vTee').click();if(!tap())return null}}
  document.getElementById('mTarget').click();const m=hd.hole.frame.toUV(S.me[0],S.me[1]);return {errYd:+(Math.hypot(m[0]-p[0],m[1]-p[1])/0.9144).toFixed(1),mode:S.mode}},uv);
(async()=>{
 const b=await chromium.launch();
 const pg=await open(b);
 const g=await readAdv(pg);ok('Hole 2 shows only the AI CADDIE · SHOW button at the start (suggestion hidden)',g.shown&&await pg.locator('#advBody').isHidden()&&(await pg.textContent('#advChev'))==='SHOW ▸');
 await preset(pg,'Green tee');ok('still hidden after a position is set; no club on screen',await pg.locator('#advBody').isHidden()&&!/DRIVER|HYBRID|IRON|WEDGE/.test(await pg.locator('#adv').innerText()),await pg.locator('#adv').innerText());
 await pg.click('#advToggle');ok('SHOW reveals the two cards',await pg.locator('.advc[data-k="attack"]').isVisible()&&(await pg.textContent('#advChev'))==='HIDE ▾');
 await pg.reload();await pg.waitForTimeout(600);await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(500);ok('stays shown after reload once turned on',await pg.locator('#advBody').isVisible());
 const U=await pg.evaluate(()=>{const h=__play.HD[2].hole,c=h.centerUV,a=h.alongFromGreen(45);return {w140:h.alongFromGreen(140),w124:h.alongFromGreen(124),w45:a,beyond:[c[0]+(c[0]-h.alongFromGreen(30)[0]),c[1]+(c[1]-h.alongFromGreen(30)[1])]}});
 const RULE=[];const CASES=[
  ['Tee box (Green tee preset)',()=>preset(pg,'Green tee'),{a:'DRIVER · FULL',s:'5-HYBRID · FULL',star:'smart',sNote:/in range for shot 2/}],
  ['Long fairway shot (250 yd preset)',()=>preset(pg,'250 yd out'),{a:'7-HYBRID · FULL',s:'8-IRON · FULL',star:'smart',aWarn:/pond/,sNote:/Your rule: lay up beyond 130/}],
  ['150-yard approach (preset)',()=>preset(pg,'150 yd out'),{a:'6-IRON · FULL',s:/WEDGE · (½|¾)$/,star:'smart',sNote:/Your rule: lay up beyond 130.*short of pond/}],
  ['100-yard approach (preset)',()=>preset(pg,'100 yd out'),{a:'48° WEDGE · FULL',s:'48° WEDGE · FULL',star:'attack',same:true,aNote:/Your rule: go for it from 130/}],
  ['Owner rule boundary (Move Me ~140 yd: lay up)',()=>moveMe(pg,U.w140),{a:/IRON · FULL/,s:/WEDGE/,star:'smart',sNote:/Your rule: lay up beyond 130/}],
  ['Owner rule boundary (Move Me ~124 yd: go for it)',()=>moveMe(pg,U.w124),{a:/IRON · FULL/,star:'attack',aNote:/Your rule: go for it from 130/}],
  ['Partial wedge (Move Me ~45 yd)',()=>moveMe(pg,U.w45),{a:/WEDGE · (½|¾|¼)$/,star:'attack'}],
  ['Beyond the green (Move Me ~30 yd past centre)',()=>moveMe(pg,U.beyond),{a:/WEDGE · (½|¼)$/,star:'attack'}]];
 let prev=null;
 for(const [name,go,exp] of CASES){const mv=await go();await pg.waitForTimeout(300);const r=await readAdv(pg);
  await pg.evaluate(()=>window.scrollTo(0,0));await pg.waitForTimeout(100);await pg.screenshot({path:path.join(SHOTS,name.replace(/[^a-z0-9]+/gi,'_').toLowerCase()+'.png')});
  const m=(x,e)=>e instanceof RegExp?e.test(x):x===e;
  RULE.push({name,c:+r.center,star:r.attack&&r.attack.star?'attack':'smart'});
  ok(name+': two cards shown',r.shown&&r.attack&&r.smart,{mv,center:r.center});
  ok(name+': Attack '+exp.a,r.attack&&m(r.attack.club,exp.a),r.attack);
  if(exp.s)ok(name+': Play Smart '+exp.s,r.smart&&m(r.smart.club,exp.s),r.smart);
  ok(name+': ⭐ on '+exp.star,r.attack&&(exp.star==='attack'?r.attack.star&&!r.smart.star:r.smart.star&&!r.attack.star));
  if(exp.aWarn)ok(name+': Attack risk names the pond',exp.aWarn.test(r.attack.note),r.attack.note);
  if(exp.sNote)ok(name+': Play Smart cites your stated preference',exp.sNote.test(r.smart.note),r.smart.note);
  if(exp.aNote)ok(name+': Attack cites your rule',exp.aNote.test(r.attack.note),r.attack.note);
  if(exp.same)ok(name+': same club labelled, not forced',/Same as Attack/.test(r.smart.note),r.smart.note);
  ok(name+': labelled distance-based / unverified',/DISTANCE-BASED/.test(r.fine)&&/carry vs total not confirmed/.test(r.fine),r.fine);
  ok(name+': target = centre (no pin today), matches header',new RegExp('To centre '+r.center+' yd').test(r.fine),r.fine);
  const a=r.adv,lo=+r.attack.n.match(/^(\d+)/)[1];ok(name+': no "carry"/"safe" claims',!/carries|safe\b|will clear/i.test(JSON.stringify([r.attack.note,r.smart.note])));
  if(prev)ok(name+': recommendation updated from previous position',JSON.stringify([r.attack,r.smart,r.center])!==prev);prev=JSON.stringify([r.attack,r.smart,r.center]);
 }
 // dogleg-free sanity: remaining after a full shot = header centre − expected distance (±6 yd) at 250 yd out
 await preset(pg,'250 yd out');let r=await readAdv(pg);ok('rule follows the header centre: ⭐ Play Smart beyond 130, Attack at 130 or closer (all positions)',RULE.every(x=>x.c>130?x.star==='smart':x.star==='attack'),RULE);const rem=+r.attack.n.match(/~(\d+) left/)[1];ok('remaining ≈ centre − mid distance',Math.abs((+r.center-165)-rem)<=6,{center:r.center,rem});
 // collapse / expand, and summary line
 await pg.click('#advToggle');r=await readAdv(pg);ok('HIDE collapses it again, no club shown',await pg.locator('#advBody').isHidden()&&!/IRON|HYBRID|WEDGE/.test(await pg.locator('#adv').innerText()));
 await pg.click('#advToggle');ok('expands again',await pg.locator('#advBody').isVisible());
 // tabs and other holes
 await pg.evaluate(()=>__play.setTab('green'));ok('hidden on GREEN tab',(await readAdv(pg)).shown===false);
 await pg.evaluate(()=>__play.setTab('score'));ok('hidden on SCORE tab',(await readAdv(pg)).shown===false);
 await pg.evaluate(()=>__play.setTab('fly'));
 // all 18 holes (owner approved 20 Nov): once SHOW is on, it stays on from hole to hole; two cards from a simulated position
 for(let n=1;n<=18;n++){await pg.evaluate(n=>__play.goHole(n,true),n);await pg.waitForTimeout(450);
  const L=await pg.evaluate(()=>{const b=[...document.querySelectorAll('#presets button')];return b.map(x=>x.textContent)});
  const pick=L.find(t=>/150 yd out/.test(t))||L.find(t=>/100 yd out/.test(t))||L[0];await preset(pg,pick);const q=await readAdv(pg);
  const vis=await pg.locator('#advBody').isVisible();
  ok('Hole '+n+' ('+pick+'): advisor on without tapping SHOW again, Attack + Play Smart, one ⭐',q.shown&&vis&&q.attack&&q.smart&&(q.attack.star!==q.smart.star),{a:q.attack&&q.attack.club,s:q.smart&&q.smart.club,center:q.center});
  const tee=L.find(t=>/ tee/.test(t)&&!/sim/.test(t));if(tee){await preset(pg,tee);const t=await readAdv(pg);ok('Hole '+n+' ('+tee+'): tee recommendation',t.attack&&t.smart,{a:t.attack&&t.attack.club,s:t.smart&&t.smart.club,star:t.attack&&t.attack.star?'attack':'smart'})}}
 await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(400);
 // on / off from the Holes menu (persisted)
 await pg.click('#holesBtn');await pg.click('#advOnOff');await pg.click('#menuClose');ok('switched off',(await readAdv(pg)).shown===false);
 await pg.reload();await pg.waitForTimeout(600);await pg.evaluate(()=>__play.goHole(2,true));await pg.waitForTimeout(500);ok('stays off after reload',(await readAdv(pg)).shown===false);
 await pg.click('#holesBtn');await pg.click('#advOnOff');await pg.click('#menuClose');ok('switched on again',(await readAdv(pg)).shown===true);
 ok('advisor setting stored under pocasset_v3: only',await pg.evaluate(()=>Object.keys(localStorage).every(k=>k.indexOf('pocasset_v3:')===0)&&!!localStorage.getItem('pocasset_v3:advisor')));
 // target rule: a pin typed today → flag; a CURRENT sheet → flag; an EXPIRED sheet → centre
 await preset(pg,'150 yd out');await pg.evaluate(()=>{__play.pins.set(2,'8','6','L','30');__play.render()});r=await readAdv(pg);
 const flag=await pg.textContent('#flagTxt');ok('typed pin → target is the flag (header FLAG yardage)',new RegExp('To flag '+flag.match(/FLAG (\d+)/)[1]+' yd').test(r.fine),{fine:r.fine,flag});
 ok('typed pin → Play Smart offers the centre or another option',r.smart.club!==''&&r.adv.mode==='reach',r.smart);
 await pg.screenshot({path:path.join(SHOTS,'flag_target_150.png')});
 const sheetInit=d=>`(()=>{const t=new Date();t.setDate(t.getDate()+(${d}));const s=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
   localStorage.setItem('pocasset_v3:pinsheet',JSON.stringify({date:s,dateText:s,pins:{"2":{front:8,edge:6,side:'L',depth:30}},file:'test.pdf',loaded:t.toISOString()}))})()`;
 for(const [lbl,d,want] of [['CURRENT sheet',0,'flag'],['EXPIRED sheet',-3,'centre'],['FUTURE-dated sheet',2,'centre']]){
  const p2=await open(b,sheetInit(d));await preset(p2,'150 yd out');const q=await readAdv(p2);
  ok(lbl+' → target '+want,want==='flag'?/To flag \d+ yd/.test(q.fine):/To centre \d+ yd \(pin sheet (expired|future-dated)\)/.test(q.fine),q.fine);await p2.context().close()}
 ok('no page errors',R.errors.length===0,R.errors);
 fs.writeFileSync(path.join(SHOTS,'test_advisor_result.json'),JSON.stringify(R,null,1));
 console.error(fails?'\nFAILED '+fails:'\nALL PASS '+Object.keys(R.checks).length+'/'+Object.keys(R.checks).length);
 await b.close();srv.close();process.exit(fails?1:0);
})();
