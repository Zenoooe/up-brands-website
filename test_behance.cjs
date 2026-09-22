
const https = require('https');

https.get('https://corsproxy.io/?url=' + encodeURIComponent('https://www.behance.net/feeds/user?username=up-brands'), (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
      console.log('Contents start with:', data.substring(0, 200));
      console.log('Contains <item>?', data.includes('<item>'));
  });
});
