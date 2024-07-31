const jwkToPem = require('jwk-to-pem');
const fs = require('fs');

var jwk = fs.readFileSync('cert.jwks', 'utf-8');

pem = jwkToPem(JSON.parse(jwk));

console.log(pem);