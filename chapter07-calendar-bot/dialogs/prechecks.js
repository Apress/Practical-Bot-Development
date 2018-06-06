const builder = require('botbuilder');

const constants = require('../constants');

const authModule = require('./auth');
const primaryCalendarModule = require('./primaryCalendar');

const libName = 'prechecks';
const lib = new builder.Library(libName);

lib.dialog(constants.dialogNames.PreCheck_AuthAndPrimaryCalendar, [
    (session, args) => {
        authModule.ensureLoggedIn(session);
    },
    (session, args) => {
        if (!args.response.authenticated) {
            session.endDialogWithResult({ response: { error: 'You must authenticate to continue.', error_auth: true } });
        } else {
            primaryCalendarModule.ensurePrimaryCalendar(session);
        }
    },
    (session, args, next) => {
        if (session.privateConversationData.calendarId) session.endDialogWithResult({ response: { } });
        else session.endDialogWithResult({ response: { error: 'You must set a primary calendar to continue.', error_calendar: true } });
    }
]);

exports.create = () => { return lib.clone(); }
exports.ensurePrechecks = session => {
    session.beginDialog(libName + ':' + constants.dialogNames.PreCheck_AuthAndPrimaryCalendar);
};
