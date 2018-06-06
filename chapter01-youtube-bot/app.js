// This loads the environment variables from the .env file
require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const request = require('request');
const vsprintf = require('sprintf-js').vsprintf;

const urlTemplate = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=%s&key=' + process.env.YOUTUBE_KEY;

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

const bot = new builder.UniversalBot(connector, [
    session => {
        const url = vsprintf(urlTemplate, [session.message.text]);

        request.get(url, (err, response, body) => {
            if (err) {
                console.log('error while fetching video:\n' + err);
                session.endConversation('error while fetching video. please try again later.');
                return;
            }

            const result = JSON.parse(body);
            // we have at most 5 results
            let cards = [];

            result.items.forEach(item => {
                const card = new builder.HeroCard(session)
                    .title(item.snippet.title)
                    .text(item.snippet.description)
                    .images([
                        builder.CardImage.create(session, item.snippet.thumbnails.medium.url)
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, 'https://www.youtube.com/watch?v=' + item.id.videoId, 'Watch Video')
                    ]);
                cards.push(card);
            });

            const reply = new builder.Message(session)
                .text('Here are some results for you')
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(cards);

            session.send(reply);
        });
    }
]);
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);