// Hand-authored, bulletproof interactive pre-prototype for the tuition/Kami hero case.
// This is the DEMO STAR — served reliably (demo flag or mock mode) instead of a
// coin-flip live generation. A genuinely clickable, product-feeling mock of the
// client's own future tool. Data is fake; it does not truly run — it earns the meeting.
// Self-contained: inline CSS + JS only, no external resources, sized for the ~480px iframe.

export const HERO_PROTOTYPE_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1c2333;--soft:#6b7488;--line:#e3e7ef;--paper:#ffffff;--wash:#f5f7fb;--accent:#3b4ce0;--accent-soft:#eef0fe;--good:#1a8a5a;--good-soft:#e7f6ee}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--wash);color:var(--ink);font-size:13px;line-height:1.5;display:flex;flex-direction:column;height:100%}
.banner{background:#fff8ed;border-bottom:1px solid #f3d9a8;color:#8a5a12;padding:6px 14px;font-size:11px;letter-spacing:.02em;flex:0 0 auto}
.top{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--paper);border-bottom:1px solid var(--line);flex:0 0 auto}
.logo{width:26px;height:26px;border-radius:7px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.top h1{font-size:14px;font-weight:700;letter-spacing:-.01em}
.top .sub{font-size:10px;color:var(--soft);font-weight:500}
.shell{flex:1;display:flex;min-height:0}
.rail{width:184px;flex:0 0 auto;background:var(--paper);border-right:1px solid var(--line);padding:14px 12px;display:flex;flex-direction:column;gap:3px}
.rstep{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:8px;color:var(--soft);font-weight:500;font-size:12px}
.rstep .n{width:19px;height:19px;border-radius:50%;background:var(--wash);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex:0 0 auto}
.rstep.on{background:var(--accent-soft);color:var(--accent)}
.rstep.on .n{background:var(--accent);color:#fff;border-color:var(--accent)}
.rstep.done{color:var(--good)}
.rstep.done .n{background:var(--good-soft);color:var(--good);border-color:var(--good)}
.rail .tip{margin-top:auto;font-size:10px;color:var(--soft);line-height:1.45;border-top:1px solid var(--line);padding-top:10px}
.main{flex:1;min-width:0;display:flex;flex-direction:column;padding:18px 22px;overflow-y:auto}
.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);font-weight:700;margin-bottom:3px}
h2{font-size:17px;font-weight:700;letter-spacing:-.01em;margin-bottom:2px}
.lead{color:var(--soft);margin-bottom:14px}
.panel{display:none;flex-direction:column;flex:1;min-height:0}
.panel.on{display:flex}
.rows{display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.row{display:flex;align-items:center;gap:12px;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:11px 13px}
.row .cls{font-weight:600;min-width:120px}
.row .meta{font-size:11px;color:var(--soft)}
.arrow{color:var(--soft);font-size:15px}
select{flex:1;font:inherit;font-size:12px;color:var(--ink);padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--wash);cursor:pointer}
select.set{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);font-weight:600}
.chk{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12px}
.chk:last-child{border-bottom:0}
.chk input{width:15px;height:15px;accent-color:var(--accent);cursor:pointer}
.chk .who{font-weight:500}
.chk .cl{margin-left:auto;font-size:11px;color:var(--soft)}
.classcard{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:6px 13px 8px;margin-bottom:8px}
.classcard .hd{display:flex;align-items:center;gap:8px;padding:6px 0;font-weight:600}
.classcard .hd .ct{margin-left:auto;font-size:11px;color:var(--soft);font-weight:500}
.prev{display:flex;flex-direction:column;gap:7px;overflow-y:auto}
.prevrow{display:flex;align-items:center;gap:10px;background:var(--paper);border:1px solid var(--line);border-radius:9px;padding:9px 12px;font-size:12px}
.prevrow .st{font-weight:600;min-width:86px}
.prevrow .ws{color:var(--soft);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prevrow .lk{font-family:ui-monospace,Menlo,monospace;font-size:10px;color:var(--accent);background:var(--accent-soft);padding:2px 7px;border-radius:5px}
.foot{display:flex;align-items:center;gap:12px;margin-top:14px;flex:0 0 auto}
.count{font-size:11px;color:var(--soft)}
.btn{margin-left:auto;background:var(--accent);color:#fff;border:0;border-radius:9px;padding:10px 18px;font:inherit;font-weight:600;font-size:12px;cursor:pointer;transition:transform .08s,box-shadow .12s;box-shadow:0 1px 2px rgba(59,76,224,.25)}
.btn:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(59,76,224,.28)}
.btn.ghost{background:var(--paper);color:var(--soft);border:1px solid var(--line);box-shadow:none;margin-left:0}
.done-hd{display:flex;align-items:center;gap:10px;background:var(--good-soft);border:1px solid #bfe6d0;border-radius:10px;padding:11px 14px;margin-bottom:10px}
.done-hd .big{font-size:15px;font-weight:700;color:var(--good)}
.done-hd .small{font-size:11px;color:#3a7a5c}
.tick{width:22px;height:22px;border-radius:50%;background:var(--good);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto}
.master{display:flex;align-items:center;gap:9px;background:var(--paper);border:1px dashed var(--line);border-radius:9px;padding:10px 13px;margin-top:9px;font-size:12px;color:var(--soft)}
</style></head>
<body>
<div class="banner">AI-generated pre-prototype from your Recce conversation — click through to get the feel. We build the real thing together.</div>
<div class="top"><div class="logo">W</div><div><h1>Worksheet Runner</h1><div class="sub">Weekly worksheet distribution · your tuition centre</div></div></div>
<div class="shell">
  <nav class="rail">
    <div class="rstep on" id="r1"><span class="n">1</span>Match worksheets</div>
    <div class="rstep" id="r2"><span class="n">2</span>Confirm students</div>
    <div class="rstep" id="r3"><span class="n">3</span>Preview</div>
    <div class="rstep" id="r4"><span class="n">4</span>Send</div>
    <div class="tip">This is a taster of your future tool. Nothing here is live yet — it shows what your Sunday could look like.</div>
  </nav>
  <main class="main">
    <!-- STEP 1 : match each class to its worksheet -->
    <section class="panel on" id="p1">
      <div class="eyebrow">Step 1 of 4</div>
      <h2>Match each class to this week's worksheet</h2>
      <p class="lead">Pick the worksheet for each class once. Every student in the class gets their own copy automatically.</p>
      <div class="rows">
        <div class="row"><div><div class="cls">Sec 3 · A-Math</div><div class="meta">8 students</div></div><span class="arrow">→</span>
          <select onchange="mark(this)"><option value="">Choose worksheet…</option><option>AMath — Differentiation P3.pdf</option><option>AMath — Integration Set B.pdf</option><option>AMath — Trigonometry Recap.pdf</option></select></div>
        <div class="row"><div><div class="cls">Sec 4 · E-Math</div><div class="meta">11 students</div></div><span class="arrow">→</span>
          <select onchange="mark(this)"><option value="">Choose worksheet…</option><option>EMath — Probability Ch7.pdf</option><option>EMath — Vectors Practice.pdf</option><option>EMath — Matrices Set A.pdf</option></select></div>
        <div class="row"><div><div class="cls">Sec 3 · Physics</div><div class="meta">6 students</div></div><span class="arrow">→</span>
          <select onchange="mark(this)"><option value="">Choose worksheet…</option><option>Physics — Kinematics Qns.pdf</option><option>Physics — Forces Worksheet.pdf</option><option>Physics — Energy Set 2.pdf</option></select></div>
      </div>
      <div class="foot"><span class="count" id="c1">0 of 3 classes matched</span>
        <button class="btn" onclick="go(2)">Confirm students →</button></div>
    </section>
    <!-- STEP 2 : confirm students -->
    <section class="panel" id="p2">
      <div class="eyebrow">Step 2 of 4</div>
      <h2>Confirm who's getting a worksheet</h2>
      <p class="lead">Pulled from your class lists. Untick anyone sitting this week out.</p>
      <div class="rows">
        <div class="classcard"><div class="hd">Sec 3 · A-Math <span class="ct" id="ct-a">8 included</span></div>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="a"><span class="who">Aisha Rahman</span><span class="cl">3A</span></label>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="a"><span class="who">Marcus Tan</span><span class="cl">3A</span></label>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="a"><span class="who">Wei Lin Goh</span><span class="cl">3A</span></label>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="a"><span class="who">Priya Nair</span><span class="cl">3A</span></label>
        </div>
        <div class="classcard"><div class="hd">Sec 4 · E-Math <span class="ct" id="ct-e">11 included</span></div>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="e"><span class="who">Daniel Ong</span><span class="cl">4E</span></label>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="e"><span class="who">Sofia Idris</span><span class="cl">4E</span></label>
          <label class="chk"><input type="checkbox" checked onchange="tally()" data-g="e"><span class="who">Ryan Lee</span><span class="cl">4E</span></label>
        </div>
      </div>
      <div class="foot"><button class="btn ghost" onclick="go(1)">← Back</button>
        <span class="count" id="c2">7 students selected</span>
        <button class="btn" onclick="go(3)">Preview →</button></div>
    </section>
    <!-- STEP 3 : preview -->
    <section class="panel" id="p3">
      <div class="eyebrow">Step 3 of 4</div>
      <h2>Preview what each student receives</h2>
      <p class="lead">Their own copy, shared to them, opened in Kami — the link goes straight to your master doc.</p>
      <div class="prev">
        <div class="prevrow"><span class="st">Aisha R.</span><span class="ws">AMath — Differentiation P3.pdf</span><span class="lk">kami.app/…a3f</span></div>
        <div class="prevrow"><span class="st">Marcus T.</span><span class="ws">AMath — Differentiation P3.pdf</span><span class="lk">kami.app/…b81</span></div>
        <div class="prevrow"><span class="st">Wei Lin G.</span><span class="ws">AMath — Differentiation P3.pdf</span><span class="lk">kami.app/…c09</span></div>
        <div class="prevrow"><span class="st">Daniel O.</span><span class="ws">EMath — Probability Ch7.pdf</span><span class="lk">kami.app/…d52</span></div>
        <div class="prevrow"><span class="st">Sofia I.</span><span class="ws">EMath — Probability Ch7.pdf</span><span class="lk">kami.app/…e17</span></div>
      </div>
      <div class="foot"><button class="btn ghost" onclick="go(2)">← Back</button>
        <span class="count">25 copies · 25 Kami links · 1 master doc</span>
        <button class="btn" onclick="go(4)">Send it →</button></div>
    </section>
    <!-- STEP 4 : done -->
    <section class="panel" id="p4">
      <div class="eyebrow">Done</div>
      <div class="done-hd"><span class="tick">✓</span><div><div class="big">Sent in 12 seconds</div><div class="small">This used to be most of your Sunday afternoon.</div></div></div>
      <div class="prev">
        <div class="prevrow"><span class="st">Aisha R.</span><span class="ws">shared · opened in Kami</span><span class="lk" style="color:var(--good);background:var(--good-soft)">link ✓</span></div>
        <div class="prevrow"><span class="st">Marcus T.</span><span class="ws">shared · opened in Kami</span><span class="lk" style="color:var(--good);background:var(--good-soft)">link ✓</span></div>
        <div class="prevrow"><span class="st">Wei Lin G.</span><span class="ws">shared · opened in Kami</span><span class="lk" style="color:var(--good);background:var(--good-soft)">link ✓</span></div>
        <div class="prevrow"><span class="st">Daniel O.</span><span class="ws">shared · opened in Kami</span><span class="lk" style="color:var(--good);background:var(--good-soft)">link ✓</span></div>
        <div class="prevrow" style="color:var(--soft);justify-content:center">…and 21 more</div>
      </div>
      <div class="master">📋 <span><strong style="color:var(--ink)">Term 3 · Worksheet Links</strong> — master doc updated with all 25 links</span></div>
      <div class="foot"><button class="btn ghost" onclick="go(1)">↺ Run another week</button></div>
    </section>
  </main>
</div>
<script>
function go(n){
  for(var i=1;i<=4;i++){
    document.getElementById('p'+i).className='panel'+(i===n?' on':'');
    var r=document.getElementById('r'+i);
    r.className='rstep'+(i===n?' on':(i<n?' done':''));
  }
  document.querySelector('.main').scrollTop=0;
}
function mark(sel){
  sel.className=sel.value?'set':'';
  var sels=document.querySelectorAll('#p1 select');
  var done=0; sels.forEach(function(s){if(s.value)done++;});
  document.getElementById('c1').textContent=done+' of '+sels.length+' classes matched';
}
function tally(){
  var boxes=document.querySelectorAll('#p2 input[type=checkbox]');
  var n=0; var ga=0, ge=0;
  boxes.forEach(function(b){if(b.checked){n++; if(b.dataset.g==='a')ga++; else ge++;}});
  document.getElementById('c2').textContent=n+' students selected';
  document.getElementById('ct-a').textContent=ga+' included';
  document.getElementById('ct-e').textContent=ge+' included';
}
tally();
</script>
</body></html>`;
