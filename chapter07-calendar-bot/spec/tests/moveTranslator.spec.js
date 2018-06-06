/* global beforeEach, describe, it, expect */
const mt = require('../../moveTranslator');
const moment = require('moment');
const constants = require('../../constants');

describe('Operations', function () {
    beforeEach(function () {
    });

    describe('Move Translator', function () {
        const moveToTestEntity = { type: constants.entityNames.MeetingMove.ToTime, startIndex: 10 };
        const moveFromTestEntity = { type: constants.entityNames.MeetingMove.FromTime, startIndex: 0 };
        const dateRange = {
            'entity': 'from 2/4 to 3/4',
            'type': 'builtin.datetimeV2.daterange',
            'startIndex': 0,
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
        const timeRange = {
            'entity': 'from 1pm to 5pm',
            'type': 'builtin.datetimeV2.timerange',
            'startIndex': 0,
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
        const dateTimeRange = {
            'entity': 'from 2/4 1pm to 2/15 6pm',
            'type': 'builtin.datetimeV2.datetimerange',
            'startIndex': 0,
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
        const datetimefrom = {
            type: constants.entityNames.Dates.DateTime,
            startIndex: moveFromTestEntity.startIndex,
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
        const datetimeto = {
            type: constants.entityNames.Dates.DateTime,
            startIndex: moveToTestEntity.startIndex,
            'resolution': {
                'values': [
                    {
                        'timex': '2017-09-05T13',
                        'type': 'datetime',
                        'value': '2017-09-06 18:00:00'
                    }
                ]
            }
        };

        const datefrom = {
            'entity': 'tomorrow',
            'type': 'builtin.datetimeV2.date',
            startIndex: moveFromTestEntity.startIndex,
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

        const dateto = {
            'entity': 'tomorrow',
            'type': 'builtin.datetimeV2.date',
            startIndex: moveToTestEntity.startIndex,
            'endIndex': 33,
            'resolution': {
                'values': [
                    {
                        'timex': '2017-09-06',
                        'type': 'date',
                        'value': '2017-09-06'
                    }
                ]
            }
        };
        const timefrom = {
            'type': 'builtin.datetimeV2.time',
            startIndex: moveFromTestEntity.startIndex,
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
        const timeto = {
            'type': 'builtin.datetimeV2.time',
            startIndex: moveToTestEntity.startIndex,
            'resolution': {
                'values': [
                    {
                        'timex': 'T13',
                        'type': 'time',
                        'value': '17:00:00'
                    }
                ]
            }
        };

        it('fails on null inputs', function () {
            const translator = new mt.MoveTranslator();
            expect(translator.applyEntities.bind(null, null, null, null)).toThrow();
        });

        it('fails on good move to and null entities', function () {
            const translator = new mt.MoveTranslator();
            expect(translator.applyEntities.bind(null, moveToTestEntity, null, null)).toThrow();
        });

        it('produces useless object on good move to and empty entities', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, []);
            expect(translator.moveFrom).toBeUndefined();
            expect(translator.moveTo).toBeUndefined();
        });

        it('parses time range properly', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [timeRange], moveFromTestEntity);
            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();
            expect(translator.moveFrom.format()).toBe(moment(timeRange.resolution.values[0].start, constants.LUISTimePattern).format());
            expect(translator.moveTo.format()).toBe(moment(timeRange.resolution.values[0].end, constants.LUISTimePattern).format());
        });

        it('parses datetime range properly', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [dateTimeRange], moveFromTestEntity);
            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();
            expect(translator.moveFrom.format()).toBe(moment(dateTimeRange.resolution.values[1].start).format());
            expect(translator.moveTo.format()).toBe(moment(dateTimeRange.resolution.values[1].end).format());
        });

        it('parses date range properly', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [dateRange], moveFromTestEntity);
            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeTruthy();
            expect(translator.moveFrom.format()).toBe(moment(dateRange.resolution.values[1].start).format());
            expect(translator.moveTo.format()).toBe(moment(dateRange.resolution.values[1].end).format());
        });

        it('ignores extra ranges', function () {
            let translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [dateRange, dateTimeRange, timeRange], moveFromTestEntity);
            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeTruthy();
            expect(translator.moveFrom.format()).toBe(moment(dateRange.resolution.values[1].start).format());
            expect(translator.moveTo.format()).toBe(moment(dateRange.resolution.values[1].end).format());

            translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [dateTimeRange, dateRange, timeRange], moveFromTestEntity);
            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();
            expect(translator.moveFrom.format()).toBe(moment(dateTimeRange.resolution.values[1].start).format());
            expect(translator.moveTo.format()).toBe(moment(dateTimeRange.resolution.values[1].end).format());
        });

        it('fails if range provided by not moveFrom', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [dateRange, dateTimeRange, timeRange]);

            expect(translator.moveFrom).toBeUndefined();
            expect(translator.moveTo).toBeUndefined();
        });

        it('finds datetime entities', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [datetimefrom, datetimeto], moveFromTestEntity);

            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();
            expect(translator.moveFrom.format()).toBe(moment(datetimefrom.resolution.values[0].value).format());
            expect(translator.moveTo.format()).toBe(moment(datetimeto.resolution.values[0].value).format());
        });

        it('finds time entities', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [timefrom, timeto], moveFromTestEntity);

            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();
            expect(translator.moveFrom.format()).toBe(moment(timefrom.resolution.values[0].value, constants.LUISTimePattern).format());
            expect(translator.moveTo.format()).toBe(moment(timeto.resolution.values[0].value, constants.LUISTimePattern).format());
        });

        it('finds date entities', function () {
            const translator = new mt.MoveTranslator();
            translator.applyEntities(moveToTestEntity, [datefrom, dateto], moveFromTestEntity);

            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeTruthy();
            expect(translator.moveFrom.format()).toBe(moment(datefrom.resolution.values[0].value).format());
            expect(translator.moveTo.format()).toBe(moment(dateto.resolution.values[0].value).format());
        });

        it('finds range when move from inside range bounds', function () {
            const entities = [
                {
                    'entity': '2pm',
                    'type': 'MeetingMove::FromTime',
                    'startIndex': 26,
                    'endIndex': 28,
                    'score': 0.837196648
                },
                {
                    'entity': '6pm',
                    'type': 'MeetingMove::ToTime',
                    'startIndex': 33,
                    'endIndex': 35,
                    'score': 0.840155244
                },
                {
                    'entity': 'from 2pm to 6pm',
                    'type': 'builtin.datetimeV2.timerange',
                    'startIndex': 21,
                    'endIndex': 35,
                    'resolution': {
                        'values': [
                            {
                                'timex': '(T14,T18,PT4H)',
                                'type': 'timerange',
                                'start': '14:00:00',
                                'end': '18:00:00'
                            }
                        ]
                    }
                }
            ];

            const translator = new mt.MoveTranslator();
            translator.applyEntities(entities[1], [entities[2]], entities[0]);
            expect(translator.moveFrom).not.toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();

            const tr = entities[2];
            expect(translator.moveFrom.format()).toBe(moment(tr.resolution.values[0].start, constants.LUISTimePattern).format());
            expect(translator.moveTo.format()).toBe(moment(tr.resolution.values[0].end, constants.LUISTimePattern).format());
        });

        it('correctly interprets time and invitee', function () {
            const entities = [{
                'entity': 'bob',
                'type': 'CalendarBot.Invitee',
                'startIndex': 18,
                'endIndex': 20,
                'score': 0.658078551
            }, {
                'entity': '5pm',
                'type': 'MeetingMove::ToTime',
                'startIndex': 25,
                'endIndex': 27,
                'score': 0.867760837
            },
            {
                'entity': '5pm',
                'type': 'builtin.datetimeV2.time',
                'startIndex': 25,
                'endIndex': 27,
                'resolution': {
                    'values': [
                        {
                            'timex': 'T17',
                            'type': 'time',
                            'value': '17:00:00'
                        }
                    ]
                }
            }];

            const translator = new mt.MoveTranslator();
            translator.applyEntities(entities[1], [entities[0], entities[2]], null);

            expect(translator.moveFrom).toBeUndefined();
            expect(translator.moveTo).not.toBeUndefined();
            expect(translator.isDateBased).toBeFalsy();
            expect(translator.moveTo.format()).toBe(moment(timeto.resolution.values[0].value, constants.LUISTimePattern).format());
        });

        it('case which should not occur in LUIS', function () {
            const entities = [
                {
                    'entity': '7pm',
                    'type': 'MeetingMove::ToTime',
                    'startIndex': 25,
                    'endIndex': 27,
                    'score': 0.8258522
                },
                {
                    'entity': 'from 5pm to 7pm',
                    'type': 'builtin.datetimeV2.timerange',
                    'startIndex': 13,
                    'endIndex': 27,
                    'resolution': {
                        'values': [
                            {
                                'timex': '(T17,T19,PT2H)',
                                'type': 'timerange',
                                'start': '17:00:00',
                                'end': '19:00:00'
                            }
                        ]
                    }
                }
            ];

            const translator = new mt.MoveTranslator();
            translator.applyEntities(entities[0], [entities[1]], null);

            expect(translator.moveFrom).toBeUndefined();
            expect(translator.moveTo).toBeUndefined();
        });
    });
});
