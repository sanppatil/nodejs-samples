const jwt = require('jsonwebtoken');
const fs = require('fs');
const crypto = require("crypto");
require("dotenv").config();

const privateKey = fs.readFileSync('private.key');


//Prepare x5t header
let certPem = fs.readFileSync('certificate.pem');
let cert = new crypto.X509Certificate(certPem);
let sha1Fingerprint = cert.fingerprint.replace(/:/g, '');
let x5t = Buffer.from(sha1Fingerprint, 'hex').toString('base64url');

//Prepare jwt assertion claim
const loginServer = process.env.LOGIN_SERVER;
const client_id = process.env.CLINET_ID;
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
urlEncodedBody.append("scope", client_id + "/.default");
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
