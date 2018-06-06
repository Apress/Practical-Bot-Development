const builder = require('botbuilder');
const moment = require('moment');
const _ = require('underscore');

const constants = require('../constants');
const et = require('../entityTranslator');
const gcalapi = require('../services/calendar-api');

const authModule = require('./auth');
const prechecksModule = require('./prechecks');

const lib = new builder.Library('checkAvailability');

lib.dialog(constants.dialogNames.CheckAvailability, [
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
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachCheckAvailabilityEntities(entry, session.dialogData.intent.entities);
        session.dialogData.entry = entry;

        if (!entry.hasDateTime && !entry.hasRange) {
            builder.Prompts.time(session, 'When are we checking availability for?');
        } else {
            next();
        }
    },
    (session, results, next) => {
        const auth = authModule.getAuthClientFromSession(session);
        const entry = new et.EntityTranslator(session.dialogData.entry);

        if (!entry.hasDateTime && !entry.hasRange) {
            entry.setEntity(results.response); // set the datetime entity
        }

        let start, end;
        // const target = entry.hasInvitee ? 'availability for ' + entry.invitee : 'my avalability ';
        if (entry.hasRange) {
            if (entry.isDateTimeEntityDateBased) {
                start = entry.range.start.startOf('day');
                end = entry.range.end.endOf('day');
                // session.endDialog('checking ' + target + ' between ' + entry.range.start.format('L') + ' and  ' + entry.range.end.format('L'));
            } else {
                start = entry.range.start;
                end = entry.range.end;
                // session.endDialog('checking ' + target + ' between ' + entry.range.start.format('L LT') + ' and  ' + entry.range.end.format('L LT'));
            }
        } else if (entry.hasDateTime) {
            if (entry.isDateTimeEntityDateBased) {
                start = moment(entry.dateTime).startOf('day');
                end = moment(entry.dateTime).endOf('day');
                // session.endDialog('checking ' + target + ' on ' + entry.dateTime.format('L'));
            } else {
                start = moment(entry.dateTime).add(-1, 'hour');
                end = moment(entry.dateTime).add(2, 'hour');
                // session.endDialog('checking ' + target + ' on ' + entry.dateTime.format('L LT'));
            }
        }

        gcalapi.freeBusy(auth, session.privateConversationData.calendarId, start, end).then(data => {
            const busy = data.calendars[session.privateConversationData.calendarId].busy;

            if (busy.length === 0) {
                session.endDialog("You're free then!");
            } else if (busy.length === 1) {
                const bstart = moment(busy[0].start);
                const bend = moment(busy[0].end);

                if (entry.hasDateTime) {
                    if (entry.isDateTimeEntityDateBased) {
                        session.endDialog('You are free except for ' + bstart.format('LT') + ' to ' + bend.format('LT'));
                    }
                }
            } else {
                const avail = [];
                const startOfBusiness = moment(entry.dateTime).hour(8).minute(0).second(0).millisecond(0).utc();
                const endOfBusiness = moment(entry.dateTime).hour(19).minute(0).second(0).millisecond(0).utc();

                const first = _.first(busy);
                const last = _.last(busy);
                if (moment(first.start) > startOfBusiness) {
                    busy.unshift({
                        start: moment(startOfBusiness).subtract(30, 'm'),
                        end: startOfBusiness
                    });
                }

                if (moment(last.end) < endOfBusiness) {
                    busy.push({
                        start: endOfBusiness,
                        end: moment(endOfBusiness).add(30, 'm')
                    });
                }

                pairwise(busy, (current, next) => {
                    const diff = Math.abs(moment(current.end).diff(moment(next.start), 'minutes'));
                    if (diff >= 15) {
                        const durationStr = diff > 59 ? (Math.round(diff / 60.0 * 2) / 2).toFixed(1) + ' Hours' : diff + ' Minutes';
                        avail.push({
                            start: moment(current.end).local(),
                            end: moment(next.start).local(),
                            duration: diff,
                            durationStr: durationStr
                        });
                    }
                });

                console.log(JSON.stringify(avail));
            }
        }).catch(err => {
            console.log('Error: ' + err);
            session.endDialog('Issue accessing your free busy!');
        })
    }
]).triggerAction({ matches: constants.intentNames.CheckAvailability });

exports.create = () => { return lib.clone(); }

function pairwise (arr, func) {
    for (let i = 0; i < arr.length - 1; i++) {
        func(arr[i], arr[i + 1])
    }
}
