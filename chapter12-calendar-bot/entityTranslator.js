const constants = require('./constants')
const builder = require('botbuilder');
const moment = require('moment');
const _ = require('underscore');

class EntityTranslator {
    constructor (data) {
        if (!data) {
            this.isDateTimeEntityDfunctionateBased = false;
        } else {
            /* this is used when the bot builder sdk serializes state across waterfall steps, the serialization
               doesn't store the type so it deserializes into a vanilla js object. we use this constructor
               to get the object back in its proper state.
            */
            _.assign(this, data);
            if (this.range) {
                if (this.range.start) this.range.start = moment(this.range.start);
                if (this.range.end) this.range.end = moment(this.range.end);
            }
            if (this.hasDateTime) {
                this.dateTime = moment(this.dateTime);
            }
        }
    }

    setEntity (val) {
        if (!val) return;
        if (!val.type) return;

        if (val.type === constants.entityNames.Subject) this.setSubjectEntity(val);
        else if (val.type === constants.entityNames.Location) this.setLocationEntity(val);
        else if (val.type === constants.entityNames.Email) this.setEmailEntity(val);
        else if (val.type === constants.entityNames.Invitee) this.setInviteeEntity(val);
        else if (val.type === constants.entityNames.Dates.Date) this.setDateEntity(val);
        else if (val.type === constants.entityNames.Dates.Time) this.setTimeEntity(val);
        else if (val.type === constants.entityNames.Dates.DateTime) this.setDateTimeEntity(val);
        else if (val.type === constants.entityNames.Dates.DateRange) this.setDateRangeEntity(val);
        else if (val.type === constants.entityNames.Dates.DateTimeRange) this.setDateTimeRangeEntity(val);
        else if (val.type === constants.entityNames.Dates.TimeRange) this.setTimeRangeEntity(val);
        else if (val.type === constants.entityNames.Dates.Duration) this.setDurationEntity(val);
        else if (val.type === constants.entityNames.EntryVisibility.Private) this.setPrivateEntity(val);
        else if (val.type === constants.entityNames.EntryVisibility.Public) this.setPublicEntity(val);
        else if (val.type === constants.entityNames.Chrono) this.setChronoEntity(val);
        else if (val.type === constants.entityNames.EventId) this.setEventIdEntity(val);
        else {
            throw Error('Unrecognized entity. ' + JSON.stringify(val));
        }
    }

    setDateEntity (date) {
        if (date) {
            this.isDateTimeEntityDateBased = true;
            this.dateTime = moment(date.resolution.values[0].value);
            this.hasDateTime = true;
        }
    }

    setDateTimeEntity (dateTime) {
        if (dateTime) {
            this.isDateTimeEntityDateBased = false;
            this.dateTime = moment(dateTime.resolution.values[0].value);
            this.hasDateTime = true;
        }
    }

    setTimeEntity (time) {
        if (time) {
            this.isDateTimeEntityDateBased = false;
            this.dateTime = moment(time.resolution.values[0].value, constants.LUISTimePattern);
            this.hasDateTime = true;
        }
    }

    setDurationEntity (duration) {
        if (duration) {
            this.duration = parseInt(duration.resolution.values[0].value);
            this.hasDuration = true;
        }
    }

    setEventIdEntity (eventId) {
        if (eventId) {
            this.eventId = eventId.entity;
            this.hasEventId = true;
        }
    }

    setDateRangeEntity (dateRange) {
        if (dateRange) {
            this.isDateTimeEntityDateBased = true;
            const resolution = _.last(dateRange.resolution.values);
            this.range = {
                start: moment(resolution.start),
                end: moment(resolution.end)
            }
            this.hasRange = true;
        }
    }

    setTimeRangeEntity (timeRange) {
        if (timeRange) {
            this.isDateTimeEntityDateBased = false;
            const resolution = _.last(timeRange.resolution.values);
            this.range = {
                start: moment(resolution.start, constants.LUISTimePattern),
                end: moment(resolution.end, constants.LUISTimePattern)
            }
            this.hasRange = true;
        }
    }

    setDateTimeRangeEntity (dateTimeRange) {
        if (dateTimeRange) {
            this.isDateTimeEntityDateBased = false;
            const resolution = _.last(dateTimeRange.resolution.values);
            this.range = {
                start: moment(resolution.start),
                end: moment(resolution.end)
            }
            this.hasRange = true;
        }
    }

    setSubjectEntity (subject) {
        if (subject) {
            this.subject = subject.entity;
            this.hasSubject = true;
        }
    }

    setInviteeEntity (invitee) {
        if (invitee) {
            this.invitee = invitee.entity;
            this.hasInvitee = true;
        }
    }

    setEmailEntity (email) {
        if (email) {
            this.email = email.entity;
            this.hasEmail = true;
        }
    }

    setLocationEntity (location) {
        if (location) {
            this.location = location.entity;
            this.hasLocation = true;
        }
    }

    setPublicEntity (publicEntity) {
        if (publicEntity) {
            this.isPrivate = false;
        }
    }

    setPrivateEntity (privateEntity) {
        if (privateEntity) {
            this.isPrivate = true;
        }
    }

    setChronoEntity (chrono) {
        // chrono will either represent an instant or a range. if we give a vague date input, it returns a noon time. for our purposes we consider this a datetime.
        if (chrono.resolution.end) {
            // range
            this.hasRange = true;
            this.range = {
                start: moment(chrono.resolution.start),
                end: moment(chrono.resolution.end)
            };
        } else {
            this.hasDateTime = true;
            this.dateTime = moment(chrono.resolution.start);
        }
    }
}
exports.EntityTranslator = EntityTranslator;

const entityTranslatorUtils = {};

entityTranslatorUtils.attachAddEntities = (entityTranslator, entities) => {
    // we will support reffering to a meeting in a datetime instant ('tomorrow at 5pm'), a time ('5pm'), which assumes today, and an optional duration ('1 hour') to set the meeting duration
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTime));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Time));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Duration));

    // we can also add an invitee
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Invitee));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Email));

    // location, subject and calendar visibility
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Location));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Subject));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.EntryVisibility.Private));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.EntryVisibility.Public));
};

entityTranslatorUtils.attachRemoveEntities = (entityTranslator, entities) => {
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTime));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Time));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Date));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Invitee));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.EventId));
};

entityTranslatorUtils.attachCheckAvailabilityEntities = (entityTranslator, entities) => {
    // entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTime));
    // entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Time));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Date));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Invitee));
    // entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTimeRange));
    // entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.TimeRange));
    // entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateRange));
};

entityTranslatorUtils.attachSummaryEntities = (entityTranslator, entities) => {
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTime));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Time));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Date));

    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTimeRange));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.TimeRange));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateRange));

    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Invitee));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Subject));
};

entityTranslatorUtils.attachCheckAvailabilityEntities = (entityTranslator, entities) => {
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTime));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Time));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.Date));

    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateTimeRange));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.TimeRange));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Dates.DateRange));

    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Invitee));
    entityTranslator.setEntity(builder.EntityRecognizer.findEntity(entities, constants.entityNames.Subject));
};

exports.EntityTranslatorUtils = entityTranslatorUtils;
