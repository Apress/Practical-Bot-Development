const google = require('googleapis');
const calendar = google.calendar('v3');

function listEvents (auth, calendarId, start, end, subject) {
    const p = new Promise(function (resolve, reject) {
        calendar.events.list({
            auth: auth,
            calendarId: calendarId,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            q: subject
        }, function (err, response) {
            if (err) reject(err);
            resolve(response.items);
        });
    });
    return p;
}

function listCalendars (auth) {
    const p = new Promise(function (resolve, reject) {
        calendar.calendarList.list({
            auth: auth
        }, function (err, response) {
            if (err) reject(err);
            else resolve(response.items);
        });
    });
    return p;
};

function getCalendar (auth, calendarId) {
    const p = new Promise(function (resolve, reject) {
        calendar.calendarList.get({
            auth: auth,
            calendarId: calendarId
        }, function (err, response) {
            if (err) reject(err);
            else resolve(response);
        });
    });
    return p;
};

function freeBusy (auth, calendarId, start, end) {
    const p = new Promise(function (resolve, reject) {
        const param = {
            auth: auth,
            resource: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                items: [ { id: calendarId } ]
            }
        };

        calendar.freebusy.query(param, function (err, response) {
            if (err) reject(err);
            else resolve(response);
        });
    });
    return p;
}

function insertEvent (auth, calendarId, start, end, summary, location) {
    const p = new Promise(function (resolve, reject) {
        calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: {
                end: {
                    dateTime: end.toISOString()
                },
                start: {
                    dateTime: start.toISOString()
                },
                summary: summary
            }
        }, function (err, response) {
            if (err) reject(err);
            else resolve(response);
        });
    });
    return p;
}

const allDayDateFormat = 'YYYY-MM-DD';

function insertAllDayEvent (auth, calendarId, start, end, summary, location) {
    const p = new Promise(function (resolve, reject) {
        calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: {
                end: {
                    date: end.format(allDayDateFormat)
                },
                start: {
                    date: start.format(allDayDateFormat)
                },
                summary: summary
            }
        }, function (err, response) {
            if (err) reject(err);
            else resolve(response);
        });
    });
    return p;
}

function removeEvent (auth, calendarId, eventId) {
    const p = new Promise(function (resolve, reject) {
        calendar.events.delete({
            auth: auth,
            calendarId: calendarId,
            eventId: eventId
        }, function (err, response) {
            if (err) reject(err);
            else resolve(response);
        });
    });
    return p;
}

function getEvent (auth, calendarId, eventId) {
    const p = new Promise(function (resolve, reject) {
        calendar.events.get({
            auth: auth,
            calendarId: calendarId,
            eventId: eventId
        }, function (err, response) {
            if (err) reject(err);
            else resolve(response);
        });
    });
    return p;
}

exports.removeEvent = removeEvent;
exports.insertAllDayEvent = insertAllDayEvent;
exports.listEvents = listEvents;
exports.insertEvent = insertEvent;
exports.getEvent = getEvent;
exports.listCalendars = listCalendars;
exports.getCalendar = getCalendar;
exports.freeBusy = freeBusy;
