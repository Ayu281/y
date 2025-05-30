const PAIR_MAP = {
  'EUR/USD': 'EURUSD', 'USD/JPY': 'USDJPY', 'GBP/USD': 'GBPUSD', 'AUD/USD': 'AUDUSD',
  'USD/CHF': 'USDCHF', 'NZD/USD': 'NZDUSD', 'USD/CAD': 'USDCAD',
  'EUR/JPY': 'EURJPY', 'EUR/GBP': 'EURGBP', 'EUR/AUD': 'EURAUD', 'EUR/CHF': 'EURCHF',
  'EUR/CAD': 'EURCAD', 'EUR/NZD': 'EURNZD',
  'GBP/JPY': 'GBPJPY', 'GBP/AUD': 'GBPAUD', 'GBP/CHF': 'GBPCHF', 'GBP/CAD': 'GBPCAD', 'GBP/NZD': 'GBPNZD',
  'AUD/JPY': 'AUDJPY', 'AUD/NZD': 'AUDNZD', 'AUD/CAD': 'AUDCAD', 'AUD/CHF': 'AUDCHF',
  'NZD/JPY': 'NZDJPY', 'NZD/CAD': 'NZDCAD', 'NZD/CHF': 'NZDCHF',
  'CAD/JPY': 'CADJPY', 'CAD/CHF': 'CADCHF',
  'CHF/JPY': 'CHFJPY',
  // Komoditas
  'XAU/USD': 'XAUUSD', // Emas
  'WTI/USD': 'WTIUSD', // WTI Oil
  'OIL/USD': 'OILUSD', // Oil (jika ada)
  // Indeks
  'US30': 'US30', // Dow Jones
};

const PAIR_UMUM = [
  // Major
  "EURUSD", "USDJPY", "GBPUSD", "AUDUSD", "USDCHF", "NZDUSD", "USDCAD",
  // Minor
  "EURJPY", "EURGBP", "EURCHF", "EURCAD", "EURAUD", "EURNZD",
  "GBPJPY", "GBPAUD", "GBPCHF", "GBPCAD", "GBPNZD",
  "AUDJPY", "AUDNZD", "AUDCAD", "AUDCHF",
  "NZDJPY", "NZDCAD", "NZDCHF",
  "CADJPY", "CADCHF", "CHFJPY",
  // Komoditas
  "XAUUSD", "WTIUSD", "OILUSD",
  // Indeks utama
  "US30"
];

const API_URL = "https://corsproxy.io/?https://www.myfxbook.com/api/get-community-outlook.json?session=9UtvFTG9S31Z4vO1aDW31671626";



async function fetchMyfxbookData() {
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    // Gunakan longPercentage/shortPercentage
    const data = (json.symbols || []).map(s => ({
      name: s.name,
      buy: s.longPercentage,
      sell: s.shortPercentage
    }));
    renderKotakAnomali(data);
    renderKotakSinyalHariIni(data);
  } catch (err) {
    document.getElementById("signal-output").innerText = "Gagal ambil sinyal: " + err;
    document.getElementById("anomali-output").innerText = "Gagal ambil anomali: " + err;
    console.error(err);
  }
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
  // Filter: hanya PAIR_UMUM (mayor, minor, komoditas, indeks utama) dan buy/sell ≥ 70%
  const filtered = data.filter(
    p => PAIR_UMUM.includes(p.name) && (p.buy >= 70 || p.sell >= 70)
  );
  const output = filtered.map(p => {
    let signal = p.buy >= p.sell ? "BUY" : "SELL";
    return `<div class="row-x">
      <span class="label-x" style="min-width:60px;">${p.name}:</span>
      <span class="value-x ${signal === "BUY" ? "green" : "red"}">${signal}</span>
    </div>`;
  }).join('') || "<i>Tidak ada sinyal dengan kriteria (≥ 70%)</i>";
  document.getElementById("signal-output").innerHTML = output;
  // Pastikan tombol refresh tetap ada
  setTimeout(injectRefreshButton, 100);
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

  // Inject tombol refresh saat pertama load
  setTimeout(injectRefreshButton, 500);

  // AUTO-REFRESH setiap 5 menit (300000 ms)
  setInterval(() => {
    fetchMyfxbookData();
  }, 300000); // 300000 ms = 5 menit
});
