var nodemailer = require('nodemailer');
var dotenv = require('dotenv');
dotenv.config()
const amqplib = require('amqplib')
const queueName = process.env.MAILER_QUEUE_NAME;
const mqUrl = `amqp://${process.env.RABBIT_MQ_URL}:5672`

async function consume(mqUrl, queueName, dispatchFunction) {
    var conn;
    while (true) {
        try {
            conn = await amqplib.connect(mqUrl);
            break;
        }
        catch (err) {

        }
    }
    const channel = await conn.createChannel()
    const ok = await channel.assertQueue(queueName, { durable: false })
    setTimeout(() => {
        channel.consume(queueName, async (message) => {
            if (message !== null) {
                dispatchFunction(null, JSON.parse(message.content.toString()));
                channel.ack(message);
            }
        })
    }, 1000)
}

consume(mqUrl, queueName,
    function (err, message) {
        if (err) return console.log(err)
        mail(message);
    })
    .then()
    .catch(function (err) {
        console.error('cannot access queue', err, mqUrl, queueName)
    })

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SERVER_MAIL_ID,
        pass: process.env.SERVER_MAIL_PASSWORD,
    }
});

function mail(message) {
    transporter.sendMail(message, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};