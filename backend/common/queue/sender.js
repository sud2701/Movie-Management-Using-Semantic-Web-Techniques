const amqp = require('amqplib');

async function sendToQueue(queueName, data) {
    const connection = await amqp.connect(`amqp://${process.env.RABBIT_MQ_URL}:5672`);
    const channel = await connection.createChannel();
    try {
        const queue = queueName;


        await channel.assertQueue(queue, { durable: false });

        await channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
        console.log('Message published');
    } catch (e) {
        console.error('Error in publishing message', e);
    } finally {
        console.info('Closing channel and connection if available');
        await channel.close();
        await connection.close();
        console.info('Channel and connection closed');
    }
}

module.exports = sendToQueue;