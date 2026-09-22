import fs from 'fs';

const enPath = 'src/i18n/locales/en.json';
const zhCNPath = 'src/i18n/locales/zh-CN.json';
const zhTWPath = 'src/i18n/locales/zh-TW.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zhCNData = JSON.parse(fs.readFileSync(zhCNPath, 'utf8'));
const zhTWData = JSON.parse(fs.readFileSync(zhTWPath, 'utf8'));

const enTags = {
  services: {
    "Business Design": "Business Design",
    "Strategic Positioning": "Strategic Positioning",
    "Branding": "Branding",
    "Digital Marketing": "Digital Marketing",
    "UI / UX": "UI / UX",
    "Packaging": "Packaging",
    "Research & Insights": "Research & Insights"
  },
  industries: {
    "FMCG": "FMCG",
    "Beauty": "Beauty",
    "Tech": "Tech",
    "Lifestyle": "Lifestyle"
  }
};

const zhCNTags = {
  services: {
    "Business Design": "商业设计",
    "Strategic Positioning": "战略定位",
    "Branding": "品牌塑造",
    "Digital Marketing": "数字营销",
    "UI / UX": "UI/UX设计",
    "Packaging": "包装设计",
    "Research & Insights": "研究与洞察"
  },
  industries: {
    "FMCG": "快消品",
    "Beauty": "美妆",
    "Tech": "科技",
    "Lifestyle": "生活方式"
  }
};

const zhTWTags = {
  services: {
    "Business Design": "商業設計",
    "Strategic Positioning": "戰略定位",
    "Branding": "品牌塑造",
    "Digital Marketing": "數位行銷",
    "UI / UX": "UI/UX設計",
    "Packaging": "包裝設計",
    "Research & Insights": "研究與洞察"
  },
  industries: {
    "FMCG": "快消品",
    "Beauty": "美妆",
    "Tech": "科技",
    "Lifestyle": "生活方式"
  }
};

enData.tags = enTags;
zhCNData.tags = zhCNTags;
zhTWData.tags = zhTWTags;

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(zhCNPath, JSON.stringify(zhCNData, null, 2));
fs.writeFileSync(zhTWPath, JSON.stringify(zhTWData, null, 2));

console.log('Tags i18n patched');