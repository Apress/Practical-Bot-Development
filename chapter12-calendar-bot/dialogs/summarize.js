const builder = require('botbuilder');
const _ = require('underscore');
const moment = require('moment');

const utils = require('../utils');
const constants = require('../constants');
const et = require('../entityTranslator');
const gcalapi = require('../services/calendar-api');

const authModule = require('./auth');
const prechecksModule = require('./prechecks');

const lib = new builder.Library('summarize');

lib.dialog(constants.dialogNames.ShowCalendarSummary, [
    function (session, args) {
        session.dialogData.intent = args.intent;
        prechecksModule.ensurePrechecks(session);
    },
    function (session, args, next) {
        if (args.response.error) {
            session.endDialog(args.response.error);
            return;
        }
        next();
    },
    function (session, args, next) {
        const auth = authModule.getAuthClientFromSession(session);
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachSummaryEntities(entry, session.dialogData.intent.entities);
        let start = null;
        let end = null;

        if (entry.hasRange) {
            if (entry.isDateTimeEntityDateBased) {
                start = moment(entry.range.start).startOf('day');
                end = moment(entry.range.end).endOf('day');
            } else {
                start = moment(entry.range.start);
                end = moment(entry.range.end);
            }
        } else if (entry.hasDateTime) {
            if (entry.isDateTimeEntityDateBased) {
                start = moment(entry.dateTime).startOf('day');
                end = moment(entry.dateTime).endOf('day');
            } else {
                start = moment(entry.dateTime).add(-1, 'h');
                end = moment(entry.dateTime).add(1, 'h');
            }
        } else {
            session.endDialog("Sorry I don't know what you mean");
            return;
        }

        const p = gcalapi.listEvents(auth, session.privateConversationData.calendarId, start, end);
        p.then(function (events) {
            let evs = _.sortBy(events, function (p) {
                if (p.start.date) {
                    return moment(p.start.date).add(-1, 's').valueOf();
                } else if (p.start.dateTime) {
                    return moment(p.start.dateTime).valueOf();
                }
            });

            // should also potentially filter by subject
            evs = _.filter(evs, function (p) {
                if (!entry.hasSubject) return true;

                const containsSubject = entry.subject.toLowerCase().indexOf(entry.subject.toLowerCase()) >= 0;
                return containsSubject;
            });

            const eventmsg = new builder.Message(session);
            if (evs.length > 1) {
                eventmsg.text('Here is what I found...');
            } else if (evs.length === 1) {
                eventmsg.text('Here is the event I found.');
            } else {
                eventmsg.text('Seems you have nothing going on then. What a sad existence you lead.');
            }

            if (evs.length >= 1) {
                const cards = _.map(evs, function (p) {
                    return utils.createEventCard(session, p);
                });
                eventmsg.attachmentLayout(builder.AttachmentLayout.carousel);
                eventmsg.attachments(cards);
            }

            session.send(eventmsg);
            session.endDialog();
        });
    }
]).triggerAction({ matches: constants.intentNames.ShowCalendarSummary });

exports.create = function () { return lib.clone(); }
