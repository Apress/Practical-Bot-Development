require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');

const constants = require('./constants');
const utils = require('./utils');

const helpModule = require('./dialogs/help');
const authModule = require('./dialogs/auth');
const addEntryModule = require('./dialogs/addEntry');
const removeEntryModule = require('./dialogs/removeEntry');
const editEntryModule = require('./dialogs/editEntry');
const checkAvailabilityModule = require('./dialogs/checkAvailability');
const summarizeModule = require('./dialogs/summarize');
const primaryCalendarModule = require('./dialogs/primaryCalendar');
const prechecksModule = require('./dialogs/prechecks');
const humanEscalationModule = require('./dialogs/humanEscalation');

authModule.setResolvePostLoginDialog((session, args) => {
    if (!session.privateConversationData.calendarId) {
        args.followUpDialog = primaryCalendarModule.getPrimaryCalendarDialogName();
        args.followUpDialogArgs = {
            intent: {
                entities: [
                    utils.wrapEntity(constants.entityNames.Action, constants.entityValues.Action.set)
                ]
            }
        };
    }
    return args;
});

// setup our web server
const server = restify.createServer();
server.use(restify.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});

// initialize the chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector, [
    session => {
        helpModule.help(session);
    }
]);
server.post('/api/messages', connector.listen());
server.get('/oauth2callback', (req, res, next) => {
    authModule.oAuth2Callback(bot, req, res, next);
});

// removing multi language support for now
// const TranslatorMiddleware = require('./translatorMiddleware').TranslatorMiddleware;
// bot.use(new TranslatorMiddleware());

humanEscalationModule.pageAccessToken(process.env.PAGE_ACCESS_TOKEN);

const luisModelUri = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUIS_APP + '?subscription-key=' + process.env.LUIS_SUBSCRIPTION_KEY;
bot.recognizer(new builder.LuisRecognizer(luisModelUri));

bot.library(addEntryModule.create());
bot.library(helpModule.create());
bot.library(authModule.create());
bot.library(removeEntryModule.create());
bot.library(editEntryModule.create());
bot.library(checkAvailabilityModule.create());
bot.library(summarizeModule.create());
bot.library(primaryCalendarModule.create());
bot.library(prechecksModule.create());
bot.library(humanEscalationModule.create());
