const builder = require('botbuilder');
const constants = require('../constants');
const et = require('../entityTranslator');
const utils = require('../utils');

const lib = new builder.Library('removeEntry');

lib.dialog(constants.dialogNames.RemoveCalendarEntry, [
    (session, args, next) => {
        // we support deleting an appointment by finding it via the time or invitee or a combination of both
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachRemoveEntities(entry, args.intent.entities);
        session.dialogData.entry = entry;
        next();
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.entry);
        if (!entry.hasDateTime && !entry.hasInvitee) {
            session.dialogData.collectingTime = true;
            builder.Prompts.time(session, 'Which time do you want to clear?');
        }
        else {
            next();
        }
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.entry);

        if (session.dialogData.collectingTime) {
            entry.setEntity(results.response);
        }

        // if we have an invitee, we kick off the logic that deletes entries based on the invitee information or 
        // both invitee + date/datetime, otherwise try to remove by time
        if (entry.hasInvitee) {
            session.beginDialog(constants.dialogNames.RemoveCalendarEntry_Invitee, { entry: entry });
        } else if (entry.hasDateTime) {
            session.beginDialog(constants.dialogNames.RemoveCalendarEntry_Time, { entry: entry });
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

lib.dialog(constants.dialogNames.RemoveCalendarEntry_Invitee, [
    (session, args) => {
        const entry = new et.EntityTranslator(args.entry);

        if (!entry.hasInvitee) {
            session.endDialogWithResult({ success: false, message: "I'm not sure about that. Please try again." });
            return;
        }

        if (!entry.hasDateTime) {
            session.endDialog('removing entry for appointment with ' + entry.invitee);
            // just search for existing appointment by invitee
        } else if (entry.isDateTimeEntityDateBased) {
            session.endDialog('removing entry for appointment with ' + entry.invitee + ' on ' + entry.dateTime.format('l'));
            // search for meetings withn invitee on this date
        } else {
            session.endDialog('removing entry for appointment with ' + entry.invitee + 'at ' + entry.dateTime.format());
            // search for meeting with invitee at this specific datetime.
            // TODO: if not found make suggestions
        }
    }
]);

exports.create = () => { return lib.clone(); }
