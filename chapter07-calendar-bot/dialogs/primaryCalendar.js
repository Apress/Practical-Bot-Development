const builder = require('botbuilder');
const authModule = require('./auth');
const _ = require('underscore');

const utils = require('../utils');
const constants = require('../constants');
const gcalapi = require('../services/calendar-api');

const libName = 'primaryCalendar';
const lib = new builder.Library(libName);

lib.dialog(constants.dialogNames.PrimaryCalendar, [
    (session, args) => {
        session.dialogData.intent = args == null ? {
            entities: []
        } : args.intent;
        authModule.ensureLoggedIn(session);
    },
    (session, args, next) => {
        const entities = session.dialogData.intent.entities;
        const action = builder.EntityRecognizer.findEntity(entities, constants.entityNames.Action);
        const calendarId = builder.EntityRecognizer.findEntity(entities, constants.entityNames.CalendarId);
        const auth = authModule.getAuthClientFromSession(session);

        if (calendarId) {
            // calendar ids have symbols such as '@' and '.' LUIS, by default, adds whitespace when it sees those symbols. we try to remove.
            calendarId.entity = calendarId.entity.replace(/\s/g, '');
        }

        if (action) {
            const resolvedAction = action.resolution.values[0];

            if (resolvedAction === constants.entityValues.Action.get) {
                let temp = null;
                if (calendarId) { temp = calendarId.entity; }
                if (!temp) {
                    temp = session.privateConversationData.calendarId;
                }

                gcalapi.getCalendar(auth, temp).then(result => {
                    const msg = new builder.Message(session)
                        .attachmentLayout(builder.AttachmentLayout.carousel)
                        .attachments([utils.createCalendarCard(session, result)]);

                    session.send(msg);
                }).catch(err => {
                    console.log(err);
                    session.endDialog('No calendar found.');
                });
            } else if (resolvedAction === constants.entityValues.Action.set) {
                let temp = null;
                if (calendarId) { temp = calendarId.entity; }
                if (!temp) {
                    handleReset(session, auth);
                } else {
                    gcalapi.getCalendar(auth, temp).then(result => {
                        session.privateConversationData.calendarId = result.id;
                        const card = utils.createCalendarCard(session, result);
                        const msg = new builder.Message(session)
                            .attachmentLayout(builder.AttachmentLayout.carousel)
                            .attachments([card])
                            .text('Primary calendar set!');
                        session.send(msg);
                        session.endDialog({ response: { calendarSet: true } });
                    }).catch(err => {
                        console.log(err);
                        session.endDialog('this calendar does not exist');
                        // this calendar id doesnm't exist...
                    });
                }
            } else if (resolvedAction === constants.entityValues.Action.clear) {
                handleReset(session, auth);
            }
        }
    },
    (session, args) => {
        // if we have a response from another primary calendar dialog, we simply finish up!
        if (args.response.calendarSet) {
            session.endDialog({ response: { calendarSet: true } });
            return;
        }

        // else we try to match the user text input to a calendar name
        const name = session.message.text;
        const auth = authModule.getAuthClientFromSession(session);

        gcalapi.listCalendars(auth).then(result => {
            const myCalendars = _.filter(result, p => { return p.accessRole !== 'reader'; });
            const calendar = _.find(myCalendars, item => { return item.summary.toUpperCase() === name.toUpperCase(); });
            if (calendar == null) {
                session.send('No such calendar found.');
                session.replaceDialog(constants.dialogNames.PrimaryCalendar);
            } else {
                session.privateConversationData.calendarId = result.id;
                const card = utils.createCalendarCard(session, result);
                const msg = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments([card])
                    .text('Primary calendar set!');
                session.send(msg);
                session.endDialog({ response: { calendarSet: true } });
            }
        }).catch(err => {
            console.log(err);
            session.endDialog('No calendar found.');
        });
    }
]).triggerAction({
    matches: constants.intentNames.PrimaryCalendar,
    onSelectAction: (session, args, next) => {
        if (_.find(session.dialogStack(), p => { return p.id.indexOf(constants.dialogNames.PrimaryCalendar) >= 0; }) != null) {
            session.replaceDialog(args.action, args);
        } else {
            session.beginDialog(args.action, args);
        }
    }
});

function handleReset (session, auth) {
    gcalapi.listCalendars(auth).then(result => {
        const myCalendars = _.filter(result, p => { return p.accessRole !== 'reader'; });
        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(_.map(myCalendars, item => { return utils.createCalendarCard(session, item); }));

        builder.Prompts.text(session, msg);
    }).catch(err => {
        console.log(err);
        session.endDialog('No calendar found.');
    });
}

lib.dialog(constants.dialogNames.EnsurePrimaryCalendar, (session, args) => {
    if (session.privateConversationData.calendarId) session.endDialog();
    else {
        session.beginDialog(constants.dialogNames.PrimaryCalendar, {
            intent: {
                entities: [
                    utils.wrapEntity(constants.entityNames.Action, constants.entityValues.Action.set)
                ]
            }
        });
    }
});

exports.ensurePrimaryCalendar = session => {
    session.beginDialog(libName + ':' + constants.dialogNames.EnsurePrimaryCalendar);
};

exports.getPrimaryCalendarDialogName = () => {
    return libName + ':' + constants.dialogNames.PrimaryCalendar;
};
exports.create = () => { return lib.clone(); }
