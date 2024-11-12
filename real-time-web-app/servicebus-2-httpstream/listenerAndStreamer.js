
/**
 * @summary Execute below commands to avoid certificate errors related "Error: self-signed certificate in certificate chain" / "SELF_SIGNED_CERT_IN_CHAIN"
 * 
 * $ echo quit | openssl s_client -showcerts -servername server-name.servicebus.windows.net -connect server-name.servicebus.windows.net:443 > ~/cert/server-name-servicebus-ca-certificate.pem
 * $ export NODE_EXTRA_CA_CERTS=~/cert/server-name-servicebus-ca-certificate.pem
 * 
 */

const { ServiceBusClient } = require("@azure/service-bus");
const express = require("express");
const cors = require("cors");

require("dotenv").config();

// Azure Service Bus configuration
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
const topicName = process.env.TOPIC_NAME;
const subscriptionName = process.env.SUBSCRIPTION_NAME;

// Set up Express app
const app = express();
const PORT = 8002;

// Enable CORS for requests from http://localhost:8000
app.use(cors({
  origin: "http://localhost:8000"
}));

// Store connected clients for streaming
let clientsByCity = {}; // Store clients grouped by city
let latestCityData = {}; // Store the latest temperature data for each city

// Add client to the list when they connect
function addClient(req, res, city) {
  // Set headers for HTTP streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Initialize city client list if not exists
  if (!clientsByCity[city]) {
    clientsByCity[city] = [];
  }

  // Add client response to the city's client list
  clientsByCity[city].push(res);

  // Send the latest data for the city immediately if available
  if (latestCityData[city]) {
    res.write(`data: ${JSON.stringify(latestCityData[city])}\n\n`);
  }

  // Remove client when they disconnect
  req.on("close", () => {
    clientsByCity[city] = clientsByCity[city].filter((client) => client !== res);
    res.end();
  });
}

// Broadcast the latest data for a specific city to all connected clients interested in that city
function broadcastCityData(city) {
  if (clientsByCity[city]) {
    clientsByCity[city].forEach((client) => client.write(`data: ${JSON.stringify(latestCityData[city])}\n\n`));
  }
}

// HTTP endpoint to start streaming data for a selected city
app.get("/stream/:city", (req, res) => {
  const city = req.params.city;
  addClient(req, res, city);
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP stream server running on http://localhost:${PORT}/stream/:city`);
});

// Function to listen to Service Bus topic and broadcast messages
async function listenToServiceBus() {
  const serviceBusClient = new ServiceBusClient(connectionString);
  const receiver = serviceBusClient.createReceiver(topicName, subscriptionName);

  console.log("Listening for messages from Azure Service Bus...");

  // Handler to process each message
  receiver.subscribe({
    processMessage: async (message) => {
      const data = message.body;
      // console.log("Received message:", data);

      // Update the latest data for the city
      latestCityData[data.city] = data;

      // Broadcast the latest data to all clients interested in this city
      broadcastCityData(data.city);
    },
    processError: async (err) => {
      console.error("Error receiving message:", err);
    },
  });

  // Keep the listener alive
  await new Promise(() => {});
}

// Start the Service Bus listener
listenToServiceBus().catch((err) => {
  console.error("Error running Service Bus listener:", err);
});
