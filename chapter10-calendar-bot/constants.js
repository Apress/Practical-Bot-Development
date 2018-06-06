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
    CheckAvailability: 'checkAvailability',
    Login: 'login',
    PrimaryCalendar: 'primaryCalendar',
    EnsurePrimaryCalendar: 'ensurePrimaryCalendar',
    PreCheck_AuthAndPrimaryCalendar: 'preCheck_authAndPrimaryCalendar',
    Auth: {
        Login: 'auth.login',
        Logout: 'auth.logout',
        EnsureCredentials: 'auth.ensureCredentials',
        AuthConfirmation: 'auth.authConfirmation',
        StoreTokensAndResume: 'auth.storeAndResume',
        Error: 'auth.error'
    }
};

exports.intentNames = {
    Help: 'Help',
    AddCalendarEntry: 'AddCalendarEntry',
    RemoveCalendarEntry: 'DeleteCalendarEntry',
    CheckAvailability: 'CheckAvailability',
    EditCalendarEntry: 'EditCalendarEntry',
    ShowCalendarSummary: 'ShowCalendarSummary',
    PrimaryCalendar: 'PrimaryCalendar',
    None: 'None'
};

exports.entityNames = {
    Chrono: 'chrono.duration',
    Invitee: 'CalendarBot.Invitee',
    Action: 'Action',
    CalendarId: 'CalendarId',
    EventId: 'EventId',
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

exports.entityValues = {
    Action: {
        get: 'get',
        set: 'set',
        clear: 'remove'
    }
};

exports.LUISTimePattern = 'HH:mm:ss';
