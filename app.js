document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

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
    return 1920 * 60 * (1 - overhead);
  }

  function calc() {
    const p = params();

    // Assume 1k cases need ~3 min each (dummy model)
    const baseMinutes = (p.ct / 1000) * 3 * 1000;
    const avail = availMinutes(p.overhead);

    // FTEs hospital vs Thynk (Thynk gains efficiency)
    const hospFTE = baseMinutes / avail;
    const thynkFTE = hospFTE * (1 - p.thynkEff);

    const hospCost =
      Math.ceil(hospFTE / 2) * p.rateNavigator * 1920 +
      Math.ceil(hospFTE / 2) * p.rateSpecialist * 1920;

    const thynkCost =
      Math.ceil(thynkFTE / 2) * p.rateThynkNav * 1920 +
      Math.ceil(thynkFTE / 2) * p.rateThynkSpec * 1920;

    // Render simple cards
    $('kpis').innerHTML = `
      <div class="card text-center"><h3 class="text-thynk-blue font-bold text-lg">Hospital Cost</h3><p class="text-2xl font-extrabold">$${hospCost.toLocaleString()}</p></div>
      <div class="card text-center"><h3 class="text-thynk-green font-bold text-lg">Thynk Managed Cost</h3><p class="text-2xl font-extrabold">$${thynkCost.toLocaleString()}</p></div>
      <div class="card text-center"><h3 class="text-gray-700 font-bold text-lg">Savings</h3><p class="text-2xl font-extrabold text-green-600">$${(hospCost - thynkCost).toLocaleString()}</p></div>
    `;

    $('workflow').innerHTML = renderWorkflow(p.model);
  }

  function renderWorkflow(model) {
    const node = (icon, text, color) =>
      `<div class="flex flex-col items-center">
        <div class="rounded-full w-14 h-14 flex items-center justify-center bg-${color}-100 border-2 border-${color}-400 shadow-sm">
          <i class="fas ${icon} text-${color}-500"></i>
        </div>
        <p class="text-xs mt-2">${text}</p>
      </div>`;

    const arrow = `<i class="fas fa-angle-right text-gray-400"></i>`;

    if (model === "thynk_managed") {
      return `
        <div class="flex items-center justify-center gap-4 flex-wrap">
          ${node("fa-file-medical-alt","Ingestion","blue")}
          ${arrow}
          ${node("fa-brain","Thynk Intelligence","purple")}
          ${arrow}
          ${node("fa-user-headset","Thynk Team","purple")}
          ${arrow}
          ${node("fa-check-circle","Loop Closed","green")}
        </div>`;
    } else {
      return `
        <div class="flex items-center justify-center gap-4 flex-wrap">
          ${node("fa-file-medical-alt","Ingestion","blue")}
          ${arrow}
          ${node("fa-brain","Thynk Intelligence","blue")}
          ${arrow}
          ${node("fa-users","Hospital Staff","green")}
          ${arrow}
          ${node("fa-check-circle","Loop Closed","green")}
        </div>`;
    }
  }

  $('calcBtn').addEventListener("click", calc);
  calc();
});
