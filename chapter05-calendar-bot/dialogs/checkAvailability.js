const builder = require('botbuilder');
const constants = require('../constants');
const et = require('../entityTranslator');
const lib = new builder.Library('checkAvailability');

lib.dialog(constants.dialogNames.CheckAvailability, [
    (session, args, next) => {
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachCheckAvailabilityEntities(entry, args.intent.entities);
        session.dialogData.entry = entry;

        if (!entry.hasDateTime && !entry.hasRange) {
            builder.Prompts.time(session, 'When are we checking availability for?');
        } else {
            next();
        }
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.entry);

        if (!entry.hasDateTime && !entry.hasRange) {
            entry.setEntity(results.response); // set the datetime entity
        }

        const target = entry.hasInvitee ? 'availability for ' + entry.invitee : 'my avalability ';
        if (entry.hasRange) {
            if (entry.isDateTimeEntityDateBased) {
                session.endDialog('checking ' + target + ' between ' + entry.range.start.format('L') + ' and  ' + entry.range.end.format('L'));
            } else {
                session.endDialog('checking ' + target + ' between ' + entry.range.start.format('L LT') + ' and  ' + entry.range.end.format('L LT'));
            }
        } else if (entry.hasDateTime) {
            if (entry.isDateTimeEntityDateBased) {
                session.endDialog('checking ' + target + ' on ' + entry.dateTime.format('L'));
            } else {
                session.endDialog('checking ' + target + ' on ' + entry.dateTime.format('L LT'));
            }
        }
    }
]).triggerAction({ matches: constants.intentNames.CheckAvailability });
exports.create = () => { return lib.clone(); }
