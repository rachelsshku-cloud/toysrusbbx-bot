const axios = require('axios');
const express = require('express');

// 建構極簡 Web 伺服器供 Render 健康檢查
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Beyblade Telegram Bot 運作中...');
});

app.listen(PORT, () => {
  console.log(`[HTTP Server] 伺服器已啟動，監聽 Port ${PORT}`);
});

// 監控設定
const PRODUCT_URL = 'https://www.toysrus.com.hk/zh-hk/10173908.html';
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8928385353:AAG0SAsnoB8oiNjzPSTpFPdEtRVf-YnmVoQ';
const CHAT_ID = process.env.CHAT_ID || '1086465918'; 
const CHECK_INTERVAL = 5000; // 5 秒監控一次

let isAlerted = false;

async function checkStock() {
  try {
    const response = await axios.get(PRODUCT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      },
      timeout: 10000
    });

    const html = response.data;
    const isOutOfStock = html.includes('缺貨') || html.includes('暫時缺貨') || html.includes('Out of stock');
    const currentTime = new Date().toLocaleTimeString();

    if (!isOutOfStock && !isAlerted) {
      isAlerted = true;
      const msg = `🚨 **BEYBLADE 補貨/有貨！** 🚨\n\n購買連結: ${PRODUCT_URL}`;
      
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🛒 立即前往 Toys R Us 搶購', url: PRODUCT_URL }]]
        }
      });
      console.log(`[${currentTime}] 🎉 已成功發送 Telegram 搶購通知！`);
    } else if (isOutOfStock) {
      console.log(`[${currentTime}] 監控中... 目前狀態：缺貨`);
      isAlerted = false; 
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] 抓取失敗:`, err.message);
  }
}

setInterval(checkStock, CHECK_INTERVAL);
checkStock();