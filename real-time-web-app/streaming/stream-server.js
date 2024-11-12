const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8001;

// Enable CORS for requests from http://localhost:8000
app.use(cors({
  origin: "http://localhost:8000"
}));

// HTTP stream endpoint
app.get("/stream/:city", (req, res) => {
  const city = req.params.city;
  console.log(`Streaming temperature data for city: ${city}`);

  // Set headers for HTTP streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial comment to keep connection open
  res.write(`: Connected to temperature stream for ${city}\n\n`);

  // Function to send random temperature data
  const sendTemperature = () => {
    const temperature = (Math.random() * 50 - 10).toFixed(2); // Temperature between -10 and 40
    const data = { city, temperature };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send temperature data every 1 seconds
  const intervalId = setInterval(sendTemperature, 1000);

  // Handle client disconnection
  req.on("close", () => {
    console.log(`Client disconnected from ${city} stream`);
    clearInterval(intervalId);
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`Stream server running on http://localhost:${PORT}`);
});
