require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const moment = require('moment');
const _ = require('underscore');

const alexaRecognizer = require('./alexaRecognizer').recognizer;
const alexaConnector = require('./alexaConnector');

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
server.post('/api/alexa', (req, res, next) => {
    alexaConnector.handler(req, res, next);
});

const bot = new builder.UniversalBot(connector, [
    session => {
        let response = 'Sorry, I am not sure how to help you on this one. Please try again.';
        let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
            directline: {
                keepSessionOpen: false
            }
        });
        session.send(msg);
    }
]);

bot.recognizer(alexaRecognizer);

bot.dialog('QuoteDialog', [
    (session, args) => {
        let quoteitem = args.intent.entities.QuoteItem.value;
        session.privateConversationData.quoteitem = quoteitem;

        let response = 'Looking up quote for ' + quoteitem;
        let reprompt = 'What else can I help you with?';
        let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
            directline: {
                reprompt: reprompt,
                keepSessionOpen: true
            }
        });
        session.send(msg);
    }
])
    .triggerAction({ matches: 'QuoteIntent' })
    .beginDialogAction('moreQuoteAction', 'MoreQuoteDialog', { matches: 'AMAZON.MoreIntent' });

bot.dialog('MoreQuoteDialog', session => {
    let quoteitem = session.privateConversationData.quoteitem;
    let response = 'Getting more quote information for ' + quoteitem;
    let reprompt = 'What else can I help you with?';
    let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
        directline: {
            reprompt: reprompt,
            keepSessionOpen: true
        }
    });
    session.send(msg);
    session.endDialog();
});

bot.dialog('AccountInformationDialog', [
    (session, args) => {
        let accounttype = args.intent.entities.AccountType.value;
        session.privateConversationData.accounttype = accounttype;

        let response = 'Looking up account type information for ' + accounttype;
        let reprompt = 'What else can I help you with?';
        let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
            directline: {
                keepSessionOpen: true,
                reprompt: reprompt
            }
        });
        session.send(msg);
    }
])
    .triggerAction({ matches: 'GetAccountTypeInformationIntent' })
    .beginDialogAction('moreAccountTypeInformationAction', 'MoreAccountInformationDialog', { matches: 'AMAZON.MoreIntent' });

bot.dialog('MoreAccountInformationDialog', session => {
    let accounttype = session.privateConversationData.accounttype;
    let response = 'Getting more account type information for ' + accounttype;
    let reprompt = 'What else can I help you with?';
    let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
        directline: {
            keepSessionOpen: true,
            reprompt: reprompts
        }
    });
    session.send(msg);
    session.endDialog();
});



bot.dialog('CloseSession', session => {
    let response = 'Ok. Good bye.';
    let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
        directline: {
            keepSessionOpen: false
        }
    });
    session.send(msg);
    session.endDialog();
}).triggerAction({ matches: 'AMAZON.CancelIntent' });

bot.dialog('EndSession', session => {
    session.endConversation();
}).triggerAction({ matches: 'SessionEndedRequest' });

bot.dialog('LaunchBot', session => {
    let response = 'Welcome to finance skill!  I can get your information about quotes or account types.';
    let msg = new builder.Message(session).text(response).speak(response).sourceEvent({
        directline: {
            keepSessionOpen: true
        }
    });
    session.send(msg);
    session.endDialog();
}).triggerAction({ matches: 'LaunchRequest' });

const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);
