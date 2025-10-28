document.addEventListener('DOMContentLoaded', () => {
  // ---------- Helpers ----------
  const $ = id => document.getElementById(id);
  const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const on = (id, evt, fn) => { const el = $(id); if (el) el.addEventListener(evt, fn); };
  const money = x => '$' + (x||0).toLocaleString(undefined,{maximumFractionDigits:0});
  const fmt0  = x => (x||0).toLocaleString(undefined,{maximumFractionDigits:0});
  const availMinutes = ovh => 1920*60*(1-ovh);

  // ---------- Clinical definitions ----------
  const clinical = {
    ADR:{red:{def:'Mass >4cm or suspicious (e.g., >10 HU non-contrast).',rec:'Urgent endocrine & likely surgical consult.'},
         amber:{def:'1–4cm indeterminate.',rec:'Adrenal protocol CT/MRI; endocrine referral.'},
         green:{def:'<1cm or clear adenoma.',rec:'Consider annual imaging only if indicated.'},
         blue:{def:'Already characterized / under endocrine follow-up.',rec:'Continue plan.'}},
    AAA:{red:{def:'AAA ≥5.5cm, TAA ≥6.0cm, or growth >0.5cm/yr.',rec:'Urgent vascular surgery eval.'},
         amber:{def:'AAA 4.0–5.4; TAA 4.5–5.9.',rec:'Semi-annual US; consider vascular.'},
         green:{def:'AAA 3.0–3.9.',rec:'Annual US.'},
         blue:{def:'Program/post-EVAR/TEVAR.',rec:'Follow program cadence.'}},
    BWL:{red:{def:'Focal/asymmetric thickening → malignancy.',rec:'Colonoscopy/CTE; urgent GI.'},
         amber:{def:'Inflammatory pattern.',rec:'Clinical correlation; consider GI.'},
         green:{def:'Mild/reactive.',rec:'No action if asymptomatic.'},
         blue:{def:'IBD under GI.',rec:'Continue plan.'}},
    CAC:{red:{def:'Severe CAC (>400) or severe valve disease.',rec:'Urgent cardiology.'},
         amber:{def:'Moderate CAC (100–400) or valve disease.',rec:'Cardiology risk mgmt.'},
         green:{def:'Mild CAC (1–99) / mild valve.',rec:'Inform PCP; routine risk mgmt.'},
         blue:{def:'Known CAD/managed.',rec:'Verify statin intensity/adherence.'}},
    EMP:{red:{def:'Severe emphysema w/ exacerbation.',rec:'Urgent PCP/pulm.'},
         amber:{def:'Moderate emphysema.',rec:'PFTs & mgmt via PCP.'},
         green:{def:'Mild/trace.',rec:'Smoking cessation; inform PCP.'},
         blue:{def:'Managed/known COPD.',rec:'Follow COPD pathway.'}},
    GBL:{red:{def:'Wall thickening >3mm, mass, or ductal dilation.',rec:'GI/surg eval.'},
         amber:{def:'Polyp >1cm or moderate dilation.',rec:'US & surgical consult.'},
         green:{def:'Sludge/small polyps.',rec:'Usually incidental.'},
         blue:{def:'Known biliary under care.',rec:'Continue plan.'}},
    BRE:{red:{def:'BI-RADS 5.',rec:'Biopsy & surgical consult.'},
         amber:{def:'BI-RADS 4.',rec:'Biopsy; breast team.'},
         green:{def:'BI-RADS 3.',rec:'6-mo mammogram.'},
         blue:{def:'Enrolled in program.',rec:'Continue interval.'}},
    IPN:{red:{def:'≥8mm solid, new, or growing.',rec:'PET-CT and/or biopsy; pulm.'},
         amber:{def:'4–8mm solid/subsolid.',rec:'LDCT 3–6 mo (Fleischner).'},
         green:{def:'<4mm or stable.',rec:'No routine FU (Fleischner).'},
         blue:{def:'In surveillance.',rec:'Continue cadence.'}},
    ILA:{red:{def:'Fibrotic ILA w/ honeycombing.',rec:'Pulmonology for ILD.'},
         amber:{def:'Non-fibrotic ILA >5% zone.',rec:'Pulmonology eval.'},
         green:{def:'Trace ILA.',rec:'Inform PCP; no specific FU.'},
         blue:{def:'Known ILD/ILA under plan.',rec:'Continue pathway.'}},
    LIV:{red:{def:'LI-RADS 5 or new/growing in cirrhosis.',rec:'Hepatology/oncology.'},
         amber:{def:'LI-RADS 4 or indeterminate >1cm.',rec:'Multiphasic MRI/CT; GI/Hep.'},
         green:{def:'Simple cyst/hemangioma.',rec:'Benign; no FU.'},
         blue:{def:'Benign lesion under plan.',rec:'Continue plan.'}},
    LCS:{red:{def:'Lung-RADS 4B/4X.',rec:'Biopsy/diagnostic workup.'},
         amber:{def:'Lung-RADS 4A.',rec:'3-mo LDCT or PET/CT.'},
         green:{def:'Lung-RADS 3.',rec:'6-mo LDCT.'},
         blue:{def:'Enrolled in LCS.',rec:'Continue schedule.'}},
    LYM:{red:{def:'Necrotic / >1.5cm short axis.',rec:'Biopsy; oncology/ID as needed.'},
         amber:{def:'1–1.5cm.',rec:'3-mo imaging if indicated.'},
         green:{def:'Normal/reactive.',rec:'No FU unless indicated.'},
         blue:{def:'Known/reactive under care.',rec:'Continue plan.'}},
    OVR:{red:{def:'O-RADS 5.',rec:'Gyn-Onc urgently.'},
         amber:{def:'O-RADS 4.',rec:'Gyn consult; likely MRI.'},
         green:{def:'Simple cyst or O-RADS 3.',rec:'US FU by size/age.'},
         blue:{def:'Under Gyn/Gyn-Onc pathway.',rec:'Continue plan.'}},
    PAN:{red:{def:'Solid mass or cyst ≥3cm with worrisome features.',rec:'GI/surg onc.'},
         amber:{def:'Cyst 1–3cm no worrisome features.',rec:'MRCP 6–12 mo.'},
         green:{def:'Simple cyst <1cm.',rec:'No FU.'},
         blue:{def:'Under cyst/IPMN surveillance.',rec:'Continue cadence.'}},
    PRP:{red:{def:'PI-RADS 5 or EPE.',rec:'Urology (biopsy/staging).'},
         amber:{def:'PI-RADS 4.',rec:'Urology consult.'},
         green:{def:'BPH or PI-RADS 3.',rec:'PSA with PCP.'},
         blue:{def:'Active surveillance.',rec:'Continue plan.'}},
    REN:{red:{def:'Enhancing >4cm or Bosniak IV.',rec:'Urology surgical eval.'},
         amber:{def:'1–4cm enhancing or Bosniak III.',rec:'Urology; surveillance/treat.'},
         green:{def:'Simple cyst I/II; small non-enhancing.',rec:'No FU.'},
         blue:{def:'Under urology mgmt.',rec:'Continue plan.'}},
    SPL:{red:{def:'Growing/complex solid lesion.',rec:'Surgery or heme.'},
         amber:{def:'Indeterminate >1cm.',rec:'MRI characterization.'},
         green:{def:'Simple cyst/hemangioma.',rec:'No FU.'},
         blue:{def:'Stable/benign under care.',rec:'Continue plan.'}},
    THY:{red:{def:'TI-RADS 5.',rec:'FNA; endocrinology.'},
         amber:{def:'TI-RADS 4.',rec:'FNA; endocrine.'},
         green:{def:'TI-RADS 3.',rec:'US in 12 mo.'},
         blue:{def:'Under endocrine pathway.',rec:'Continue plan.'}},
    VFX:{red:{def:'>40% height loss/pathologic.',rec:'Ortho/spine urgently.'},
         amber:{def:'25–40% height loss.',rec:'PCP osteo mgmt; consider ortho.'},
         green:{def:'<25% height loss.',rec:'PCP osteoporosis eval.'},
         blue:{def:'Under endocrine/ortho care.',rec:'Continue plan.'}},
  };

  // ---------- References ----------
  const references = [
    {id:1, txt:'Fleischner Society 2017 pulmonary nodule guidelines [Radiology].'},
    {id:2, txt:'ACR Lung-RADS v2022.'},
    {id:3, txt:'Fleischner position paper on ILAs (2020).'},
    {id:4, txt:'ACC/AHA prevention; CAC thresholds.'},
    {id:5, txt:'2022 ACC/AHA Aortic Disease (AAA/TAA).'},
    {id:6, txt:'Bosniak v2019; ACR Incidental Renal Mass.'},
    {id:7, txt:'ACR/AGA pancreatic cyst management.'},
    {id:8, txt:'ACR Incidental Adrenal Mass.'},
    {id:9, txt:'ACR TI-RADS (2017; updates).'},
    {id:10, txt:'ACR LI-RADS / incidental liver.'},
    {id:11, txt:'ACR BI-RADS (5th ed.).'},
    {id:12, txt:'PI-RADS v2.1.'},
    {id:13, txt:'ACR O-RADS.'},
    {id:14, txt:'AGA: colonoscopy after diverticulitis.'},
    {id:15, txt:'GOLD COPD reports.'},
    {id:16, txt:'Incidental splenic lesion reviews.'},
    {id:17, txt:'SRU/ESGAR gallbladder polyp.'},
    {id:18, txt:'AACE VFA/osteoporosis.'},
    {id:19, txt:'ACR incidental lymphadenopathy.'}
  ];

  // ---------- Modules (all 19; ILA -> Specialist) ----------
  const modules = [
    { key:'IPN', name:'Incidental Pulmonary Nodule (Fleischner)', primaryRole:'Navigator', distro:{ red:5, amber:20, green:110 }, refs:[1] },
    { key:'LCS', name:'Lung Cancer Screening (Lung-RADS)', primaryRole:'Navigator', distro:{ red:4, amber:15, green:86 }, refs:[2] },
    { key:'ILA', name:'Interstitial Lung Abnormalities', primaryRole:'Specialist', distro:{ red:2, amber:12, green:40 }, refs:[3] },
    { key:'CAC', name:'Coronary Artery Calcification / Valvular', primaryRole:'Specialist', distro:{ red:10, amber:90, green:430 }, refs:[4] },
    { key:'AAA', name:'Aneurysm (AAA/TAA)', primaryRole:'Specialist', distro:{ red:2, amber:8, green:30 }, refs:[5] },
    { key:'REN', name:'Renal Mass/Bosniak', primaryRole:'Specialist', distro:{ red:8, amber:24, green:60 }, refs:[6] },
    { key:'PAN', name:'Pancreatic Cyst/Mass', primaryRole:'Specialist', distro:{ red:3, amber:12, green:35 }, refs:[7] },
    { key:'ADR', name:'Adrenal Incidentaloma', primaryRole:'Specialist', distro:{ red:1, amber:6, green:40 }, refs:[8] },
    { key:'THY', name:'Thyroid (TI-RADS)', primaryRole:'Specialist', distro:{ red:4, amber:50, green:110 }, refs:[9] },
    { key:'LIV', name:'Liver Lesion (LI-RADS ≥1cm/indeterminate)', primaryRole:'Specialist', distro:{ red:2, amber:15, green:80 }, refs:[10] },
    { key:'BRE', name:'Breast (BI-RADS 0,3–5)', primaryRole:'Navigator', distro:{ red:3, amber:20, green:60 }, refs:[11] },
    { key:'PRP', name:'Prostate (PI-RADS 4–5)', primaryRole:'Specialist', distro:{ red:3, amber:10, green:20 }, refs:[12] },
    { key:'OVR', name:'Ovarian Mass (O-RADS)', primaryRole:'Specialist', distro:{ red:2, amber:10, green:25 }, refs:[13] },
    { key:'BWL', name:'Bowel Wall Thickening', primaryRole:'Specialist', distro:{ red:2, amber:8, green:20 }, refs:[14] },
    { key:'EMP', name:'Emphysema/COPD', primaryRole:'Specialist', distro:{ red:1, amber:5, green:30 }, refs:[15] },
    { key:'SPL', name:'Splenic Lesion', primaryRole:'Specialist', distro:{ red:1, amber:4, green:10 }, refs:[16] },
    { key:'GBL', name:'Gallbladder Polyp', primaryRole:'Specialist', distro:{ red:1, amber:6, green:20 }, refs:[17] },
    { key:'VFX', name:'Vertebral Fracture', primaryRole:'Specialist', distro:{ red:1, amber:5, green:15 }, refs:[18] },
    { key:'LYM', name:'Lymphadenopathy (incidental)', primaryRole:'Specialist', distro:{ red:2, amber:10, green:30 }, refs:[19] }
  ].map(m => ({...m, on:true}));

  // ---------- Inputs ----------
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
  });

  // ---------- Render: workflow ----------
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

  // ---------- Render: modules ----------
  function renderModules(){
    const root = $('modules'); if(!root) return; root.innerHTML='';
    modules.forEach((m, i)=>{
      const rolePill = m.primaryRole==='Navigator'
        ? '<span class="pill pill-blue">Clinical Navigator</span>'
        : '<span class="pill pill-green">Resolution Specialist</span>';
      const defs = clinical[m.key];
      const refs = m.refs?.map(x=>`[${x}]`).join(', ')||'';

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
        </div>
      `;
      root.appendChild(card);
    });

    // Hooks
    root.querySelectorAll('.mod-toggle').forEach(cb=>{
      cb.addEventListener('change', e=>{
        const i = +e.target.dataset.i; modules[i].on = e.target.checked; calc();
      });
    });
    root.querySelectorAll('.mod-distro').forEach(inp=>{
      inp.addEventListener('input', e=>{
        const i = +e.target.dataset.i, k = e.target.dataset.k;
        modules[i].distro[k] = +e.target.value; calc();
      });
    });
    root.querySelectorAll('.exp').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const card = e.currentTarget.closest('.mod-card'); if(card) card.classList.toggle('expanded');
      });
    });
  }

  // ---------- Calculate & render outputs ----------
  function calc(){
    const p = params();
    renderWorkflow(p.model);

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

    const hospFteSpec = Math.ceil(fteSpec), hospFteNav=Math.ceil(fteNav);
    const hospCost = (hospFteSpec*(p.rateSpecialist||0)*1920)+(hospFteNav*(p.rateNavigator||0)*1920);

    const eff = Math.max(0,1-(p.thynkEff||0));
    const thynkFteSpec = avail? (minutesByRole.Specialist*eff)/avail : 0;
    const thynkFteNav  = avail? (minutesByRole.Navigator*eff)/avail  : 0;
    const thynkCost = (thynkFteSpec*(p.rateThynkSpec||0)*1920)+(thynkFteNav*(p.rateThynkNav||0)*1920);

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

    // Per-module details (minutes/FTE share)
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

  // ---------- Render references ----------
  setHTML('refs', references.map(r=>`<li>[${r.id}] ${r.txt}</li>`).join(''));

  // ---------- Wire inputs ----------
  [
    'ctVolume','supportModel','blueRate','overhead',
    'tBlue','tGreen','tAmber','tRed',
    'rateSpecialist','rateNavigator','ratePCP',
    'thynkEff','rateThynkSpec','rateThynkNav'
  ].forEach(id=>{ on(id,'input',calc); on(id,'change',calc); });

  on('recalc','click',calc);
  on('enableAll','click',()=>{ modules.forEach(m=>m.on=true); renderModules(); calc(); });
  on('disableAll','click',()=>{ modules.forEach(m=>m.on=false); renderModules(); calc(); });

  // ---------- Initial render ----------
  renderModules();
  renderWorkflow('thynk_managed');
  calc();
});
