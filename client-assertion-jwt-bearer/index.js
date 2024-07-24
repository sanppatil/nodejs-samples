const jwt = require('jsonwebtoken');
const fs = require('fs');
const crypto = require("crypto");

const privateKey = fs.readFileSync('cert/private.key');

//Prepare x5t header
let certPem = fs.readFileSync('cert/certificate.pem');
let cert = new crypto.X509Certificate(certPem);
let sha1Fingerprint = cert.fingerprint.replace(/:/g, '');
let x5t = Buffer.from(sha1Fingerprint, 'hex').toString('base64url');

//Prepare jwt assertion claim
const loginServer = "https://login.microsoftonline.com/780f17e7-9819-4788-a202-2ad993143e88/oauth2/v2.0/token";
const client_id = "6bd16317-b294-4116-acda-92c76993ca23";
const issuedAt = Date.now() / 1000;
const notValidBefore = issuedAt + 1;
const expiresIn = issuedAt + 1 * 60 * 60;
const jwtId = crypto.randomUUID();

const claim = {
    "aud": loginServer,
    "iss": client_id,
    "sub": client_id,
    "iat": issuedAt,
    "nbf": notValidBefore,
    "exp": expiresIn,
    "jti": jwtId
};

//Prepare jwt assertion header
const header = {
    "alg": "RS256",
    "typ": "JWT",
    "x5t": x5t
};

// Prepare jwt assertion token
var client_assertion = jwt.sign(claim, privateKey, { algorithm: 'RS256', header: header });
console.log("JWT Assertion Token: \n" + client_assertion)


//Call O-auth API to get access token using jwt-bearer
 
const httpHeaders = new Headers();
httpHeaders.append("Content-Type", "application/x-www-form-urlencoded");

const urlEncodedBody = new URLSearchParams();
urlEncodedBody.append("client_id", client_id);
urlEncodedBody.append("client_assertion", client_assertion);
urlEncodedBody.append("scope", "https://graph.microsoft.com/.default");
urlEncodedBody.append("grant_type", "client_credentials");
urlEncodedBody.append("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");

const requestOptions = {
    method: "POST",
    headers: httpHeaders,
    body: urlEncodedBody
};

fetch(loginServer, requestOptions)
    .then((response) => response.text())
    .then((result) => console.log("Response: \n" + result))
    .catch((error) => console.error(error));