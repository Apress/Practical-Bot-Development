const builder = require('botbuilder');
const moment = require('moment');
const _ = require('underscore');

const constants = require('../constants');
const et = require('../entityTranslator');
const utils = require('../utils');
const gcalapi = require('../services/calendar-api');

const authModule = require('./auth');
const prechecksModule = require('./prechecks');

const lib = new builder.Library('removeEntry');

lib.dialog(constants.dialogNames.RemoveCalendarEntry, [
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
        // we support deleting an appointment by finding it via the time or invitee or a combination of both
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachRemoveEntities(entry, session.dialogData.intent.entities);
        session.dialogData.entry = entry;
        next();
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.entry);
        if (!entry.hasDateTime && !entry.hasInvitee && !entry.hasEventId) {
            session.dialogData.collectingTime = true;
            builder.Prompts.time(session, 'Which time do you want to clear?');
        } else {
            next();
        }
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.entry);

        if (session.dialogData.collectingTime) {
            entry.setEntity(results.response);
        }

        const auth = authModule.getAuthClientFromSession(session);
        const completeRemoveEvent = (removePromise, name) => {
            return removePromise.then(reslt => {
                session.endDialog('Removed event called ' + name + '.');
            }).catch(err => {
                console.log(err);
                session.endDialog('Event does not exist.');
            });
        };

        // if we have an invitee, we kick off the logic that deletes entries based on the invitee information or
        // both invitee + date/datetime, otherwise try to remove by time
        if (entry.hasDateTime) {
            const start = moment(entry.dateTime);
            console.log(start);

            gcalapi.listEvents(auth, session.privateConversationData.calendarId,
                moment(entry.dateTime),
                moment(entry.dateTime).add(30, 'm'), entry.subject)
                .then(events => {
                    const includeAllDay = entry.isDateTimeEntityDateBased;

                    const processedEvents = _.filter(events, ev => {
                        if (includeAllDay) return true;
                        else {
                            return ev.start.dateTime != null;
                        }
                    });

                    if (processedEvents.length === 0) {
                        session.endDialog('no events found during this time frame');
                    } else if (processedEvents.length === 1) {
                        const ev = processedEvents[0];
                        completeRemoveEvent(gcalapi.removeEvent(auth, session.privateConversationData.calendarId, ev.id), ev.summary);
                    } else {
                        const msg = new builder.Message(session)
                            .text('Found multiple events during this time frame')
                            .attachmentLayout(builder.AttachmentLayout.carousel)
                            .attachments(_.map(processedEvents, p => { return utils.createEventCard(session, p); }));

                        session.send(msg);
                        session.endDialog();
                    }
                }).catch(err => {
                    console.log(err);
                    session.endDialog('Error while fetching events');
                });
        } else if (entry.hasEventId) {
            gcalapi.getEvent(auth, session.privateConversationData.calendarId, entry.eventId)
                .then(result => {
                    completeRemoveEvent(gcalapi.removeEvent(auth, session.privateConversationData.calendarId, result.id), result.summary);
                }).catch(err => {
                    console.log('Error no event found most likely:\n' + err);
                    session.send('No event found.');
                });
        } else {
            session.endDialog("Hmm, I'm having trouble with that, please try again.");
        }
    },
    (session, results, next) => {
        // results.success tells us whether the sub dialog has completed in the happy path
        session.endDialog(results.message);
    }
]).beginDialogAction(constants.dialogNames.RemoveCalendarEntryHelp, constants.dialogNames.RemoveCalendarEntryHelp, { matches: constants.intentNames.Help })
    .triggerAction({ matches: constants.intentNames.RemoveCalendarEntry });

lib.dialog(constants.dialogNames.RemoveCalendarEntry_Time, [
    (session, args) => {
        const entry = new et.EntityTranslator(args.entry);
        // if there is no time passed, end dialog. this path should fail.
        if (!entry.hasDateTime) {
            session.endDialogWithResult({ success: false, message: "I'm not sure about that. Please try again." });
            return;
        }

        // TODO: logic to remove calendar entry. may need a confirmation dialog if
        // have multiple meetings at the same time.
        session.endDialog('removing entry for ' + entry.dateTime.format());
    }
]);

exports.create = () => { return lib.clone(); }
