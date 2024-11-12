const fs = require('fs');
const server = require('http').createServer();

server.on('request', (req, res) => {
  const src = fs.createReadStream('./big.file');
  src.on('data', (chunk) => {
    res.write(chunk);
  });
  src.on('end', (chunk) => {
    res.end();
  });
});

server.listen(8000);