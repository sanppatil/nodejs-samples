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
const subscriptionName = process.env.SUBSCRIPTION_NAME;

if (!connectionString || !topicName || !subscriptionName) {
    console.error("Missing environment variables. Please check .env file.");
    process.exit(1);
}

const sbClient = new ServiceBusClient(connectionString);
const receiver = sbClient.createReceiver(topicName, subscriptionName);
const sender = sbClient.createSender(topicName);

async function receiveMessages() {
    try {
        console.log(`Listening for messages on topic "${topicName}" and subscription "${subscriptionName}"...`);

        const messageHandler = async (message) => {
            const msgBody = JSON.parse(message.body);
            const msgHeader = message.applicationProperties;

            const result = await isMessageReadyForProcessing(msgBody);
            if (result) {
                await processMessage(msgBody, msgHeader);
            }
            else {
                await rescheduleMessage(msgBody, msgHeader);
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
        await new Promise(() => { });

    } catch (error) {
        console.error("Error in receiver:", error);
    } finally {
        await receiver.close();
        await sender.close();
        await sbClient.close();
    }
}

receiveMessages();

async function isMessageReadyForProcessing(msgBody) {
    try {
        const now = new Date();
        const currentSeconds = now.getSeconds();
        if (currentSeconds % 3 === 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Unhandled Error:", error);
        return false;
    }
}

async function processMessage(msgBody, msgHeader) {
    try {
        let rescheduleAttempt = msgHeader?.RescheduleAttempt || 1;
        console.log("Business logic to process message: " + msgBody.payload + " | rescheduleAttempt: " + rescheduleAttempt);
    } catch (error) {
        console.error("Unhandled Error:", error);
    }
}

async function rescheduleMessage(msgBody, msgHeader) {
    try {
        let rescheduleAttempt = msgHeader?.RescheduleAttempt || 1;
        rescheduleAttempt++;
        if (rescheduleAttempt <= process.env.RESCHEDULE_MAX_ATTEMPT)
        {
            const now = new Date();
            let delayMilliseconds = process.env.RESCHEDULE_DELAY_SECONDS * 1000;
            const rescheduledTime = new Date(Date.now() + delayMilliseconds);

            const rescheduledMessage = {
                body: JSON.stringify(msgBody),
                contentType: "application/json",
                applicationProperties: {
                    RescheduleAttempt: rescheduleAttempt
                }
            };
            await sender.scheduleMessages(rescheduledMessage, rescheduledTime);

            console.log("Re-scheduled message: " + msgBody.payload + " | RescheduleAttempt: " + rescheduleAttempt);

        }
        else
        {
            console.warn("Reschedule attempts exhausted. Message " + msgBody.payload + " has been dropped from re-scheduling. ");
        }
    } catch (error) {
        console.error("Unhandled Error:", error);
    }
}