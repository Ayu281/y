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
  'XAU/USD': 'XAUUSD', 'WTI/USD': 'WTIUSD', 'OIL/USD': 'OILUSD', 'US30': 'US30'
};

const PAIR_UMUM = [
  "EURUSD", "USDJPY", "GBPUSD", "AUDUSD", "USDCHF", "NZDUSD", "USDCAD",
  "EURJPY", "EURGBP", "EURCHF", "EURCAD", "EURAUD", "EURNZD",
  "GBPJPY", "GBPAUD", "GBPCHF", "GBPCAD", "GBPNZD",
  "AUDJPY", "AUDNZD", "AUDCAD", "AUDCHF",
  "NZDJPY", "NZDCAD", "NZDCHF",
  "CADJPY", "CADCHF", "CHFJPY",
  "XAUUSD", "WTIUSD", "OILUSD", "US30"
];

const API_URL = "https://corsproxy.io/?https://www.myfxbook.com/api/get-community-outlook.json?session=9UtvFTG9S31Z4vO1aDW31671626";

async function fetchMyfxbookData() {
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
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
    let tujuan, anomali;
    if (found.buy > found.sell) {
      tujuan = "BUY";
      anomali = "SELL";
    } else {
      tujuan = "SELL";
      anomali = "BUY";
    }
    anomaliOutput.innerHTML = `
      <div class="anomali-center">
        <div class="anomali-pair">${pairKey}</div>
        <div class="anomali-label">Anomali</div>
        <div class="anomali-value ${anomali === "BUY" ? "green" : "red"}">${anomali}</div>
        <div class="anomali-label">Tujuan</div>
        <div class="anomali-value ${tujuan === "BUY" ? "green" : "red"}">${tujuan}</div>
      </div>
    `;
  } else {
    anomaliOutput.innerHTML = `<div class="anomali-center"><i>Belum ada sinyal untuk pair ini.</i></div>`;
  }
}

function renderKotakSinyalHariIni(data) {
  // Pair mayor/minor/komoditas/indeks utama, buy/sell ≥ 70%
  const filtered = data.filter(
    p => PAIR_UMUM.includes(p.name) && (p.buy >= 70 || p.sell >= 70)
  );
  const output = filtered.map(p => {
    let signal = p.buy >= p.sell ? "BUY" : "SELL";
    let percent = p.buy >= p.sell ? p.buy : p.sell;
    return `<div class="row-x">
      <span class="label-x" style="min-width:60px;">${p.name}:</span>
      <span class="value-x ${signal === "BUY" ? "green" : "red"}">${signal} ${percent}%</span>
    </div>`;
  }).join('') || "<i>Tidak ada sinyal dengan kriteria (≥ 70%)</i>";
  document.getElementById("signal-output").innerHTML = output;
}

function kosongkanNews() {
  document.getElementById("news-output").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("pair").addEventListener("change", fetchMyfxbookData);
  fetchMyfxbookData();
  kosongkanNews();
  setInterval(fetchMyfxbookData, 300000); // auto-refresh 5 menit
});
