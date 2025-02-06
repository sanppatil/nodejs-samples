require("dotenv").config();
const { ServiceBusClient } = require("@azure/service-bus");

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
const topicName = process.env.TOPIC_NAME;
const subscriptionName = process.env.SUBSCRIPTION_NAME;

if (!connectionString || !topicName || !subscriptionName) {
    console.error("Missing environment variables. Please check .env file.");
    process.exit(1);
}

async function receiveMessages() {
    const sbClient = new ServiceBusClient(connectionString);
    const receiver = sbClient.createReceiver(topicName, subscriptionName);
    const sender = sbClient.createSender(topicName);

    try {
        console.log(`Listening for messages on topic "${topicName}" and subscription "${subscriptionName}"...`);

        const messageHandler = async (message) => {
            let messageType = message.applicationProperties?.MessageType || "Unknown";
            console.log(`Received message: ${message.body}`);

            if (messageType === "ScheduledDelay") {
                const now = new Date();
                messageType = "RealTime";
                // Reschedule message with a 3-minute delay
                let delayMilliseconds = 3 * 60 * 1000;
                const rescheduledTime = new Date(Date.now() + delayMilliseconds);
                const messageId = now.getTime();
                const msgBody = `Rescheduled - (Payload: ${message.body}) | (MessageId: ${messageId}) | (delay: ${delayMilliseconds} ms) | MessageType: ${messageType}`;

                const rescheduledMessage = {
                    body: msgBody,
                    messageId: messageId,
                    contentType: message.contentType,
                    applicationProperties: {
                        MessageType: messageType
                    }
                };

                console.log(msgBody);

                await sender.scheduleMessages(rescheduledMessage, rescheduledTime);
            } 

            // Mark message as processed
            await receiver.completeMessage(message);
        };

        const errorHandler = async (error) => {
            console.error("Error receiving message:", error);
        };

        receiver.subscribe({
            processMessage: messageHandler,
            processError: errorHandler
        });

        // Keep the process running
        await new Promise(() => {});

    } catch (error) {
        console.error("Error in receiver:", error);
    } finally {
        await receiver.close();
        await sender.close();
        await sbClient.close();
    }
}

receiveMessages();
