const constants = require('./constants')
const builder = require('botbuilder');
const moment = require('moment');
const _ = require('underscore');

function isWithin(a_start, a_end, b_start, b_end) {
    if (Math.abs(a_start - b_start) <= 1) return true;
    if (a_start >= b_start && a_end <= b_end) return true;
    return false;
}


class MoveTranslator {
    constructor(data) {
        if (!data) {
        } else {
            _.assign(this, data);
        }
    }

    applyEntities(moveTo, entities, moveFrom) {
        if (moveFrom && moveFrom.type != constants.entityNames.MeetingMove.FromTime) { throw Error('moveFrom is the wrong entity type. Expecting: ' + constants.entityNames.MeetingMove.FromTime); }

        if (!moveTo) { throw Error('moveTo is null. Expected entity.') }

        if (moveTo && moveTo.type != constants.entityNames.MeetingMove.ToTime) { throw Error('moveTo is the wrong entity type. Expecting: ' + constants.entityNames.MeetingMove.ToTime); }

        if (!entities) { throw Error('expecting date time entities'); }

        function populateInviteeAndSubject(translator, entityList) {
            const subject = _.find(entityList, function (p) { return p.type == constants.entityNames.Subject });
            const invitee = _.find(entityList, function (p) { return p.type == constants.entityNames.Invitee });
            if (subject) {
                translator.hasSubject = true;
                translator.subject = subject.entity;
            }

            if (invitee) {
                translator.hasInvitee = true;
                translator.invitee = invitee.entity;
            }
        }

        // if we have a move from and move to, then technically we're expecting a range. let's see if we have any.
        if (moveTo && moveFrom) {
            const range = _.find(entities, function (p) {
                return (p.type == constants.entityNames.Dates.DateRange ||
                    p.type == constants.entityNames.Dates.TimeRange ||
                    p.type == constants.entityNames.Dates.DateTimeRange) &&
                    isWithin(moveFrom.startIndex, moveFrom.endIndex, p.startIndex, p.endIndex);
            });

            if (range) {
                const resolution = _.last(range.resolution.values);
                if (range.type == constants.entityNames.Dates.TimeRange) {
                    this.moveFrom = moment(resolution.start, constants.LUISTimePattern);
                    this.moveTo = moment(resolution.end, constants.LUISTimePattern);
                } else {
                    this.moveFrom = moment(resolution.start);
                    this.moveTo = moment(resolution.end);
                }

                if (range.type == constants.entityNames.Dates.DateRange) this.isDateBased = true;
                else this.isDateBased = false;
            } else {
                // we have to find the entities that match the moveTo and moveFrom. does it really matter what they are? probably not but if they are ranges it'd be awkward.
                // let's start by assuming they are date,datetime or time
                var moveToCandidate = _.find(entities, function (p) {
                    return (p.type == constants.entityNames.Dates.Date ||
                        p.type == constants.entityNames.Dates.Time ||
                        p.type == constants.entityNames.Dates.DateTime) &&
                        isWithin(moveTo.startIndex, moveTo.endIndex, p.startIndex, p.endIndex)
                });
                const moveFromCandidate = _.find(entities, function (p) {
                    return (p.type == constants.entityNames.Dates.Date ||
                        p.type == constants.entityNames.Dates.Time ||
                        p.type == constants.entityNames.Dates.DateTime) &&
                        isWithin(moveFrom.startIndex, moveFrom.endIndex, p.startIndex, p.endIndex)
                });

                if (moveFromCandidate) {
                    const moveFromResolution = _.last(moveFromCandidate.resolution.values).value;
                    if (moveFromCandidate.type == constants.entityNames.Dates.Time) {
                        this.moveFrom = moment(moveFromResolution, constants.LUISTimePattern);
                    } else {
                        this.moveFrom = moment(moveFromResolution);
                    }
                }

                if (moveToCandidate) {
                    var moveToResolution = _.last(moveToCandidate.resolution.values).value;
                    if (moveToCandidate.type == constants.entityNames.Dates.Time) {
                        this.moveTo = moment(moveToResolution, constants.LUISTimePattern);
                    } else {
                        this.moveTo = moment(moveToResolution);
                    }
                }

                if (moveToCandidate && moveToCandidate.type == constants.entityNames.Dates.Date && moveFromCandidate && moveFromCandidate.type == constants.entityNames.Dates.Date) {
                    this.isDateBased = true;
                } else {
                    this.isDateBased = false;
                }
            }

            populateInviteeAndSubject(this, entities);
        } else if (!moveFrom && moveTo) {
            // in this case, we are moving the meeting to a certain time but need to identify it by a date, time or datetime

            var moveToCandidate = _.find(entities, function (p) {
                return (p.type == constants.entityNames.Dates.Date ||
                    p.type == constants.entityNames.Dates.Time ||
                    p.type == constants.entityNames.Dates.DateTime) &&
                    Math.abs(p.startIndex - moveTo.startIndex) <= 1
            });

            if (moveToCandidate) {
                var moveToResolution = _.last(moveToCandidate.resolution.values).value;
                if (moveToCandidate.type == constants.entityNames.Dates.Time) {
                    this.moveTo = moment(moveToResolution, constants.LUISTimePattern);
                } else {
                    this.moveTo = moment(moveToResolution);
                }
            }

            populateInviteeAndSubject(this, entities);
        }
    }
}

exports.MoveTranslator = MoveTranslator;
