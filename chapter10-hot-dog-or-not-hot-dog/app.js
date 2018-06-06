require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const moment = require('moment');
const _ = require('underscore');
const cognitiveServices = require('cognitive-services');
const fs = require('fs');
const request = require('request');
const uuid = require('uuid');

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
        session.beginDialog('hot-dog-or-not-hot-dog');
    },
    session => {
        session.endConversation();
    }
]);
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);

const getImage = function (uri, filename) {
    return new Promise((resolve, reject) => {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename))
                .on('error', () => { reject(); })
                .on('close', () => {
                    resolve();
                });
        });
    });
};

bot.dialog('hot-dog-or-not-hot-dog', [
    (session, arg) => {
        if (session.message.attachments == null || session.message.attachments.length == 0 || session.message.attachments[0].contentType.indexOf('image') < 0) {
            session.send('Not supported. Require an image to be sent!');
            return;
        }

        // let them know we're thinking....
        session.sendTyping();

        const id = uuid();
        const dirName = 'images';

        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
        const imagePath = dirName + '/' + id;
        const imageUrl = session.message.attachments[0].contentUrl;

        getImage(imageUrl, imagePath).then(() => {
            const cv = new cognitiveServices.computerVision({ apiKey: process.env.CV_KEY, endpoint: process.env.CV_ENDPOINT });
            return cv.describeImage({
                headers: { 'Content-Type': 'application/octet-stream' },
                body: fs.readFileSync(imagePath)
            });
        }).then((analysis) => {
            if (analysis.description.tags) {
                if (_.find(analysis.description.tags, p => p === 'hotdog')) {
                    session.send('HOT DOG!');
                }
                else {
                    session.send('not hot dog');
                }
            }
            else {
                session.send('not hot dog');
            }
            fs.unlinkSync(imagePath);
        });
    }
]);
