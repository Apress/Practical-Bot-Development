exports.dialogNames = {
    Help: 'help',
    AddCalendarEntry: 'addCalendarEntry',
    AddCalendarEntryHelp: 'addCalendarEntryHelp',
    RemoveCalendarEntryHelp: 'removeCalendarEntryHelp',
    RemoveCalendarEntry: 'removeCalendarEntry',
    RemoveCalendarEntry_Time: 'removeCalendarEntry.time',
    RemoveCalendarEntry_Invitee: 'removeCalendarEntry.invitee',
    EditCalendarEntry: 'editCalendarEntry',
    ShowCalendarSummary: 'showCalendarSummary',
    CheckAvailability: 'checkAvailability'
};

exports.intentNames = {
    Help: 'Help',
    AddCalendarEntry: 'AddCalendarEntry',
    RemoveCalendarEntry: 'DeleteCalendarEntry',
    CheckAvailability: 'CheckAvailability',
    EditCalendarEntry: 'EditCalendarEntry',
    ShowCalendarSummary: 'ShowCalendarSummary',
    None: 'None'
};

exports.entityNames = {
    Chrono: 'chrono.duration',
    Invitee: 'CalendarBot.Invitee',
    Subject: 'CalendarBot.Subject',
    Location: 'CalendarBot.Location',
    Composite: {
        CalendarRequest: 'CalendarRequest'
    },
    MeetingMove: {
        FromTime: 'MeetingMove::FromTime',
        ToTime: 'MeetingMove::ToTime'
    },
    EntryVisibility: {
        Public: 'EntryVisbility::Public',
        Private: 'EntryVisbility::Private'
    },
    Dates: {
        Date: 'builtin.datetimeV2.date',
        DateTime: 'builtin.datetimeV2.datetime',
        Time: 'builtin.datetimeV2.time',
        DateRange: 'builtin.datetimeV2.daterange',
        TimeRange: 'builtin.datetimeV2.timerange',
        DateTimeRange: 'builtin.datetimeV2.datetimerange',
        Set: 'builtin.datetimeV2.set',
        Duration: 'builtin.datetimeV2.duration'
    },
    Email: 'builtin.email'
};

exports.LUISTimePattern = 'HH:mm:ss';
