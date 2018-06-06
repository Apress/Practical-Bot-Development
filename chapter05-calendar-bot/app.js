require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var moment = require('moment');
var _ = require('underscore');

var constants = require('./constants');

// setup our web server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// initialize the chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var helpModule = require('./dialogs/help');
var addEntryModule = require('./dialogs/addEntry');
var removeEntryModule = require('./dialogs/removeEntry');
var editEntryModule = require('./dialogs/editEntry');
var checkAvailabilityModule = require('./dialogs/checkAvailability');
var summarizeModule = require('./dialogs/summarize');

var bot = new builder.UniversalBot(connector, [
    function (session) {
        helpModule.help(session);
    }
]);
bot.recognizer(new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUIS_APP + '?subscription-key=' + process.env.LUIS_SUBSCRIPTION_KEY));

bot.library(addEntryModule.create());
bot.library(helpModule.create());
bot.library(removeEntryModule.create());
bot.library(editEntryModule.create());
bot.library(checkAvailabilityModule.create());
bot.library(summarizeModule.create());