/* global beforeEach, describe, it, expect */
const et = require('../../entityTranslator');
const moment = require('moment');
const _ = require('underscore');

describe('Operations', function () {
    beforeEach(function () {
    });

    describe('Entity Translator', function () {
        it('should translate subject', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasSubject).toBeFalsy();
            translate.setEntity(testSubject);
            expect(translate.hasSubject).toBeTruthy();
            expect(translate.subject).toBe(testSubject.entity);
        });

        it('should translate location', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasLocation).toBeFalsy();
            translate.setEntity(testLocation);
            expect(translate.hasLocation).toBeTruthy();
            expect(translate.location).toBe(testLocation.entity);
        });

        it('should translate email', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasEmail).toBeFalsy();
            translate.setEntity(testEmail);
            expect(translate.hasEmail).toBeTruthy();
            expect(translate.email).toBe(testEmail.entity);
        });

        it('should translate invitee', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasInvitee).toBeFalsy();
            translate.setEntity(testInvitee);
            expect(translate.hasInvitee).toBeTruthy();
            expect(translate.invitee).toBe(testInvitee.entity);
        });

        it('should translate date', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasDateTime).toBeFalsy();
            translate.setEntity(testDate);
            expect(translate.hasDateTime).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeTruthy();
            expect(translate.dateTime.format()).toBe(moment(testDate.resolution.values[0].value).format());
        });

        it('should translate datetime', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasDateTime).toBeFalsy();
            translate.setEntity(testDateTime);
            expect(translate.hasDateTime).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.dateTime.format()).toBe(moment(testDateTime.resolution.values[0].value).format());
        });

        it('should translate time', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasDateTime).toBeFalsy();
            translate.setEntity(testTime);
            expect(translate.hasDateTime).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.dateTime.format()).toBe(moment(testTime.resolution.values[0].value, 'HH:mm:ss').format());
        });

        it('should set time range', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasRange).toBeFalsy();
            translate.setEntity(testTimeRange);
            expect(translate.hasRange).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();

            expect(translate.range.start.format()).toBe(moment(_.last(testTimeRange.resolution.values).start, 'HH:mm:ss').format());
            expect(translate.range.end.format()).toBe(moment(_.last(testTimeRange.resolution.values).end, 'HH:mm:ss').format());
        });

        it('should set date range', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasRange).toBeFalsy();
            translate.setEntity(testDateRange);
            expect(translate.hasRange).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeTruthy();
            expect(translate.range.start.format()).toBe(moment(_.last(testDateRange.resolution.values).start).format());
            expect(translate.range.end.format()).toBe(moment(_.last(testDateRange.resolution.values).end).format());
        });

        it('should set datetime range', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasRange).toBeFalsy();
            translate.setEntity(testDateTimeRange);
            expect(translate.hasRange).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.range.start.format()).toBe(moment(_.last(testDateTimeRange.resolution.values).start).format());
            expect(translate.range.end.format()).toBe(moment(_.last(testDateTimeRange.resolution.values).end).format());
        });

        it('should set duration', function () {
            const translate = new et.EntityTranslator();
            expect(translate.hasDuration).toBeFalsy();
            translate.setEntity(testDuration);
            expect(translate.hasDuration).toBeTruthy();
            expect(translate.duration).toBe(parseInt(_.first(testDuration.resolution.values).value));
        });

        it('should fail on unknown entity', function () {
            const translate = new et.EntityTranslator();
            const testEntity = _.clone(testInvitee);
            testEntity.type = 'unknown';
            expect(translate.setEntity.bind(null, testEntity)).toThrow();
        });

        it('should set visibility to private', function () {
            const translate = new et.EntityTranslator();
            expect(translate.isPrivate).toBeFalsy();
            translate.setEntity(testPrivate);
            expect(translate.isPrivate).toBeTruthy();
        });

        it('should set visibility to public is not a thing', function () {
            const translate = new et.EntityTranslator();
            expect(translate.isPrivate).toBeFalsy();
            translate.setEntity(testPublic);
            expect(translate.isPrivate).toBeFalsy();
        });

        it('should copy properties from data on init', function () {
            const testdata = { a: 1, b: 2 };
            const translate = new et.EntityTranslator(testdata);
            expect(translate.a).toBe(testdata.a);
            expect(translate.b).toBe(testdata.b);
        });

        it('should accept chrono.duration datetime', function () {
            const translate = new et.EntityTranslator();
            translate.setEntity(testChronosDateTime);

            expect(translate.hasDateTime).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.dateTime.format()).toBe(moment(testChronosDateTime.resolution.start).format());
        });

        it('should accept chrono.duration date', function () {
            const translate = new et.EntityTranslator();
            translate.setEntity(testChronosDate);

            expect(translate.hasDateTime).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.dateTime.format()).toBe(moment(testChronosDate.resolution.start).format());
        });

        it('should accept chrono.duration time', function () {
            const translate = new et.EntityTranslator();
            translate.setEntity(testChronosTime);

            expect(translate.hasDateTime).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.dateTime.format()).toBe(moment(testChronosTime.resolution.start).format());
        });

        it('should accept chrono.duration time range', function () {
            const translate = new et.EntityTranslator();
            translate.setEntity(testChronosTimeRange);

            expect(translate.hasDateTime).toBeFalsy();
            expect(translate.hasRange).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.range.start.format()).toBe(moment(testChronosTimeRange.resolution.start).format());
            expect(translate.range.end.format()).toBe(moment(testChronosTimeRange.resolution.end).format());
        });

        it('should accept chrono.duration date range', function () {
            const translate = new et.EntityTranslator();
            translate.setEntity(testChronosDateRange);

            expect(translate.hasDateTime).toBeFalsy();
            expect(translate.hasRange).toBeTruthy();
            expect(translate.isDateTimeEntityDateBased).toBeFalsy();
            expect(translate.range.start.format()).toBe(moment(testChronosDateRange.resolution.start).format());
            expect(translate.range.end.format()).toBe(moment(testChronosDateRange.resolution.end).format());
        });
    });
});

// dummy test data below
const testInvitee = {
    'entity': 'bob',
    'type': 'CalendarBot.Invitee',
    'startIndex': 10,
    'endIndex': 12,
    'score': 0.8880909
};
const testLocation = {
    'entity': 'starbucks',
    'type': 'CalendarBot.Location',
    'startIndex': 41,
    'endIndex': 49,
    'score': 0.996408
};
const testEmail = {
    'entity': 'bob@gmail.com',
    'type': 'builtin.email',
    'startIndex': 10,
    'endIndex': 22
};
const testSubject = {
    'entity': 'coffee',
    'type': 'CalendarBot.Subject',
    'startIndex': 9,
    'endIndex': 14,
    'score': 0.9941526
};
const testDate = {
    'entity': 'tomorrow',
    'type': 'builtin.datetimeV2.date',
    'startIndex': 26,
    'endIndex': 33,
    'resolution': {
        'values': [
            {
                'timex': '2017-09-05',
                'type': 'date',
                'value': '2017-09-05'
            }
        ]
    }
};
const testTime = {
    'entity': '1pm',
    'type': 'builtin.datetimeV2.time',
    'startIndex': 29,
    'endIndex': 31,
    'resolution': {
        'values': [
            {
                'timex': 'T13',
                'type': 'time',
                'value': '13:00:00'
            }
        ]
    }
};
const testDateTime = {
    'entity': 'tomorrow at 1pm',
    'type': 'builtin.datetimeV2.datetime',
    'startIndex': 26,
    'endIndex': 40,
    'resolution': {
        'values': [
            {
                'timex': '2017-09-05T13',
                'type': 'datetime',
                'value': '2017-09-05 13:00:00'
            }
        ]
    }
};
const testTimeRange = {
    'entity': 'from 1pm to 5pm',
    'type': 'builtin.datetimeV2.timerange',
    'startIndex': 26,
    'endIndex': 40,
    'resolution': {
        'values': [
            {
                'timex': '(T13,T17,PT4H)',
                'type': 'timerange',
                'start': '13:00:00',
                'end': '17:00:00'
            }
        ]
    }
};
const testDateRange = {
    'entity': 'from 2/4 to 3/4',
    'type': 'builtin.datetimeV2.daterange',
    'startIndex': 26,
    'endIndex': 40,
    'resolution': {
        'values': [
            {
                'timex': '(XXXX-02-04,XXXX-03-04,P28D)',
                'type': 'daterange',
                'start': '2017-02-04',
                'end': '2017-03-04'
            },
            {
                'timex': '(XXXX-02-04,XXXX-03-04,P28D)',
                'type': 'daterange',
                'start': '2018-02-04',
                'end': '2018-03-04'
            }
        ]
    }
};
const testDateTimeRange = {
    'entity': 'from 2/4 1pm to 2/15 6pm',
    'type': 'builtin.datetimeV2.datetimerange',
    'startIndex': 26,
    'endIndex': 50,
    'resolution': {
        'values': [
            {
                'timex': '(XXXX-02-04T13,XXXX-02-15T18,PT269H)',
                'type': 'datetimerange',
                'start': '2017-02-04 13:00:00',
                'end': '2017-02-15 18:00:00'
            },
            {
                'timex': '(XXXX-02-04T13,XXXX-02-15T18,PT269H)',
                'type': 'datetimerange',
                'start': '2018-02-04 13:00:00',
                'end': '2018-02-15 18:00:00'
            }
        ]
    }
};

const testDuration = {
    'entity': '30 minutes',
    'type': 'builtin.datetimeV2.duration',
    'startIndex': 56,
    'endIndex': 65,
    'resolution': {
        'values': [
            {
                'timex': 'PT30M',
                'type': 'duration',
                'value': '1800'
            }
        ]
    }
};

const testPrivate = {
    'entity': 'privately',
    'type': 'EntryVisbility::Private',
    'startIndex': 5,
    'endIndex': 13,
    'score': 0.999321461
};
const testPublic = {
    'entity': 'publicly',
    'type': 'EntryVisbility::Public',
    'startIndex': 5,
    'endIndex': 13,
    'score': 0.999321461
};

const testChronosDateTime = {
    type: 'chrono.duration',
    entity: 'tomorrow 1pm',
    startIndex: 0,
    endIndex: 12,
    resolution:
  {
      resolution_type: 'chrono.duration',
      start: '2017-09-06T17:00:00.000Z',
      ref: '2017-09-05T10:41:32.070Z'
  },
    score: 1
};

const testChronosDate = {
    'type': 'chrono.duration',
    'entity': '9/7',
    'startIndex': 0,
    'endIndex': 3,
    'resolution': {
        'resolution_type': 'chrono.duration',
        'start': '2017-09-07T16:00:00.000Z',
        'ref': '2017-09-05T10:50:48.991Z'
    },
    'score': 1
};

const testChronosTime = {
    'type': 'chrono.duration',
    'entity': '1pm',
    'startIndex': 0,
    'endIndex': 3,
    'resolution':
  {
      'resolution_type': 'chrono.duration',
      'start': '2017-09-05T17:00:00.000Z',
      'ref': '2017-09-05T10:49:52.095Z'
  },
    'score': 1
};

const testChronosTimeRange = {
    type: 'chrono.duration',
    entity: '1p to 5p',
    startIndex: 0,
    endIndex: 8,
    resolution:
  {
      resolution_type: 'chrono.duration',
      start: '2017-09-05T17:00:00.000Z',
      end: '2017-09-05T21:00:00.000Z',
      ref: '2017-09-05T11:04:34.414Z'
  },
    score: 1
};

const testChronosDateRange = {
    type: 'chrono.duration',
    entity: '2/4 to 3/4',
    startIndex: 0,
    endIndex: 10,
    resolution:
  {
      resolution_type: 'chrono.duration',
      start: '2017-02-04T17:00:00.000Z',
      end: '2017-03-04T17:00:00.000Z',
      ref: '2017-09-05T11:05:35.224Z'
  },
    score: 1
};
