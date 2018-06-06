const builder = require('botbuilder');
const moment = require('moment');

const constants = require('../constants');
const et = require('../entityTranslator');
const utils = require('../utils');
const gcalapi = require('../services/calendar-api');

const authModule = require('./auth');
const prechecksModule = require('./prechecks');

const lib = new builder.Library('addEntry');

lib.dialog(constants.dialogNames.AddCalendarEntry, [
    (session, args) => {
        session.dialogData.intent = args.intent;
        prechecksModule.ensurePrechecks(session);
    },
    (session, args, next) => {
        if (args.response.error) {
            session.endDialog(args.response.error);
            return;
        }
        next();
    },
    (session, args, next) => {
        // we need to figure out which entities we have in place and we start building our addEntry object
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachAddEntities(entry, session.dialogData.intent.entities);
        session.dialogData.addEntry = entry;
        next();
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.addEntry);

        if (!entry.hasDateTime) {
            // we collect the time in case it not defined in user's initial query
            builder.Prompts.time(session, 'When is this meeting?');
        } else {
            next();
        }
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.addEntry);

        if (!entry.hasDateTime) {
            entry.setEntity(results.response);
        }

        // we HAVE to do this at each step of the waterfall, because sesison.dialogData serializes the object into a vanilla
        // js object, losing its identity.
        session.dialogData.addEntry = entry;

        if (!entry.hasSubject) {
            // collect meeting subject if not defined in user's initial query
            builder.Prompts.text(session, 'What is this meeting about?')
        } else {
            next();
        }
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.addEntry);

        if (!entry.hasSubject) {
            entry.setSubjectEntity(utils.wrapEntity(constants.entityNames.Subject, results.response));
        }

        session.dialogData.addEntry = entry;

        // collect meeting location if not defined in user's initial query
        if (!entry.hasLocation) {
            builder.Prompts.text(session, 'Where is this meeting happening?')
        } else {
            next();
        }
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.addEntry);

        if (!entry.hasLocation) {
            entry.setLocationEntity(utils.wrapEntity(constants.entityNames.Location, results.response));
        }

        session.dialogData.addEntry = entry;

        next();
    },
    (session, results) => {
        const entry = new et.EntityTranslator(session.dialogData.addEntry);
        const auth = authModule.getAuthClientFromSession(session);

        let start, end;
        let p = null;
        if (entry.hasRange) {
            start = entry.range.start;
            end = entry.range.end;
            if (entry.isDateTimeEntityDateBased) {
                p = gcalapi.insertEvent(auth, session.privateConversationData.calendarId, start, end, entry.subject, entry.location);
            } else {
                p = gcalapi.insertAllDayEvent(auth, session.privateConversationData.calendarId, start, end, entry.subject, entry.location);
            }
        } else {
            start = entry.dateTime;
            if (!entry.isDateTimeEntityDateBased) {
                if (entry.hasDuration) {
                    end = moment(start).add(entry.duration, 's');
                } else {
                    end = moment(start).add(30, 'm');
                }

                p = gcalapi.insertEvent(auth, session.privateConversationData.calendarId, start, end, entry.subject, entry.location);
            } else {
                end = moment(start);

                p = gcalapi.insertAllDayEvent(auth, session.privateConversationData.calendarId, start, end, entry.subject, entry.location);
            }
        }

        p.then(result => {
            let evCard = utils.createEventCard(session, result);
            let msg = new builder.Message(session).text('Your appointment has been added.').attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments([evCard]);
            session.send(msg);
            session.endDialog();
        }).catch(err => {
            console.log(err);
        });
    }
]).beginDialogAction(constants.dialogNames.AddCalendarEntryHelp, constants.dialogNames.AddCalendarEntryHelp, { matches: constants.intentNames.Help })
    .triggerAction({ matches: constants.intentNames.AddCalendarEntry });

exports.create = () => { return lib.clone(); }
