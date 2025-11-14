const https = require('https');
const express = require('express');
const fs = require('fs');
const selfsigned = require('selfsigned');

const app = express();

// Serve static files from the current directory
app.use(express.static('.'));

// Get host from environment variable or default to localhost
const host = process.env.HOST || 'localhost';

// Generate self-signed certificate
const attrs = [{ name: 'commonName', value: host }];
const certOptions = {
  days: 365,
  keySize: 2048,
  extensions: [{
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: host },
      { type: 2, value: 'localhost' },
      { type: 7, ip: host === 'localhost' ? '127.0.0.1' : host },
      { type: 7, ip: '127.0.0.1' }
    ]
  }]
};
const pems = selfsigned.generate(attrs, certOptions);

fs.writeFileSync('key.pem', pems.private);
fs.writeFileSync('cert.pem', pems.cert);

const options = {
  key: pems.private,
  cert: pems.cert
};

const server = https.createServer(options, app);

server.listen(8443, '0.0.0.0', () => {
  console.log('HTTPS server running on https://0.0.0.0:8443');
  console.log(`Access on PC: https://localhost:8443/?dev=true`);
  console.log(`Access on mobile: https://${host}:8443/?dev=true`);
  console.log('Note: Accept the security warning in the browser');
  console.log(`Using HOST=${host} (set HOST environment variable to change)`);
});