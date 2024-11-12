
/**
 * @summary Execute below commands to avoid certificate errors related "Error: self-signed certificate in certificate chain" / "SELF_SIGNED_CERT_IN_CHAIN"
 * 
 * $ echo quit | openssl s_client -showcerts -servername server-name.servicebus.windows.net -connect server-name.servicebus.windows.net:443 > ~/cert/server-name-servicebus-ca-certificate.pem
 * $ export NODE_EXTRA_CA_CERTS=~/cert/server-name-servicebus-ca-certificate.pem
 * 
 */

const { ServiceBusClient } = require("@azure/service-bus");
require("dotenv").config(); // Load environment variables from .env file

// Azure Service Bus configuration
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING; // Service Bus connection string
const topicName = process.env.TOPIC_NAME; // Topic name

// List of cities to publish temperature data for
const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];

// Function to generate random temperature data for a given city
function generateRandomTemperature(city) {
  const temperature = (Math.random() * 50 - 10).toFixed(2); // Temperature between -10 and 40 degrees Celsius
  return { city, temperature };
}

// Function to send temperature data for a city to Azure Service Bus
async function sendTemperatureForCity(sender, city) {
  try {
    while (true) {
      // Generate random temperature data
      const temperatureData = generateRandomTemperature(city);
      const message = {
        body: temperatureData,
        contentType: "application/json",
        label: "TemperatureData",
      };

      // Send message to the topic
      console.log(`Sending message for ${city}: ${JSON.stringify(temperatureData)}`);
      await sender.sendMessages(message);

      // Wait 1 seconds before sending the next message for this city
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err) {
    console.error(`Error sending message for ${city}:`, err);
  }
}

// Main function to start sending temperature data for multiple cities
async function main() {
  const serviceBusClient = new ServiceBusClient(connectionString);

  try {
    const sender = serviceBusClient.createSender(topicName);

    // For each city, start a separate loop to send temperature data
    const cityTasks = cities.map((city) => sendTemperatureForCity(sender, city));

    // Wait for all city tasks to complete (they'll run indefinitely in this case)
    await Promise.all(cityTasks);
  } finally {
    await serviceBusClient.close();
  }
}

// Start the application
main().catch((err) => {
  console.error("Error running application:", err);
});
