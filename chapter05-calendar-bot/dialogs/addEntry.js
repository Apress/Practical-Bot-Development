const builder = require('botbuilder');
const constants = require('../constants');
const et = require('../entityTranslator');
const utils = require('../utils');
const lib = new builder.Library('addEntry');

lib.dialog(constants.dialogNames.AddCalendarEntry, [
    (session, args, next) => {
        // we need to figure out which entities we have in place and we start building our addEntry object
        const entry = new et.EntityTranslator();
        et.EntityTranslatorUtils.attachAddEntities(entry, args.intent.entities);
        session.dialogData.addEntry = entry;
        next();
    },
    (session, results, next) => {
        const entry = new et.EntityTranslator(session.dialogData.addEntry);

        if (!entry.hasDateTime) {
            // we collect the time in case it not defined in user's initial query
            builder.Prompts.time(session, 'When is this meeting?');
        }
        else {
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
        }
        else {
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
        }
        else {
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

        console.log(JSON.stringify(entry));
        // TODO: take the data and call an API to add the calendar entry        

        session.endDialog('Your appointment has been added!');
    }
]).beginDialogAction(constants.dialogNames.AddCalendarEntryHelp, constants.dialogNames.AddCalendarEntryHelp, { matches: constants.intentNames.Help })
    .triggerAction({ matches: constants.intentNames.AddCalendarEntry });

exports.create = () => { return lib.clone(); }
