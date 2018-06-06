const builder = require('botbuilder');
const _ = require('underscore');

const constants = require('../constants');
const mt = require('../moveTranslator');

const lib = new builder.Library('editEntry');

/* Building out an entire edit functionality can be a large undertaking. There are many possible attributes to edit in many possible ways. We start with the ability
 * to move appointments using natural language */
lib.dialog(constants.dialogNames.EditCalendarEntry, [
    (session, args, next) => {
        // move from and move to are helper entities to help us figure out where the from and to times like. The LUIS range datetime
        // entities can be good but you could imagine a user phrasing the query differently. for example, move 4p meeting to 6pm,
        // would not be identified as a range
        const moveFrom = builder.EntityRecognizer.findEntity(args.intent.entities, constants.entityNames.MeetingMove.FromTime);
        const moveTo = builder.EntityRecognizer.findEntity(args.intent.entities, constants.entityNames.MeetingMove.ToTime);

        const allOtherEntities = _.where(args.intent.entities, function (p) {
            return p.type !== constants.entityNames.MeetingMove.FromTime && p.type !== constants.entityNames.MeetingMove.ToTime;
        });

        // use the move translator to properly identiy the from and to
        const moveTranslator = new mt.MoveTranslator();
        moveTranslator.applyEntities(moveTo, allOtherEntities, moveFrom);

        let prefix = 'Moving ';

        if (moveTranslator.hasSubject) prefix += (moveTranslator.subject + ' ');
        else prefix += 'meeting ';

        if (moveTranslator.hasInvitee) prefix += ('with ' + moveTranslator.invitee + ' ');

        if (moveTranslator.moveFrom && moveTranslator.moveTo) {
            if (moveTranslator.isDateBased) {
                session.endDialog(prefix + ' from ' + moveTranslator.moveFrom.format('L') + ' to ' + moveTranslator.moveTo.format('L'));
            } else {
                session.endDialog(prefix + ' from ' + moveTranslator.moveFrom.format('L LT') + ' to ' + moveTranslator.moveTo.format('L LT'));
            }
        } else if (!moveTranslator.moveFrom && moveTranslator.moveTo) {
            if (moveTranslator.isDateBased) {
                session.endDialog(prefix + ' to ' + moveTranslator.moveTo.format('L'));
            } else {
                session.endDialog(prefix + ' to ' + moveTranslator.moveTo.format('L LT'));
            }
        } else if (!moveTranslator.moveFrom && !moveTranslator.moveTo) {
            session.endDialog("I'm sorry, I'm not sure how to handle that request.");
        }
    }
]).triggerAction({ matches: constants.intentNames.EditCalendarEntry });

exports.create = () => { return lib.clone(); }
