const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8001;

// Enable CORS for requests from http://localhost:8000
app.use(cors({
  origin: "http://localhost:8000"
}));

let cityClients = {}; // A dictionary to store clients by city
let cityData = {}; // A dictionary to store the latest temperature data for each city

// Function to generate random temperature data for a given city
function generateTemperature(city) {
  const temperature = (Math.random() * 50 - 10).toFixed(2); // Temperature between -10 and 40
  return { city, temperature };
}

// Function to broadcast data to all clients interested in a specific city
function broadcastData(city, data) {
  if (cityClients[city]) {
    cityClients[city].forEach(client => {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
}

// Set an interval to generate and broadcast data for each city every 2 seconds
setInterval(() => {
  Object.keys(cityClients).forEach(city => {
    const data = generateTemperature(city);
    cityData[city] = data;
    broadcastData(city, data);
  });
}, 1000);

// Endpoint to handle client connections to the stream for a specific city
app.get("/stream/:city", (req, res) => {
  const city = req.params.city;

  // Set headers for HTTP streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Add the new client to the list for the specified city
  if (!cityClients[city]) {
    cityClients[city] = [];
  }
  cityClients[city].push({ req, res });

  // Send the latest temperature data immediately on connection, if available
  if (cityData[city]) {
    res.write(`data: ${JSON.stringify(cityData[city])}\n\n`);
  }

  // Remove the client from the list when they disconnect
  req.on("close", () => {
    cityClients[city] = cityClients[city].filter(client => client.res !== res);
    res.end();

    // Clean up the city if no clients are left for that city
    if (cityClients[city].length === 0) {
      delete cityClients[city];
      delete cityData[city];
    }
  });
});

app.listen(PORT, () => {
  console.log(`Stream server running on http://localhost:${PORT}`);
});
