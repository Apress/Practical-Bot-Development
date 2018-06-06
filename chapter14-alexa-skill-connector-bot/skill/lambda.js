'use strict';

const Alexa = require('alexa-sdk');
const defaultHandlers = {
    'LaunchRequest': function () {
        this.emit(':ask', 'Welcome to finance skill!  I can get your information about quotes or account types.', 'What can I help you with?');
    },
    'GetAccountTypeInformationIntent': function () {
        this.handler.state = 'AccountInfo';
        this.emitWithState(this.event.request.intent.name);
    },
    'QuoteIntent': function () {
        this.handler.state = 'Quote';
        this.emitWithState(this.event.request.intent.name);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Ok. Bye.');
    },
    'Unhandled': function () {
        console.log(JSON.stringify(this.event));
        this.emit(':ask', "I'm not sure what you are talking about.", 'What can I help you with?');
    }
};

const quoteStateHandlers = Alexa.CreateStateHandler('Quote', {
    'LaunchRequest': function () {
        this.handler.state = '';
        this.emitWithState('LaunchRequest');
    },
    'AMAZON.MoreIntent': function () {
        this.emit(':ask', 'More information for quote item ' + this.attributes.quoteitem, 'What else can I help you with?');
    },
    'AMAZON.CancelIntent': function () {
        this.handler.state = '';
        this.emitWithState(this.event.request.intent.name);
    },
    'QuoteIntent': function () {
        console.log(JSON.stringify(this.event));
        let intent = this.event.request.intent;
        let quoteitem = null;
        if (intent && intent.slots.QuoteItem) {
            quoteitem = intent.slots.QuoteItem.value;
        } else {
            quoteitem = this.attributes.quoteitem;
        }
        this.attributes.quoteitem = quoteitem;
        this.emit(':ask', 'Quote for ' + quoteitem, 'What else can I help you with?');
    },
    'GetAccountTypeInformationIntent': function () {
        this.handler.state = '';
        this.emitWithState(this.event.request.intent.name);
    },
    'Unhandled': function () {
        console.log(JSON.stringify(this.event));
        this.emit(':ask', "I'm not sure what you are talking about.", 'What can I help you with?');
    }
});

const accountInfoStateHandlers = Alexa.CreateStateHandler('AccountInfo', {
    'LaunchRequest': function () {
        this.handler.state = '';
        this.emitWithState('LaunchRequest');
    },
    'AMAZON.MoreIntent': function () {
        this.emit(':ask', 'More information for account ' + this.attributes.accounttype, 'What else can I help you with?');
    },
    'AMAZON.CancelIntent': function () {
        this.handler.state = '';
        this.emitWithState(this.event.request.intent.name);
    },
    'GetAccountTypeInformationIntent': function () {
        console.log(JSON.stringify(this.event));
        let intent = this.event.request.intent;
        let accounttype = null;
        if (intent && intent.slots.AccountType) {
            accounttype = intent.slots.AccountType.value;
        } else {
            accounttype = this.attributes.accounttype;
        }
        this.attributes.accounttype = accounttype;
        this.emit(':ask', 'Information for ' + accounttype, 'What else can I help you with?');
    },
    'QuoteIntent': function () {
        this.handler.state = '';
        this.emitWithState(this.event.request.intent.name);
    },
    'Unhandled': function () {
        console.log(JSON.stringify(this.event));
        this.emit(':ask', "I'm not sure what you are talking about.", 'What can I help you with?');
    }
});

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(defaultHandlers, quoteStateHandlers, accountInfoStateHandlers);
    alexa.execute();
};
