const builder = require('botbuilder');

const constants = require('../constants');

const lib = new builder.Library('help');

exports.help = (session) => {
    session.beginDialog('help:' + constants.dialogNames.Help);
};

// help message when help requested during the add calendar entry dialog
lib.dialog(constants.dialogNames.AddCalendarEntryHelp, (session, args, next) => {
    const msg = "To add an appointment, we gather the following information: time, subject and location. You can also simply say 'add appointment with Bob tomorrow at 2pm for an hour for coffee' and we'll take it from there!";
    session.endDialog(msg);
});

// help message when help requested during the remove calendar entry dialog
lib.dialog(constants.dialogNames.RemoveCalendarEntryHelp, (session, args, next) => {
    const msg = '';
    session.endDialog(msg);
});

// top level help
lib.dialog(constants.dialogNames.Help, (session, args, next) => {
    session.endDialog('Hi, I am a calendar concierge bot. I can help you create, delete and move appointments. I can also tell you about your calendar and check your availability!');
}).triggerAction({
    matches: constants.intentNames.Help,
    onSelectAction: (session, args, next) => {
        session.beginDialog(args.action, args);
    }
});

exports.create = () => { return lib.clone(); }
