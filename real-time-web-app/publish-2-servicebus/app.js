
/**
 * @summary Execute below commands to avoid certificate errors related "Error: self-signed certificate in certificate chain" / "SELF_SIGNED_CERT_IN_CHAIN"
 * 
 * $ echo quit | openssl s_client -showcerts -servername server-name.servicebus.windows.net -connect server-name.servicebus.windows.net:443 > ~/cert/server-name-servicebus-ca-certificate.pem
 * $ export NODE_EXTRA_CA_CERTS=~/cert/server-name-servicebus-ca-certificate.pem
 * 
 */

const { ServiceBusClient } = require("@azure/service-bus");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Azure Service Bus configuration
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING; // Service Bus connection string
const topicName = process.env.TOPIC_NAME; // Topic name

// Function to generate random temperature data for a given city
function generateRandomTemperature(city) {
  const temperature = (Math.random() * 50 - 10).toFixed(2); // Temperature between -10 and 40 degrees Celsius
  return { city, temperature };
}

// Function to send temperature data to Azure Service Bus
async function sendTemperatureToServiceBus(city) {
  const serviceBusClient = new ServiceBusClient(connectionString);
  const sender = serviceBusClient.createSender(topicName);

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
      console.log(`Sending message: ${JSON.stringify(temperatureData)}`);
      await sender.sendMessages(message);

      // Wait 1 seconds before sending the next message
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (err) {
    console.error("Error sending message:", err);
  } finally {
    await sender.close();
    await serviceBusClient.close();
  }
}

// Start the application
const cityName = "New York"; // Replace with any city name you want to simulate
sendTemperatureToServiceBus(cityName).catch((err) => {
  console.error("Error running application:", err);
});
