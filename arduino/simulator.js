// arduino/simulator.js
// Simulates ESP8266 polling — run with: node simulator.js
const http = require('http');

const SERVER_IP = '10.133.230.93';
const PORT      = 5000;
const USER_ID   = 1;
const INTERVAL  = 2000;

console.log('=== ESP8266 Simulator Started ===');
console.log(`Polling http://${SERVER_IP}:${PORT}/api/esp/status?user_id=${USER_ID}`);
console.log('Press Ctrl+C to stop\n');

function poll() {
  const req = http.get(
    `http://${SERVER_IP}:${PORT}/api/esp/status?user_id=${USER_ID}`,
    (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            console.log(`[${new Date().toLocaleTimeString()}] Devices:`);
            json.devices.forEach(d => {
              const status = d.state ? '🟢 ON ' : '🔴 OFF';
              console.log(`  Pin ${d.pin} | ${d.name.padEnd(20)} | ${status}`);
            });
            console.log('');
          }
        } catch (e) {
          console.error('Parse error:', e.message);
        }
      });
    }
  );
  req.on('error', err => console.error('Connection error:', err.message));
}

// Poll immediately then every INTERVAL ms
poll();
setInterval(poll, INTERVAL);