require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const _ = require('underscore');

const slackApi = require('./slackApi');
const multiFlowSteps = require('./stepData').multiStepData;

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
        if (session.message.text === 'order pizza') {
            session.beginDialog('multi-step-flow');
        } else if (session.message.text === 'simple') {
            session.beginDialog('simpleflow');
        } else {
            session.send('not a command! try \'simple\' or \'order pizza\'');
            session.endConversation();
        }
    },
    session => {
        session.send('done!!!');
        session.endConversation();
    }
]);

const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);

class WaterfallWithRecognizeDialog extends builder.WaterfallDialog {
    constructor (callbackId, steps) {
        super(steps);
        this.callbackId = callbackId;
    }

    recognize (context, done) {
        let cb = this.callbackId;
        if (_.isFunction(this.callbackId)) {
            cb = this.callbackId();
        }
        if (!_.isArray(cb)) cb = [cb];

        let intent = { score: 0.0 };
        for (let i = 0; i < cb.length; i++) {
            if (isCallbackResponse(context, cb[i])) {
                intent = { score: 1.0 };
                break;
            }
        }

        done(null, intent);
    }
}

bot.dialog('multi-step-flow', new WaterfallWithRecognizeDialog(['pizzatype', 'ingredient', 'finish'], [
    (session, arg, next) => {
        if (session.message.text === 'quit') {
            session.endDialog();
            return;
        }

        if (isCallbackResponse(session)) {
            let responseUrl = session.message.sourceEvent.Payload.response_url;
            let token = session.message.sourceEvent.Payload.token;
            console.log(JSON.stringify(session.message));
            let client = restify.createJsonClient({
                url: responseUrl
            });

            let text = '';
            let attachments = [];
            let val = null;
            const payload = session.message.sourceEvent.Payload;

            if (payload.actions && payload.actions.length > 0) {
                val = payload.actions[0].value;
                if (!val) {
                    val = payload.actions[0].selected_options[0].value;
                }
            }

            if (isCallbackResponse(session, 'pizzatype')) {
                session.privateConversationData.workflowData.pizzatype = val;
                const ingredientStep = multiFlowSteps[val];
                text = ingredientStep.text;
                attachments = ingredientStep.attachments;
            } else if (isCallbackResponse(session, 'ingredient')) {
                session.privateConversationData.workflowData.ingredient = val;
                const ingredientstep = multiFlowSteps.collectsize;
                text = ingredientstep.text;
                attachments = ingredientstep.attachments;
            } else if (isCallbackResponse(session, 'finish')) {
                session.privateConversationData.workflowData.size = val;
                text = 'Flow completed with data: ' + JSON.stringify(session.privateConversationData.workflowData);
                attachments = multiFlowSteps.finish.attachments;
            }

            client.post('', {
                token: token,
                text: text,
                attachments: attachments
            }, function (err, req, res, obj) {
                if (err) console.log('Error -> %j', err);
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                if (isCallbackResponse(session, 'finish')) {
                    session.send('The flow is completed!');
                    session.endDialog();
                }
            });
        } else {
            const apiToken = session.message.sourceEvent.ApiToken;
            const channel = session.message.sourceEvent.SlackMessage.event.channel;
            const typemsg = multiFlowSteps.pizzatype;

            session.privateConversationData.workflowData = {};
            slackApi.postMessage(apiToken, channel, typemsg.text, typemsg.attachments).then(function () {
                console.log('created message');
            });
        }
        session.save();
    }
]));

bot.dialog('simpleflow', [
    (session, arg, next) => {
        builder.Prompts.choice(session, 'A request for access to /SYS13/ABD has come in. Do you want to approve?', 'Yes|No');
    },
    (session, arg) => {
        let r = arg.response.entity;
        let attachment = null;
        let userId = null;
        const isTextMessage = session.message.sourceEvent.SlackMessage; // this means we receive a slack message
        if (isTextMessage) {
            userId = session.message.sourceEvent.SlackMessage.event.user;
        } else {
            userId = session.message.sourceEvent.Payload.user.id;
        }
        attachment = {
            color: 'danger',
            text: 'Rejected by <@' + userId + '>'
        };
        if (r === 'No') {

        } else if (r === 'Yes') {
            attachment = {
                color: 'good',
                text: 'Approved by <@' + userId + '>'
            };
        }

        if (isTextMessage) {
            let msg = new builder.Message(session).sourceEvent({
                'slack': {
                    text: 'Request for access to /SYS13/ABD',
                    attachments: [attachment]
                }
            });
            session.send(msg);
        } else {
            let responseUrl = session.message.sourceEvent.Payload.response_url;
            let token = session.message.sourceEvent.Payload.token;
            let client = restify.createJsonClient({
                url: responseUrl
            });
            client.post('', {
                token: token,
                text: 'Request for access to /SYS13/ABD',
                attachments: [attachment]
            }, function (err, req, res, obj) {
                if (err) console.log('Error -> %j', err);
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                session.endDialog();
            });
        }
    }
]);

bot.dialog('remove_action', [
    (session, arg) => {
        let responseUrl = session.message.sourceEvent.Payload.response_url;
        let token = session.message.sourceEvent.Payload.token;
        let client = restify.createJsonClient({
            url: responseUrl
        });

        client.post('', {
            token: token,
            text: 'Sorry, this action has expired.'
        }, function (err, req, res, obj) {
            if (err) console.log('Error -> %j', err);
            console.log('%d -> %j', res.statusCode, res.headers);
            console.log('%j', obj);
            session.endDialog();
        });
    }
]).triggerAction({ matches: 'practicalbot.expire' });

bot.recognizer({
    recognize: function (context, done) {
        let intent = { score: 0.0 };
        if (isCallbackResponse(context)) {
            intent = { score: 1.0, intent: 'practicalbot.expire' };
        }
        done(null, intent);
    }
});

const isCallbackResponse = function (context, callbackId) {
    const msg = context.message;
    let result = msg.sourceEvent &&
        msg.sourceEvent.Payload &&
        msg.sourceEvent.Payload.response_url;

    if (callbackId) {
        result = result && msg.sourceEvent.Payload.callback_id === callbackId;
    }
    return result;
};
