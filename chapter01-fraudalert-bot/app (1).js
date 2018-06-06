// This loads the environment variables from the .env file
require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot and listen to messages
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

const fraudAlertSubscriptions = {}; // collection of subscriptions to alerts

setInterval(() => {
    const keys = Object.keys(fraudAlertSubscriptions);
    if (keys.length === 0) return;

    const key = keys[Math.floor(Math.random() * keys.length)];
    const address = fraudAlertSubscriptions[key];
    delete fraudAlertSubscriptions[key];
    const msg = new builder.Message().address(address);
    msg.text('We noticed some strange activity. Did you use your card for a $231.73 purchase on Amazon.com? Please call your bank for more information.');
    msg.textLocale('en-US');
    bot.send(msg);
}, 10000);

const bot = new builder.UniversalBot(connector, [
    (session) => {
        const id = session.message.user.id;

        if (!fraudAlertSubscriptions[id]) {
            fraudAlertSubscriptions[id] = session.message.address;
            session.send('Hi there, you are now subscribed to fraud alerts');
        } else {
            session.send('You are already subscribed to fraud alerts');
        }
    }
]);
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);