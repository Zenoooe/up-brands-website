const zhTw = {
  "nav": {
    "work": "案例",
    "about": "關於",
    "blog": "博客",
    "contact": "聯繫"
  },
  "home": {
    "tagline": "專注品牌升級與跨境出海，賦能品牌價值十倍溢價。",
    "marquee": "大灣區品牌設計 · 策略先行 創意領航 · Brand Strategy & Design ·",
    "about_title": "我們是上游文創。",
    "about_desc_1": "上游文創是一家紮根大灣區的品牌策略與創意設計公司。我們專注於幫助企業發現獨特的品牌價值，並通過系統化的視覺語言將其呈現給世界。",
    "about_desc_2": "從市場洞察到創意落地，我們相信好的品牌設計不僅是美學的表達，更是商業策略的具象化。",
    "view_project": "查看案例",
    "contact_title": "讓我們一起創造",
    "contact_btn": "開啟項目",
    "modal": {
      "title": "查看案例詳情",
      "behance": "訪問 Behance",
      "wechat": "訪問微信公眾號"
    }
  },
  "about": {
    "title": "關於我們",
    "description": "上游文創（Up-Brands）位於珠海，毗鄰港澳，致力為企業主提供精細化品牌戰略+先進創意視覺+數字化營銷方針，有效挖掘和增強品牌的核心競爭力，確保您的品牌在複雜的市場環境中脫穎而出，驅動業務增長和價值創造。",
    "connect": "聯繫我們"
  },
  "blog": {
    "title": "洞察與動態",
    "read_more": "閱讀更多",
    "back": "返回博客"
  },
  "footer": {
    "rights": "上游文創 版權所有。",
    "keep_touch": "保持聯繫",
    "email_placeholder": "your.email@address.com",
    "lets_talk": "與我們交談",
    "new_business": "新業務:",
    "careers": "招賢納士:",
    "location": "地址",
    "address_line1": "僑光商業中心 4 樓",
    "address_line2": "西環路 168 號",
    "address_line3": "珠澳跨境工業區",
    "address_line4": "中國廣東省珠海市"
  }
};

import fs from 'fs';
fs.writeFileSync('src/i18n/locales/zh-TW.json', JSON.stringify(zhTw, null, 2));
console.log('zh-TW.json updated');
