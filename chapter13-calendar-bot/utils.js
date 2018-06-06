const moment = require('moment');
const builder = require('botbuilder');

function wrapEntity (entityType, value) {
    return {
        type: entityType,
        entity: value,
        resolution: {
            values: [
                value
            ]
        }
    };
};

function createCalendarCard (session, calendar) {
    const isPrimary = session.privateConversationData.calendarId === calendar.id;

    let subtitle = 'Your role: ' + calendar.accessRole;
    if (isPrimary) {
        subtitle = 'Primary\r\n' + subtitle;
    }
    let buttons = [];
    if (!isPrimary) {
        let btnval = 'Set primary calendar to ' + calendar.id;
        buttons = [builder.CardAction.postBack(session, btnval, 'Set as primary')];
    }

    const heroCard = new builder.HeroCard(session)
        .title(calendar.summary)
        .subtitle(subtitle)
        .buttons(buttons);
    return heroCard;
};

function createEventCard (session, event) {
    let start, end, subtitle;
    if (!event.start.date) {
        start = moment(event.start.dateTime);
        end = moment(event.end.dateTime);

        const diffInMinutes = end.diff(start, 'm');
        const diffInHours = end.diff(start, 'h');

        let duration = diffInMinutes + ' minutes';
        if (diffInHours >= 1) {
            const hrs = Math.floor(diffInHours);
            const mins = diffInMinutes - (hrs * 60);

            if (mins === 0) {
                duration = hrs + 'hrs';
            } else {
                duration = hrs + (hrs > 1 ? 'hrs ' : 'hr ') + (mins < 10 ? ('0' + mins) : mins) + 'mins';
            }
        }
        subtitle = 'At ' + start.format('L LT') + ' for ' + duration;
    } else {
        start = moment(event.start.date);
        end = moment(event.end.date);

        const diffInDays = end.diff(start, 'd');
        subtitle = 'All Day ' + start.format('L') + (diffInDays > 1 ? end.format('L') : '');
    }

    const heroCard = new builder.HeroCard(session)
        .title(event.summary)
        .subtitle(subtitle)
        .buttons([
            builder.CardAction.openUrl(session, event.htmlLink, 'Open Google Calendar'),
            builder.CardAction.postBack(session, 'Delete event with id ' + event.id, 'Delete')
        ]);
    return heroCard;
};

exports.createEventCard = createEventCard;
exports.wrapEntity = wrapEntity;
exports.createCalendarCard = createCalendarCard;
