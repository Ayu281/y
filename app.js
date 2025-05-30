const PAIR_MAP = {
  'EUR/USD': 'EURUSD', 'USD/JPY': 'USDJPY', 'GBP/USD': 'GBPUSD', 'AUD/NZD': 'AUDNZD',
  'AUD/JPY': 'AUDJPY', 'EUR/JPY': 'EURJPY', 'NZD/USD': 'NZDUSD', 'USD/CHF': 'USDCHF',
  'CAD/JPY': 'CADJPY', 'GBP/JPY': 'GBPJPY', 'EUR/GBP': 'EURGBP', 'EUR/AUD': 'EURAUD',
  'AUD/CAD': 'AUDCAD', 'GBP/AUD': 'GBPAUD', 'NZD/JPY': 'NZDJPY', 'EUR/CHF': 'EURCHF',
  'USD/CAD': 'USDCAD', 'AUD/USD': 'AUDUSD', 'CHF/JPY': 'CHFJPY', 'GBP/CHF': 'GBPCHF',
  'NZD/CAD': 'NZDCAD', 'USD/SGD': 'USDSGD', 'EUR/NZD': 'EURNZD', 'GBP/NZD': 'GBPNZD',
  'CAD/CHF': 'CADCHF'
};

const API_URL = "https://corsproxy.io/?https://www.myfxbook.com/api/get-community-outlook.json?session=9UtvFTG9S31Z4vO1aDW31671626";

function fetchMyfxbookData() {
  fetch(API_URL)
    .then(res => res.json())
    .then(json => {
      // Map longPercentage/shortPercentage to buy/sell
      const data = (json.symbols || []).map(s => ({
        name: s.name,
        buy: s.longPercentage,
        sell: s.shortPercentage
      }));
      renderKotakAnomali(data);
      renderKotakSinyalHariIni(data);
    })
    .catch(err => {
      document.getElementById("signal-output").innerText = "Gagal ambil sinyal: " + err;
      document.getElementById("anomali-output").innerText = "Gagal ambil anomali: " + err;
      console.error(err);
    });
}

function renderKotakAnomali(data) {
  const pairSelected = document.getElementById("pair").value;
  const pairKey = PAIR_MAP[pairSelected] || pairSelected.replace("/", "");
  const found = data.find(p => p.name === pairKey);
  const anomaliOutput = document.getElementById("anomali-output");

  if (found && (typeof found.buy === "number") && (typeof found.sell === "number")) {
    // Anomali = yang prosentasenya lebih kecil, Tujuan = yang lebih besar
    let tujuan, anomali, tujuanValue, anomaliValue;
    if (found.buy > found.sell) {
      tujuan = "BUY";
      tujuanValue = found.buy;
      anomali = "SELL";
      anomaliValue = found.sell;
    } else {
      tujuan = "SELL";
      tujuanValue = found.sell;
      anomali = "BUY";
      anomaliValue = found.buy;
    }

    anomaliOutput.innerHTML = `
      <div class="row-x"><span class="label-x">PAIR:</span> <span class="value-x">${pairSelected}</span></div>
      <div class="row-x"><span class="label-x">Anomali:</span> <span class="value-x ${anomali === "BUY" ? "green" : "red"}">${anomali} (${anomaliValue}%)</span></div>
      <div class="row-x"><span class="label-x">Tujuan:</span> <span class="value-x ${tujuan === "BUY" ? "green" : "red"}">${tujuan} (${tujuanValue}%)</span></div>
      <div class="subsection-x">
        <div class="sub-label-x">Sumber Data:</div>
        <ul class="datasource-x">
          <li>MyFXBook <span class="stats-x">buy ${found.buy}% sell ${found.sell}%</span></li>
        </ul>
      </div>
    `;
  } else {
    anomaliOutput.innerHTML = "<i>Belum ada sinyal untuk pair ini.</i>";
  }
}

function renderKotakSinyalHariIni(data) {
  // Filter semua data yang buy >= 70 atau sell >= 70
  const filtered = data.filter(p => ((p.buy >= 70) || (p.sell >= 70)));
  const output = filtered.map(p => {
    let signal = p.buy >= p.sell ? "BUY" : "SELL";
    return `<div class="row-x">
      <span class="label-x" style="min-width:60px;">${p.name}:</span>
      <span class="value-x ${signal === "BUY" ? "green" : "red"}">${signal}</span>
    </div>`;
  }).join('') || "<i>Tidak ada sinyal dengan kriteria (≥ 70%)</i>";
  document.getElementById("signal-output").innerHTML = output;
}

// Kosongkan kotak news
function kosongkanNews() {
  document.getElementById("news-output").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("pair").addEventListener("change", () => {
    fetchMyfxbookData();
  });
  fetchMyfxbookData();
  kosongkanNews();

  // AUTO-REFRESH setiap 5 menit (300000 ms)
  setInterval(() => {
    fetchMyfxbookData();
  }, 300000); // 300000 ms = 5 menit
});
