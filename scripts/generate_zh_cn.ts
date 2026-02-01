import * as OpenCC from 'opencc-js';
import fs from 'fs';
import path from 'path';

// Initialize converter from Traditional (Taiwan) to Simplified (China)
const converter = OpenCC.Converter({ from: 'hk', to: 'cn' });

function deepConvert(obj: any): any {
  if (typeof obj === 'string') {
    return converter(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepConvert);
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = deepConvert(obj[key]);
    }
    return result;
  }
  return obj;
}

const zhTwPath = path.resolve('src/i18n/locales/zh-TW.json');
const zhTw = JSON.parse(fs.readFileSync(zhTwPath, 'utf-8'));

const zhCn = deepConvert(zhTw);

fs.writeFileSync('src/i18n/locales/zh-CN.json', JSON.stringify(zhCn, null, 2));
console.log('zh-CN.json generated');
