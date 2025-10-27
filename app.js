document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  /* -----------------------------
     Core Parameters
  ----------------------------- */
  function params() {
    return {
      ct: +$('ctVolume').value,
      model: $('supportModel').value,
      blueRate: +$('blueRate').value / 100,
      overhead: +$('overhead').value / 100,
      rateSpecialist: +$('rateSpecialist').value,
      rateNavigator: +$('rateNavigator').value,
      ratePCP: +$('ratePCP').value,
      thynkEff: +$('thynkEff').value / 100,
      rateThynkSpec: +$('rateThynkSpec').value,
      rateThynkNav: +$('rateThynkNav').value
    };
  }

  function availMinutes(overhead) {
    // 1920 working hours per year × 60 minutes
    return 1920 * 60 * (1 - overhead);
  }

  /* -----------------------------
     Module dataset
  ----------------------------- */
  const modules = [
    { name: "Pulmonary Nodules (IPN)", role: "Navigator", red: 5, amber: 20, green: 110 },
    { name: "Lung Cancer Screening (LCS)", role: "Navigator", red: 4, amber: 15, green: 86 },
    { name: "Aneurysm (AAA/TAA)", role: "Specialist", red: 2, amber: 8, green: 30 },
    { name: "Thyroid (TI-RADS)", role: "Specialist", red: 4, amber: 50, green: 110 },
    { name: "Interstitial Lung Abnormalities (ILA)", role: "Specialist", red: 2, amber: 12, green: 40 }
  ];

  const timePerCase = { blue: 1, green: 2, amber: 5, red: 10 };

  /* -----------------------------
     Main Calculation
  ----------------------------- */
  function calc() {
    const p = params();
    const scale = p.ct / 1000;
    const activeModules = modules;
    const fmt = x => x.toLocaleString(undefined, { maximumFractionDigits: 0 });
    const money = x => "$" + x.toLocaleString(undefined, { maximumFractionDigits: 0 });

    let minByRole = { Specialist: 0, Navigator: 0 };
    let agg = { total: 0, red: 0, amber: 0, green: 0, blue: 0 };

    const rows = activeModules.map(m => {
      const red = m.red * scale;
      const amber = m.amber * scale;
      const green = m.green * scale;
      const total = red + amber + green;
      const blue = total * p.blueRate;
      const adj = total - blue;

      agg.total += total;
      agg.red += red;
      agg.amber += amber;
      agg.green += green;
      agg.blue += blue;

      ["red", "amber", "green", "blue"].forEach(level => {
        const min = timePerCase[level] * (level === "blue" ? blue : m[level] * scale);
        minByRole[m.role] += min;
      });

      return { ...m, red, amber, green, blue, total };
    });

    // FTE / Cost Calculations
    const avail = availMinutes(p.overhead);
    const fteSpec = minByRole.Specialist / avail;
    const fteNav = minByRole.Navigator / avail;
    const totalFTE = fteSpec + fteNav;

    const hospCost =
      Math.ceil(fteSpec) * p.rateSpecialist * 1920 +
      Math.ceil(fteNav) * p.rateNavigator * 1920;

    const thynkCost =
      Math.ceil(fteSpec * (1 - p.thynkEff)) * p.rateThynkSpec * 1920 +
      Math.ceil(fteNav * (1 - p.thynkEff)) * p.rateThynkNav * 1920;

    /* -----------------------------
       Render Outputs
    ----------------------------- */
    $('kpis').innerHTML = `
      <div class="card text-center"><h3 class="text-thynk-blue font-semibold text-sm uppercase mb-1">Hospital Cost</h3><p class="text-2xl font-extrabold text-gray-800">${money(hospCost)}</p><p class="text-xs text-gray-500">${fmt(Math.ceil(totalFTE))} FTE</p></div>
      <div class="card text-center"><h3 class="text-thynk-green font-semibold text-sm uppercase mb-1">Thynk Managed</h3><p class="text-2xl font-extrabold text-gray-800">${money(thynkCost)}</p><p class="text-xs text-gray-500">${fmt(Math.ceil(totalFTE * (1 - p.thynkEff)))} FTE (efficiency gain)</p></div>
      <div class="card text-center"><h3 class="text-gray-600 font-semibold text-sm uppercase mb-1">Savings</h3><p class="text-2xl font-extrabold text-green-600">${money(hospCost - thynkCost)}</p></div>
    `;

    $('workflow').innerHTML = renderWorkflow(p.model);

    $('table').innerHTML = `
      <h3 class="text-lg font-semibold mb-3 text-gray-700">Module Breakdown</h3>
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="text-left p-2">Module</th>
            <th class="text-right p-2">Red</th>
            <th class="text-right p-2">Amber</th>
            <th class="text-right p-2">Green</th>
            <th class="text-right p-2">Blue</th>
            <th class="text-right p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr class="border-b">
              <td class="p-2 text-left">${r.name}</td>
              <td class="p-2 text-right text-red-600 font-medium">${fmt(r.red)}</td>
              <td class="p-2 text-right text-orange-600 font-medium">${fmt(r.amber)}</td>
              <td class="p-2 text-right text-green-600 font-medium">${fmt(r.green)}</td>
              <td class="p-2 text-right text-blue-600 font-medium">${fmt(r.blue)}</td>
              <td class="p-2 text-right font-semibold">${fmt(r.total)}</td>
            </tr>
          `).join('')}
          <tr class="bg-gray-100 font-bold text-gray-800">
            <td class="p-2 text-left">All Modules</td>
            <td class="p-2 text-right">${fmt(agg.red)}</td>
            <td class="p-2 text-right">${fmt(agg.amber)}</td>
            <td class="p-2 text-right">${fmt(agg.green)}</td>
            <td class="p-2 text-right">${fmt(agg.blue)}</td>
            <td class="p-2 text-right">${fmt(agg.total)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  /* -----------------------------
     Workflow Diagram
  ----------------------------- */
  function renderWorkflow(model) {
    const node = (icon, label, color) =>
      `<div class="flex flex-col items-center text-center w-28">
        <div class="rounded-full w-14 h-14 flex items-center justify-center bg-${color}-100 border-2 border-${color}-300 shadow-sm">
          <i class="fas ${icon} text-${color}-500"></i>
        </div>
        <p class="text-xs mt-2 text-gray-700">${label}</p>
      </div>`;
    const arrow = `<i class="fas fa-angle-right text-gray-400 fa-lg"></i>`;
    if (model === "thynk_managed") {
      return `
        <div class="flex justify-center items-center gap-3 flex-wrap">
          ${node("fa-file-medical-alt", "Ingestion", "blue")}
          ${arrow}
          ${node("fa-brain", "Thynk Intelligence", "purple")}
          ${arrow}
          ${node("fa-headset", "Thynk Team", "purple")}
          ${arrow}
          ${node("fa-check-circle", "Loop Closed", "green")}
        </div>`;
    } else {
      return `
        <div class="flex justify-center items-center gap-3 flex-wrap">
          ${node("fa-file-medical-alt", "Ingestion", "blue")}
          ${arrow}
          ${node("fa-brain", "Thynk Intelligence", "blue")}
          ${arrow}
          ${node("fa-users", "Hospital Staff", "green")}
          ${arrow}
          ${node("fa-check-circle", "Loop Closed", "green")}
        </div>`;
    }
  }

  $('calcBtn').addEventListener("click", calc);
  calc();
});
