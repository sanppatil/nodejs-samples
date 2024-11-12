const WebSocket = require("ws");

const PORT = 8001;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
  const urlParts = req.url.split("/");
  const city = urlParts[urlParts.length - 1] || "Unknown City";
  console.log(`WebSocket connection established for city: ${city}`);

  // Function to send random temperature data
  const sendTemperature = () => {
    const temperature = (Math.random() * 50 - 10).toFixed(2); // Temperature between -10 and 40
    const data = { city, temperature };
    ws.send(JSON.stringify(data));
  };

  // Send temperature data every 1 seconds
  const intervalId = setInterval(sendTemperature, 1000);

  ws.on("close", () => {
    console.log(`WebSocket connection closed for city: ${city}`);
    clearInterval(intervalId); // Clear interval when the client disconnects
  });
});
