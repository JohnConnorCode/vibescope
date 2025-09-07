const https = require('https');

function testAPI(path, name) {
  return new Promise((resolve) => {
    https.get(`https://vibescope-orpin.vercel.app${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const status = res.statusCode >= 200 && res.statusCode < 600 ? '✅' : '❌';
          console.log(`${status} ${name}: Status ${res.statusCode}`);
          if (json.error && !json.isMockData) {
            console.log(`   ⚠️  Error: ${json.error}`);
          }
          resolve(res.statusCode);
        } catch (e) {
          console.log(`❌ ${name}: Invalid JSON response`);
          resolve(500);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${name}: ${err.message}`);
      resolve(500);
    });
  });
}

async function runTests() {
  console.log('🧪 Production API Tests\n');
  
  const tests = [
    ['/api/health', 'Health Check'],
    ['/api/vibe?term=test', 'Word Analysis'],
    ['/api/vibe/analyze-sentence?text=test', 'Sentence Analysis'],
    ['/api/vibe?term=love', 'Semantic Dimensions'],
  ];
  
  let passed = 0;
  for (const [path, name] of tests) {
    const status = await testAPI(path, name);
    if (status < 600) passed++;
  }
  
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);
  process.exit(passed === tests.length ? 0 : 1);
}

runTests();
