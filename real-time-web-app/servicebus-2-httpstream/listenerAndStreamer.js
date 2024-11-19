
/**
 * @summary Execute below commands to avoid certificate errors related "Error: self-signed certificate in certificate chain" / "SELF_SIGNED_CERT_IN_CHAIN"
 * 
 * $ echo quit | openssl s_client -showcerts -servername server-name.servicebus.windows.net -connect server-name.servicebus.windows.net:443 > ~/cert/server-name-servicebus-ca-certificate.pem
 * $ export NODE_EXTRA_CA_CERTS=~/cert/server-name-servicebus-ca-certificate.pem
 * 
 */

const express = require("express");
const { ServiceBusClient } = require("@azure/service-bus");
const cors = require("cors");
require("dotenv").config();

// Configuration
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
const topicName = process.env.TOPIC_NAME;
const subscriptionName = process.env.SUBSCRIPTION_NAME;
const PORT = 8002;

const app = express();

// Enable CORS for requests from http://localhost:8000
app.use(cors({
    origin: "http://localhost:8000"
  }));

// Store connected clients for streaming
let globalClients = []; // For clients connected to /stream
let cityClients = {}; // For clients connected to /stream/:city

// Broadcast message to global clients
function broadcastToGlobalClients(message) {
    globalClients.forEach((client) => client.write(`data: ${JSON.stringify(message)}\n\n`));
}

// Broadcast message to specific city clients
function broadcastToCityClients(city, message) {
    if (cityClients[city]) {
        cityClients[city].forEach((client) => client.write(`data: ${JSON.stringify(message)}\n\n`));
    }
}

// Add a client to the global stream
function addGlobalClient(req, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    globalClients.push(res);

    req.on("close", () => {
        globalClients = globalClients.filter((client) => client !== res);
        res.end();
    });
}

// Add a client to a specific city stream
function addCityClient(req, res, city) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!cityClients[city]) {
        cityClients[city] = [];
    }

    cityClients[city].push(res);

    req.on("close", () => {
        cityClients[city] = cityClients[city].filter((client) => client !== res);
        res.end();
    });
}

// Route for streaming all cities
app.get("/stream", (req, res) => {
    addGlobalClient(req, res);
});

// Route for streaming a specific city
app.get("/stream/:city", (req, res) => {
    const city = req.params.city;
    addCityClient(req, res, city);
});

// Start the HTTP server
app.listen(PORT, () => {
    console.log(`HTTP stream server running on http://localhost:${PORT}/stream`);
    console.log(`HTTP stream server for specific cities on http://localhost:${PORT}/stream/:city`);
});

// Function to listen to Service Bus topic and broadcast messages
async function listenToServiceBus() {
    const serviceBusClient = new ServiceBusClient(connectionString);
    const receiver = serviceBusClient.createReceiver(topicName, subscriptionName);

    console.log("Listening for messages from Azure Service Bus...");

    receiver.subscribe({
        processMessage: async (message) => {
            const data = message.body;
            console.log("Received message:", data);

            // Broadcast to global clients
            broadcastToGlobalClients(data);

            // Broadcast to city-specific clients
            if (data.city) {
                broadcastToCityClients(data.city, data);
            }
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
