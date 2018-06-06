// This loads the environment variables from the .env file
require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const request = require('request');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});

const sentimentUri = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
const sentimentKey = process.env.SENTIMENT_KEY;

function options () {
    const options = {
        url: sentimentUri,
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': sentimentKey
        }
    };
    return options;
}

// Create chat bot and listen to messages
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, [
    session => {
        const data = {
            documents: [{
                id: '1',
                language: 'en',
                text: session.message.text
            }]
        };
        let opts = options();
        opts.json = data;

        request(opts, (error, response, body) => {
            if (error) {
                session.endConversation('received error while fetching sentiment. please try again later.');
                console.log('received error while fetching sentiment:\n' + error);
                return;
            }
            const score = body.documents[0].score;
            const msg = {
                attachments: [{
                    'content': '' + score,
                    'contentType': 'text/plain'
                }]
            };

            if (score < 0.15) {
                msg.text = 'that is really not cool';
            } else if (score < 0.4) {
                msg.text = 'there\'s no need for that';
            } else if (score < 0.6) {
                msg.text = 'alright';
            } else if (score < 0.8) {
                msg.text = 'that\'s cool';
            } else {
                msg.text = 'that\'s really nice!';
            }
            session.send(msg);
        });
    }
]);
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);