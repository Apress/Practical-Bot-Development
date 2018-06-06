const builder = require('botbuilder');
const constants = require('../constants');
const et = require('../entityTranslator');
const lib = new builder.Library('summarize');

lib.dialog(constants.dialogNames.ShowCalendarSummary, [
    (session, args, next) => {
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachSummaryEntities(entry, args.intent.entities);

        // at this point, the entry can have dateTime or range and/or subject and/or invitee. 
        let suffix = '';
        if (entry.hasInvitee || entry.hasSubject) {
            suffix += ' for ';
            if (entry.hasSubject) suffix += entry.subject;
            else suffix += 'meeting'
            if (entry.hasInvitee) suffix += ' with ' + entry.invitee;
        }

        if (entry.hasRange) {
            if (entry.isDateTimeEntityDateBased) {
                session.endDialog('summary between ' + entry.range.start.format('L') + ' and  ' + entry.range.end.format('L') + suffix);
            } else {
                session.endDialog('summary between ' + entry.range.start.format('L LT') + ' and  ' + entry.range.end.format('L LT') + suffix);
            }
        } else if (entry.hasDateTime) {
            if (entry.isDateTimeEntityDateBased) {
                session.endDialog('summary on ' + entry.dateTime.format('L') + suffix);
            } else {
                session.endDialog('summary on ' + entry.dateTime.format('L LT') + suffix);
            }
        }
        else {
            session.endDialog("Sorry I don't know what you mean");
        }

    }
]).triggerAction({ matches: constants.intentNames.ShowCalendarSummary });

exports.create = () => { return lib.clone(); }
