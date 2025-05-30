const fetch = require('node-fetch');

// ==== KONFIGURASI WAJIB ====
// Masukkan token bot telegram kamu di sini
const TELEGRAM_BOT_TOKEN = "ISI_TOKEN_BOT_KAMU";
// Masukkan username channel kamu (misal: @namachannel) atau chat_id
const CHANNEL_ID = "@ISI_USERNAME_CHANNEL_KAMU";
// Masukkan session key Myfxbook kamu di sini
const MYFXBOOK_SESSION_KEY = "ISI_SESSION_KEY_MYFXBOOK_KAMU";
// Pair yang diizinkan
const allowedPairs = [
  "EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDJPY", "USDCHF", "USDCAD",
  "EURGBP", "EURJPY", "EURAUD", "EURCAD", "EURCHF", "EURNZD",
  "GBPJPY", "GBPAUD", "GBPCAD", "GBPCHF", "GBPNZD",
  "AUDJPY", "AUDNZD", "AUDCAD", "AUDCHF",
  "CADJPY", "CHFJPY", "NZDJPY", "NZDCAD", "NZDCHF",
  "XAUUSD", "WTI", "OIL"
];

// Untuk mencegah spam sinyal berulang dalam 6 jam
let lastSent = {};

// Ambil data dari API Myfxbook
async function fetchMyfxbookData() {
  const url = `https://www.myfxbook.com/api/get-community-outlook.json?session=${MYFXBOOK_SESSION_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Gagal fetch dari Myfxbook');
  const json = await resp.json();
  if (!json.data) throw new Error('Format data salah atau session key salah');
  return json.data; // data: [{name, longPercentage, shortPercentage, avgPrice, ...}]
}

// Kirim pesan ke Telegram
async function sendSignalToTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: "Markdown"
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error("Gagal kirim ke Telegram:", err);
    return null;
  }
  return await resp.json();
}

// Fungsi hitung pip (untuk 5 desimal pair mayor)
function pipToPrice(pips) {
  return pips * 0.0001;
}

// Main function
async function mainLoop() {
  try {
    const data = await fetchMyfxbookData();

    for (const sinyal of data) {
      const pair = (sinyal.name || '').toUpperCase();
      if (!allowedPairs.includes(pair)) continue;

      const buy = parseFloat(sinyal.longPercentage);
      const sell = parseFloat(sinyal.shortPercentage);
      const currentPrice = parseFloat(sinyal.avgPrice);

      let type = "";
      if (buy >= 70) type = "BUY";
      else if (sell >= 70) type = "SELL";
      else continue;

      // Cegah spam (per pair & type per 6 jam)
      const key = `${pair}-${type}`;
      const now = Date.now();
      if (lastSent[key] && now - lastSent[key] < 6 * 3600 * 1000) continue;

      // Hitung Entry, TP, SL
      let entry, tp1, tp2, tp3, sl1, text, icon;
      if (type === "BUY") {
        entry = (currentPrice - pipToPrice(20)).toFixed(5);
        tp1 = (parseFloat(entry) + pipToPrice(20)).toFixed(5);
        tp2 = (parseFloat(entry) + pipToPrice(50)).toFixed(5);
        tp3 = (parseFloat(entry) + pipToPrice(100)).toFixed(5);
        sl1 = (parseFloat(entry) - pipToPrice(20)).toFixed(5);
        icon = "📈";
      } else {
        entry = (currentPrice + pipToPrice(20)).toFixed(5);
        tp1 = (parseFloat(entry) - pipToPrice(20)).toFixed(5);
        tp2 = (parseFloat(entry) - pipToPrice(50)).toFixed(5);
        tp3 = (parseFloat(entry) - pipToPrice(100)).toFixed(5);
        sl1 = (parseFloat(entry) + pipToPrice(20)).toFixed(5);
        icon = "📉";
      }

      // Format pesan Telegram seperti di channel
      text = `➤ *New signal ${pair} : ${type}* ${icon}
Entry: ${entry}

Take Profit:
TP1: ${tp1}
TP2: ${tp2}
TP3: ${tp3}

Stop Loss:
SL1: ${sl1}
SL2: 50 pips dari harga entry`;

      // Kirim ke Telegram
      await sendSignalToTelegram(text);

      // Simpan waktu kirim
      lastSent[key] = now;
    }

    console.log("Sinyal diproses pada", new Date());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

// Jalankan sekali setiap 10 menit
mainLoop();
setInterval(mainLoop, 10 * 60 * 1000);