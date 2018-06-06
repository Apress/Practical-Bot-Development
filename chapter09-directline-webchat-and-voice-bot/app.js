require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const moment = require('moment');
const _ = require('underscore');
const md5 = require('md5');
const BingSpeechClient = require('bingspeech-api-client').BingSpeechClient;
const fs = require('fs');
const twilio = require('twilio');

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

server.use(restify.bodyParser({ mapParams: false }));
server.get('/api/token', (req, res, next) => {
    // make a request to get a token from the secret key
    const jsonClient = restify.createStringClient({ url: 'https://directline.botframework.com/v3/directline/tokens/generate' });
    jsonClient.post({
        path: '',
        headers: {
            authorization: 'Bearer ' + process.env.DL_KEY
        }
    }, null, function (_err, _req, _res, _data) {
        let jsonData = JSON.parse(_data);
        console.log('%d -> %j', _res.statusCode, _res.headers);
        console.log('%s', _data);
        res.send(200, {
            token: jsonData.token
        });
        next();
    });
});

server.post('/api/alexa', (req, res, next) => {
    const reqContents = req.body;
    console.log(JSON.stringify(reqContents));
    res.send(500);
    next();
});

server.post('/api/token/refresh', (req, res, next) => {
    // make a request to get a token from the secret key
    const token = req.body;
    const jsonClient = restify.createStringClient({ url: 'https://directline.botframework.com/v3/directline/tokens/refresh' });
    jsonClient.post({
        path: '',
        headers: {
            authorization: 'Bearer ' + token
        }
    }, null, function (_err, _req, _res, _data) {
        console.log('%d -> %j', _res.statusCode, _res.headers);
        console.log('%s', _data);
        res.send(200, {
            success: true
        });
        next();
    });
});

const bing = new BingSpeechClient(process.env.MICROSOFT_BING_SPEECH_KEY);
function generateAudio (text) {
    const id = md5(text);
    const file = 'public\\audio\\' + id + '.wav';
    const resultingUri = process.env.BASE_URI + '/audio/' + id + '.wav';

    if (!fs.existsSync('public')) fs.mkdirSync('public');
    if (!fs.existsSync('public/audio')) fs.mkdirSync('public/audio');

    if (fs.existsSync(file)) {
        return Promise.resolve(resultingUri);
    }

    return bing.synthesize(text).then(result => {
        const wstream = fs.createWriteStream(file);
        wstream.write(result.wave);

        console.log('created %s', resultingUri);
        return resultingUri;
    });
}

server.get('/api/audio-test', (req, res, next) => {
    const sample = 'Here are <say-as interpret-as="characters">SSML</say-as> samples. I can pause <break time="3s"/>.' +
        'I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.' +
        'Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.' +
        'I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.' +
        'Finally, I can speak a paragraph with two sentences.' +
        '<p><s>This is sentence one.</s><s>This is sentence two.</s></p>';

    generateAudio(sample + ' ' + new Date().getTime()).then(uri => {
        res.send(200, {
            uri: uri
        });
        next();
    });
});
server.get(/\/?.*/, restify.plugins.serveStatic({
    directory: './public',
    default: 'index.html'
}))

const bot = new builder.UniversalBot(connector, [
    session => {
        session.beginDialog('sampleConversation');
    },
    session => {
        session.endConversation();
    }
]);

const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);

bot.dialog('sampleConversation', [
    (session, arg) => {
        console.log(JSON.stringify(session.message));

        if (session.message.text.toLowerCase().indexOf('hello') >= 0 || session.message.text.indexOf('hi') >= 0) {
            session.send({
                text: 'hey!',
                speak: '<emphasis level="strong">really like</emphasis> hey!</emphasis>'
            });
        } else if (session.message.text.toLowerCase() === 'quit') {
            session.send({
                text: 'ok, we\'re done!',
                speak: 'ok, we\'re done',
                sourceEvent: {
                    hangup: true
                }
            });
            session.endDialog();
        } else if (session.message.text.toLowerCase().indexOf(' meaning of life') >= 0) {
            session.send({
                text: '42',
                speak: 'It is quite clear that the meaning of life is <break time="2s" /><emphasis level="strong">42</emphasis>'
            });
        } else if (session.message.text.toLowerCase().indexOf('waldo') >= 0) {
            session.send({
                text: 'not here',
                speak: '<emphasis level="strong">Definitely</emphasis> not here'
            });
        } else if (session.message.text.toLowerCase() === 'apple') {
            session.send({
                text: 'Here, have an apple.',
                speak: 'Apples are delicious!',
                attachments: [
                    {
                        contentType: 'image/jpeg',
                        contentUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/1200px-Red_Apple.jpg',
                        name: 'Apple'
                    }
                ]
            });
        } else {
            session.send({ text: 'oh that\'s cool', speak: 'oh that\'s cool' });
        }
    }
]);

const VoiceResponse = twilio.twiml.VoiceResponse;
const cachedConversations = {};

// TWILIO integration below
server.post('/api/voice', (req, res, next) => {
    let userId = req.body.Caller;
    console.log('starting convo for user id %s', userId);

    startConversation(process.env.DL_KEY).then(conv => {
        cachedConversations[userId] = { id: conv.conversationId, watermark: null, lastAccessed: moment().format() };
        console.log('%j', conversations);
        buildAndSendTwimlResponse(req, res, next, userId, 'Hello! Welcome to direct line bot!');
    });
});

server.post('/api/voice/gather', (req, res, next) => {
    const input = req.body.SpeechResult;
    let userId = req.body.Caller;
    console.log('user id: %s | input: %s', userId, input);
    let conv = cachedConversations[userId];
    console.log('got convo: %j', conv);
    conv.lastAccessed = moment().format();

    postActivity(process.env.DL_KEY, conv.id, {
        from: { id: userId, name: userId }, // required (from.name is optional)
        type: 'message',
        text: input
    }).then(() => {
        console.log('posted activity to bot with input %s', input);

        console.log('setting interval');
        let interval = setInterval(function () {
            console.log('getting activities...');
            getActivities(process.env.DL_KEY, conv.id, conv.watermark).then(activitiesResponse => {
                console.log('%j', activitiesResponse);
                let temp = _.filter(activitiesResponse.activities, (m) => m.from.id !== userId);
                if (temp.length > 0) {
                    clearInterval(interval);
                    let responseActivity = temp[0];
                    console.log('got response %j', responseActivity);

                    conv.watermark = activitiesResponse.watermark;
                    if (responseActivity.channelData && responseActivity.channelData.hangup) {
                        buildAndSendHangup(req, res, next);
                    } else {
                        buildAndSendTwimlResponse(req, res, next, userId, responseActivity.speak);
                        conv.lastAccessed = moment().format();
                    }
                } else {
                    console.log('no activities for you...');
                }
            });
        }, 500);
    });
});

function buildAndSendHangup (req, res, next) {
    const twiml = new VoiceResponse();

    Promise.all([generateAudio('Ok, call back anytime!')]).then(
        (uri) => {
            twiml.play(uri[0]);
            twiml.hangup();

            const response = twiml.toString();
            console.log(response);

            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(response),
                'Content-Type': 'text/html'
            });
            res.write(response);
            next();
        });
}

function buildAndSendTwimlResponse (req, res, next, userId, text) {
    const twiml = new VoiceResponse();

    Promise.all(
        [
            generateAudio(text),
            generateAudio('I didn\'t quite catch that. Please try again.'),
            generateAudio('Ok, call back anytime!')]).then(
        uri => {
            let msgUri = uri[0];
            let firstNotCaughtUri = uri[1];
            let goodbyeUri = uri[2];
            // twiml.say(text, { voice: 'Alice' });
            twiml.play(msgUri);
            twiml.gather({ input: 'speech', action: '/api/voice/gather', method: 'POST' });
            // twiml.say('I didn\'t quite catch that. Please try again.', { voice: 'Alice' });
            twiml.play(firstNotCaughtUri);
            twiml.gather({ input: 'speech', action: '/api/voice/gather', method: 'POST' });
            // twiml.say('Ok, call back anytime!');
            twiml.play(goodbyeUri);
            twiml.hangup();

            const response = twiml.toString();
            console.log(response);

            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(response),
                'Content-Type': 'text/html'
            });
            res.write(response);
            next();
        });
}

const baseUrl = 'https://directline.botframework.com/v3/directline';
const conversations = baseUrl + '/conversations';

function startConversation (token) {
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: conversations,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        client.post('', {},
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
}

function postActivity (token, conversationId, activity) {
    // POST to conversations endpoint
    const url = conversations + '/' + conversationId + '/activities';
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        client.post('', activity,
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
}

function getActivities (token, conversationId, watermark) {
    // GET activities from conversations endpoint
    let url = conversations + '/' + conversationId + '/activities';
    if (watermark) {
        url = url + '?watermark=' + watermark;
    }

    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        client.get('',
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
}
