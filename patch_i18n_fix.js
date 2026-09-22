import fs from 'fs';

const zhCNPath = 'src/i18n/locales/zh-CN.json';
const zhTWPath = 'src/i18n/locales/zh-TW.json';

const zhCNData = JSON.parse(fs.readFileSync(zhCNPath, 'utf8'));
const zhTWData = JSON.parse(fs.readFileSync(zhTWPath, 'utf8'));

// Fix Services Section translations (remove English fallback in parens)
zhCNData.services_section.categories[0].title = "品牌策略";
zhCNData.services_section.categories[1].title = "品牌表达";
zhCNData.services_section.categories[2].title = "品牌体验";
zhCNData.services_section.categories[3].title = "品牌内容";

zhTWData.services_section.categories[0].title = "品牌策略";
zhTWData.services_section.categories[1].title = "品牌表達";
zhTWData.services_section.categories[2].title = "品牌體驗";
zhTWData.services_section.categories[3].title = "品牌內容";

fs.writeFileSync(zhCNPath, JSON.stringify(zhCNData, null, 2));
fs.writeFileSync(zhTWPath, JSON.stringify(zhTWData, null, 2));

console.log('i18n fixed');