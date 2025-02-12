/**
 * @summary Execute below commands to avoid certificate errors related to "SELF_SIGNED_CERT_IN_CHAIN"
 *
 * $ echo quit | openssl s_client -showcerts -servername server-name.servicebus.windows.net -connect server-name.servicebus.windows.net:443 > ~/cert/server-name-servicebus-ca-certificate.pem
 * $ export NODE_EXTRA_CA_CERTS=~/cert/server-name-servicebus-ca-certificate.pem
 *
 */

require("dotenv").config();
const { ServiceBusClient } = require("@azure/service-bus");

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
const topicName = process.env.TOPIC_NAME;

if (!connectionString || !topicName) {
    console.error("Missing environment variables. Please check .env file.");
    process.exit(1);
}

async function scheduleMessage() {
    const sbClient = new ServiceBusClient(connectionString);
    const sender = sbClient.createSender(topicName);

    try {
        while (true) { // Infinite loop to send messages
            const now = new Date();
            const payload = now.getTime();
            const msgBody = {
                payload: payload,
                timestamp: now.toISOString()
            };

            const message = {
                body: JSON.stringify(msgBody),
                contentType: "application/json",
            };

            console.log(JSON.stringify(msgBody));

            await sender.sendMessages(message);

            // Wait for some seconds before sending the next message
            await new Promise(resolve => setTimeout(resolve, 11 * 1000));
        }

    } catch (error) {
        console.error("Error scheduling message:", error);
    } finally {
        await sender.close();
        await sbClient.close();
    }
}

scheduleMessage();
