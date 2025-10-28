document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const on = (id, evt, fn) => { const el = $(id); if (el) el.addEventListener(evt, fn); };
  const money = x => '$' + (x||0).toLocaleString(undefined,{maximumFractionDigits:0});
  const fmt0  = x => (x||0).toLocaleString(undefined,{maximumFractionDigits:0});
  const availMinutes = ovh => 1920*60*(1-ovh);

  // --- definitions omitted for brevity: same clinical, references, modules as previous version ---
  // (Keep your existing clinical, references, and modules blocks here – unchanged.)

  /* ====== definitions START ====== */
  const clinical = { /* ... keep same as before ... */ };
  const references = [ /* ... keep same as before ... */ ];
  const modules = [ /* ... keep same as before ... */ ].map(m => ({...m, on:true}));
  /* ====== definitions END ====== */

  // New: params for DIY EHR cost model
  const params = () => ({
    ct: +($('ctVolume')?.value ?? 0),
    model: $('supportModel')?.value ?? 'thynk_managed',
    blueRate: +( $('blueRate')?.value ?? 12)/100,
    overhead: +( $('overhead')?.value ?? 20)/100,
    t: {
      blue:+($('tBlue')?.value ?? 1),
      green:+($('tGreen')?.value ?? 2),
      amber:+($('tAmber')?.value ?? 5),
      red:+($('tRed')?.value ?? 10),
    },
    rateSpecialist:+($('rateSpecialist')?.value ?? 28),
    rateNavigator:+($('rateNavigator')?.value ?? 65),
    ratePCP:+($('ratePCP')?.value ?? 240),

    thynkEff:+($('thynkEff')?.value ?? 35)/100,
    rateThynkSpec:+($('rateThynkSpec')?.value ?? 24),
    rateThynkNav:+($('rateThynkNav')?.value ?? 55),

    // DIY EHR inputs
    epicBuild:+($('epicBuild')?.value ?? 600),          // hrs (IT)
    epicMaint:+($('epicMaint')?.value ?? 240),          // hrs/yr (IT)
    rateIT:+($('rateIT')?.value ?? 80),                 // $/hr IT
    rateSME:+($('rateSME')?.value ?? 120),              // $/hr clinical SME
    committeeHours:+($('committeeHours')?.value ?? 120),// one-time hrs (SME)
    roadmapDelay:+($('roadmapDelay')?.value ?? 6)       // months (friction)
  });

  function renderWorkflow(model){
    const node=(icon,txt,color)=>`<div class="flex flex-col items-center text-center w-28">
      <div class="rounded-full w-14 h-14 flex items-center justify-center bg-${color}-100 border-2 border-${color}-300 shadow-sm">
        <i class="fas ${icon} text-${color}-600"></i>
      </div><p class="text-xs mt-2 text-gray-700">${txt}</p></div>`;
    const arrow=`<i class="fas fa-angle-right text-gray-400 fa-lg"></i>`;
    const html=(model==='thynk_managed')
      ? node('fa-file-medical-alt','Ingestion','blue')+arrow+node('fa-brain','Thynk Intelligence','purple')+arrow+node('fa-headset','Thynk Team','purple')+arrow+node('fa-check-circle','Loop Closed','green')
      : node('fa-file-medical-alt','Ingestion','blue')+arrow+node('fa-brain','Thynk Intelligence','blue')+arrow+node('fa-users','Hospital Staff','green')+arrow+node('fa-check-circle','Loop Closed','green');
    setHTML('workflow', `<div class="flex justify-center items-center gap-3 flex-wrap">${html}</div>`);
  }

  function renderModules(){
    const root = $('modules'); if(!root) return; root.innerHTML='';
    modules.forEach((m, i)=>{
      const rolePill = m.primaryRole==='Navigator'
        ? '<span class="pill pill-blue">Clinical Navigator</span>'
        : '<span class="pill pill-green">Resolution Specialist</span>';
      const defs = clinical[m.key]; const refs = m.refs?.map(x=>`[${x}]`).join(', ')||'';
      const card = document.createElement('div');
      card.className = 'mod-card';
      card.innerHTML = `
        <div class="mod-header">
          <div class="flex items-center gap-3">
            <input type="checkbox" class="mod-toggle" data-i="${i}" ${m.on?'checked':''}>
            <span class="font-semibold">${m.name}</span>
            ${rolePill}
          </div>
          <button class="btn-ghost exp" data-i="${i}" aria-label="Expand"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <p class="hint col-span-2 lg:col-span-1">Findings per 1k CTs:</p>
          ${['red','amber','green'].map(k=>`
            <label class="flex items-center gap-2">
              <span class="w-14 text-sm font-semibold ${k==='red'?'text-red-600':k==='amber'?'text-orange-600':'text-green-700'} capitalize">${k}</span>
              <input type="number" class="input mod-distro" data-i="${i}" data-k="${k}" value="${m.distro[k]}" step="1">
            </label>`).join('')}
        </div>
        <div class="mod-details">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-red-50 border border-red-200"><h5 class="font-bold text-red-700">Red</h5>
              <p class="text-xs"><b>Definition:</b> ${defs.red.def}</p><p class="text-xs"><b>Recommendation:</b> ${defs.red.rec}</p></div>
            <div class="p-3 rounded-lg bg-orange-50 border border-orange-200"><h5 class="font-bold text-orange-700">Amber</h5>
              <p class="text-xs"><b>Definition:</b> ${defs.amber.def}</p><p class="text-xs"><b>Recommendation:</b> ${defs.amber.rec}</p></div>
            <div class="p-3 rounded-lg bg-green-50 border border-green-200"><h5 class="font-bold text-green-700">Green</h5>
              <p class="text-xs"><b>Definition:</b> ${defs.green.def}</p><p class="text-xs"><b>Recommendation:</b> ${defs.green.rec}</p></div>
            <div class="p-3 rounded-lg bg-blue-50 border border-blue-200"><h5 class="font-bold text-blue-700">Blue</h5>
              <p class="text-xs"><b>Definition:</b> ${defs.blue.def}</p><p class="text-xs"><b>Recommendation:</b> ${defs.blue.rec}</p></div>
          </div>
          <p class="hint mt-3">Guideline: ${refs||'—'}</p>
          <div class="mt-2 text-sm" id="mstats-${i}"></div>
        </div>`;
      root.appendChild(card);
    });
    root.querySelectorAll('.mod-toggle').forEach(cb=>cb.addEventListener('change', e=>{ modules[+e.target.dataset.i].on=e.target.checked; calc(); }));
    root.querySelectorAll('.mod-distro').forEach(inp=>inp.addEventListener('input', e=>{
      const i=+e.target.dataset.i, k=e.target.dataset.k; modules[i].distro[k]=+e.target.value; calc();
    }));
    root.querySelectorAll('.exp').forEach(btn=>btn.addEventListener('click', e=>{
      e.currentTarget.closest('.mod-card')?.classList.toggle('expanded');
    }));
  }

  function calc(){
    const p = params();
    renderWorkflow(p.model);

    // Volumes & minutes
    const active = modules.filter(m=>m.on);
    const scale = (p.ct||0)/1000;
    let agg = {red:0, amber:0, green:0, blue:0, total:0};
    let minutesByRole = { Specialist:0, Navigator:0 };
    const t = p.t;

    const rows = active.map(m=>{
      const red = (m.distro.red||0)*scale, amber=(m.distro.amber||0)*scale, green=(m.distro.green||0)*scale;
      const total = red+amber+green;
      const blue = total*(p.blueRate||0);
      const rem = total-blue, factor = rem/(total||1);
      const r=red*factor, a=amber*factor, g=green*factor;

      agg.red+=r; agg.amber+=a; agg.green+=g; agg.blue+=blue; agg.total+=total;

      const mins = r*t.red + a*t.amber + g*t.green + blue*t.blue;
      minutesByRole[m.primaryRole]+=mins;

      return {m, r,a,g, blue, total, minutes:mins};
    });

    const totalMinutes = minutesByRole.Specialist + minutesByRole.Navigator;
    const avail = availMinutes(p.overhead||0);
    const fteSpec = avail? minutesByRole.Specialist/avail : 0;
    const fteNav  = avail? minutesByRole.Navigator/avail  : 0;

    // Hospital labor cost (whole FTEs)
    const hospFteSpec = Math.ceil(fteSpec), hospFteNav=Math.ceil(fteNav);
    const hospCost = (hospFteSpec*(p.rateSpecialist||0)*1920)+(hospFteNav*(p.rateNavigator||0)*1920);

    // Thynk labor cost (fractional FTE, with efficiency)
    const eff = Math.max(0,1-(p.thynkEff||0));
    const thynkFteSpec = avail? (minutesByRole.Specialist*eff)/avail : 0;
    const thynkFteNav  = avail? (minutesByRole.Navigator*eff)/avail  : 0;
    const thynkCost = (thynkFteSpec*(p.rateThynkSpec||0)*1920)+(thynkFteNav*(p.rateThynkNav||0)*1920);

    // Share module costs
    rows.forEach(r=>{
      const share = totalMinutes? r.minutes/totalMinutes : 0;
      r.hospCost  = share*hospCost;
      r.thynkCost = share*thynkCost;
    });

    // KPIs
    setHTML('kpis', [
      `<div class="card text-center"><h3 class="text-thynk-blue font-semibold text-sm uppercase mb-1">Hospital Cost</h3><p class="text-2xl font-extrabold">${money(hospCost)}</p><p class="text-xs text-gray-500">${fmt0(hospFteSpec+hospFteNav)} FTE</p></div>`,
      `<div class="card text-center"><h3 class="text-thynk-green font-semibold text-sm uppercase mb-1">Thynk Managed</h3><p class="text-2xl font-extrabold">${money(thynkCost)}</p><p class="text-xs text-gray-500">${fmt0(thynkFteSpec+thynkFteNav)} FTE (fractional)</p></div>`,
      `<div class="card text-center"><h3 class="text-gray-600 font-semibold text-sm uppercase mb-1">Savings</h3><p class="text-2xl font-extrabold text-green-600">${money(hospCost - thynkCost)}</p></div>`
    ].join(''));

    // Table
    setHTML('table', `
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="text-left p-2">Module</th>
            <th class="text-right p-2">Red</th>
            <th class="text-right p-2">Amber</th>
            <th class="text-right p-2">Green</th>
            <th class="text-right p-2">Blue</th>
            <th class="text-right p-2">Total</th>
            <th class="text-right p-2">Hospital Cost</th>
            <th class="text-right p-2">Thynk Cost</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r=>`
            <tr class="border-b">
              <td class="p-2 text-left">${r.m.name}</td>
              <td class="p-2 text-right text-red-600 font-medium">${fmt0(r.r)}</td>
              <td class="p-2 text-right text-orange-600 font-medium">${fmt0(r.a)}</td>
              <td class="p-2 text-right text-green-700 font-medium">${fmt0(r.g)}</td>
              <td class="p-2 text-right text-blue-600 font-medium">${fmt0(r.blue)}</td>
              <td class="p-2 text-right font-semibold">${fmt0(r.total)}</td>
              <td class="p-2 text-right">${money(r.hospCost)}</td>
              <td class="p-2 text-right text-purple-800">${money(r.thynkCost)}</td>
            </tr>
          `).join('')}
          <tr class="bg-gray-100 font-bold text-gray-800">
            <td class="p-2 text-left">All Modules</td>
            <td class="p-2 text-right">${fmt0(agg.red)}</td>
            <td class="p-2 text-right">${fmt0(agg.amber)}</td>
            <td class="p-2 text-right">${fmt0(agg.green)}</td>
            <td class="p-2 text-right">${fmt0(agg.blue)}</td>
            <td class="p-2 text-right">${fmt0(agg.total)}</td>
            <td class="p-2 text-right">${money(hospCost)}</td>
            <td class="p-2 text-right">${money(thynkCost)}</td>
          </tr>
        </tbody>
      </table>
    `);

    // --- DIY EHR cost summary (left column card) ---
    const buildCost = (p.epicBuild * p.rateIT) + (p.epicBuild * 0.5 * p.rateSME);
    const annualMaintCost = (p.epicMaint * p.rateIT) + (p.epicMaint * 0.5 * p.rateSME);
    const committeeCost = p.committeeHours * p.rateSME; // one-time
    const annualized5yr = (buildCost/5) + annualMaintCost + (committeeCost/5);

    setHTML('ehrCostSummary', `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3 rounded-lg bg-gray-50 border"><div class="hint">One-time build (IT + 50% SME)</div><div class="font-semibold">${money(buildCost)}</div></div>
        <div class="p-3 rounded-lg bg-gray-50 border"><div class="hint">Annual maintenance (IT + 50% SME)</div><div class="font-semibold">${money(annualMaintCost)}</div></div>
        <div class="p-3 rounded-lg bg-gray-50 border"><div class="hint">SME committee (one-time)</div><div class="font-semibold">${money(committeeCost)}</div></div>
        <div class="p-3 rounded-lg bg-gray-50 border"><div class="hint">5-yr annualized EHR cost</div><div class="font-extrabold text-thynk-blue">${money(annualized5yr)}</div></div>
      </div>
      <p class="hint mt-2">Roadmap delay: ~${fmt0(p.roadmapDelay)} month(s) of internal waiting/coordination before go-live or rule changes.</p>
    `);

    // Per-module detail stats
    rows.forEach((r, i)=>{
      const totalMins = (minutesByRole.Specialist + minutesByRole.Navigator) || 1;
      const share = (r.minutes)/totalMins;
      const node = document.getElementById(`mstats-${i}`);
      if(node){
        node.innerHTML = `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><span class="hint">Module minutes</span><div class="font-semibold">${fmt0(r.minutes)}</div></div>
            <div><span class="hint">All-module minutes</span><div class="font-semibold">${fmt0(totalMins)}</div></div>
            <div><span class="hint">Module FTE share</span><div class="font-semibold">${(share*100).toFixed(1)}%</div></div>
            <div><span class="hint">Primary role</span><div class="font-semibold">${r.m.primaryRole}</div></div>
          </div>`;
      }
    });
  }

  // refs list
  setHTML('refs', references.map(r=>`<li>[${r.id}] ${r.txt}</li>`).join(''));

  // listeners
  [
    'ctVolume','supportModel','blueRate','overhead',
    'tBlue','tGreen','tAmber','tRed',
    'rateSpecialist','rateNavigator','ratePCP',
    'thynkEff','rateThynkSpec','rateThynkNav',
    'epicBuild','epicMaint','rateIT','rateSME','committeeHours','roadmapDelay'
  ].forEach(id=>{ on(id,'input',calc); on(id,'change',calc); });

  on('recalc','click',calc);
  on('enableAll','click',()=>{ modules.forEach(m=>m.on=true); renderModules(); calc(); });
  on('disableAll','click',()=>{ modules.forEach(m=>m.on=false); renderModules(); calc(); });

  // init
  renderModules();
  renderWorkflow('thynk_managed');
  calc();
});
