// load env variables
require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const request = require('request');

const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;

function makeRequest(d, psid, metadata, procedure) {
    const data = Object.assign({}, d);
    data.recipient = { 'id': psid };
    data.metadata = metadata;

    const options = {
        uri: "https://graph.facebook.com/v2.6/me/" + procedure + "?access_token=" + pageAccessToken,
        json: data,
        method: 'POST'
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
                return;
            }
            console.log(body);
            resolve();
        });
    });
}

function handover(psid) {
    return makeRequest({ 'target_app_id': 263902037430900 }, psid, 'test', 'pass_thread_control');
}

function takeControl(psid) {
    return makeRequest({}, psid, 'test', 'take_thread_control');
}

// setup our web server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});
console.log('app id: ' + process.env.MICROSOFT_APP_ID);
// initialize the chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const listen = connector.listen();
server.post('/api/messages', (req, res) => {
    console.log('incoming!');
    listen(req, res);
});

const bot = new builder.UniversalBot(connector, [
    (session) => {
        console.log(JSON.stringify(session.message));
        if (session.message.text.toLowerCase() === 'human') {
            let psid = session.message.address.user.id;
            session.send('connecting you...');
            handover(psid);
            return;
        }
        session.send('echo: ' + session.message.text);
    }
]);
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);