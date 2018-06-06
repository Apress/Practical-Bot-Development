require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const moment = require('moment');
const _ = require('underscore');
const cognitiveServices = require('cognitive-services');

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


// const welcomeMsg = 'Say \'proof\' or \'spell\' to select spell check mode';
const bot = new builder.UniversalBot(connector, [
    session => {
        session.beginDialog('middleware-dialog');
    }
    // ,
    // (session, arg, next) => {
    //     if (session.message.text === 'proof') {
    //         session.beginDialog('spell-check-dialog', { mode: 'proof' });
    //     } else if (session.message.text === 'spell') {
    //         session.beginDialog('spell-check-dialog', { mode: 'spell' });
    //     } else {
    //         session.send(welcomeMsg);
    //     }
    // },
    // session => {
    //     session.send(welcomeMsg);
    // }
]);
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);

bot.dialog('spell-check-dialog', [
    (session, arg) => {
        session.dialogData.mode = arg.mode;
        builder.Prompts.text(session, 'Enter your input text. Say \'exit\' to reconfigure mode.');
    },
    (session, arg) => {
        session.sendTyping();

        const text = arg.response;

        if (text === 'exit') {
            session.endDialog('ok, done.');
            return;
        }

        spellCheck(text, session.dialogData.mode).then(response => {
            session.send(resultText);
            session.replaceDialog('spell-check-dialog', { mode: session.dialogData.mode });
        });
    }
]);

function spellCheck(text, mode) {
    const parameters = {
        mkt: 'en-US',
        mode: mode,
        text: text
    };

    const spellCheckClient = new cognitiveServices.bingSpellCheckV7({
        apiKey: process.env.SC_KEY
    })

    return spellCheckClient.spellCheck({
        parameters
    }).then(response => {
        console.log(response); // we do this so we can easily inspect the resulting object
        const resultText = applySpellCheck(text, response.flaggedTokens);
        return resultText;
    });
}

function applySpellCheck(originalText, possibleProblems) {
    let tempText = originalText;
    let diff = 0;

    for (let i = 0; i < possibleProblems.length; i++) {
        const problemToken = possibleProblems[i];
        const offset = problemToken.offset;
        const originalTokenLength = problemToken.token.length;

        const suggestionObj = problemToken.suggestions[0];
        if (suggestionObj.score < .5) {
            continue;
        }

        const suggestion = suggestionObj.suggestion;
        const lengthDiff = suggestion.length - originalTokenLength;

        tempText = tempText.substring(0, offset + diff) + suggestion + tempText.substring(offset + diff + originalTokenLength);

        diff += lengthDiff;
    }

    return tempText;
}

bot.dialog('middleware-dialog', [
    (session, arg) => {
        let text = session.message.text;
        session.send(text);
    }
]);

// middleware to always convert incoming text thorugh spell check
bot.use({
    receive: function (event, next) {
        if (event.type === 'message') {
            spellCheck(event.text, 'spell').then(resultText => {
                event.text = resultText;
                next();
            });
        }
    },
    send: function (event, next) {
        next();
    }
});