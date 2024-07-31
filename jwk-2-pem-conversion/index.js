const jwkToPem = require('jwk-to-pem');
const fs = require('fs').promises;

async function convertJWKSToPEM(jwksFilePath) {
  try {
    const jwkString = await fs.readFile(jwksFilePath, 'utf-8');
    const jwkObject = JSON.parse(jwkString);
    const pem = jwkToPem(jwkObject);
    return pem;
  } catch (error) {
    console.error('Error converting JWKS to PEM:', error);
    throw error; 
  }
}

convertJWKSToPEM('cert.jwks')
  .then(pem => console.log(pem))
  .catch(error => console.error('Error:', error));