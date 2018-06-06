/* global $ */
(function () {
    const pollInterval = 1000;
    const user = 'user';
    const baseUrl = 'https://directline.botframework.com/v3/directline';
    const conversations = baseUrl + '/conversations';

    function startConversation (token) {
        // POST to conversations endpoint
        return $.ajax({
            url: conversations,
            type: 'POST',
            data: {},
            datatype: 'json',
            headers: {
                'authorization': 'Bearer ' + token
            }
        });
    }

    function postActivity (token, conversationId, activity) {
        // POST to conversations endpoint
        const url = conversations + '/' + conversationId + '/activities';

        return $.ajax({
            url: url,
            type: 'POST',
            data: JSON.stringify(activity),
            contentType: 'application/json; charset=utf-8',
            datatype: 'json',
            headers: {
                'authorization': 'Bearer ' + token
            }
        });
    }

    function getActivities (token, conversationId, watermark) {
        // GET activities from conversations endpoint
        let url = conversations + '/' + conversationId + '/activities';
        if (watermark) {
            url = url + '?watermark=' + watermark;
        }

        return $.ajax({
            url: url,
            type: 'GET',
            data: {},
            datatype: 'json',
            headers: {
                'authorization': 'Bearer ' + token
            }
        });
    }

    function getToken () {
        return $.getJSON('/api/token').then(function (data) {
            // we need to refresh the token every 30 minutes at most.
            // we'll try to do it every 25 minutes to be sure
            window.setInterval(function () {
                console.log('refreshing token');
                refreshToken(data.token);
            }, 1000 * 60 * 25);
            return data.token;
        });
    }

    function refreshToken (token) {
        return $.ajax({
            url: '/api/token/refresh',
            type: 'POST',
            data: token,
            datatype: 'json',
            contentType: 'text/plain'
        });
    }

    function sendMessagesFromInputBox (conversationId, token) {
        $('.chat-text-entry').keypress(function (event) {
            if (event.which === 13) {
                const input = $('.chat-text-entry').val();
                if (input === '') return;

                const newEntry = buildUserEntry(input);
                scrollToBottomOfChat();

                $('.chat-text-entry').val('');

                postActivity(token, conversationId, {
                    textFormat: 'plain',
                    text: input,
                    type: 'message',
                    from: {
                        id: user,
                        name: user
                    }
                }).catch(function (err) {
                    $('.chat-history').remove(newEntry);
                    console.error('Error sending message:', err);
                });
            }
        });
    }

    function buildUserEntry (input) {
        const c = $('<div/>');
        c.addClass('chat-entry-container');
        const entry = $('<div/>');
        entry.addClass('chat-entry');
        entry.addClass('chat-from-user');
        entry.text(input);
        c.append(entry);
        $('.chat-history').append(c);

        const h = entry.height();
        entry.parent().height(h);
        return c;
    }

    function pollMessages (conversationId, token) {
        console.log('Starting polling message for conversationId: ' + conversationId);
        let watermark = null;
        setInterval(function () {
            getActivities(token, conversationId, watermark)
                .then(function (response) {
                    watermark = response.watermark;
                    return response.activities;
                })
                .then(insertMessages);
        }, pollInterval);
    }

    function insertMessages (activities) {
        if (activities && activities.length) {
            activities = activities.filter(function (m) { return m.from.id !== user });
            if (activities.length) {
                activities.forEach(function (a) {
                    buildBotEntry(a);
                });
                scrollToBottomOfChat();
            }
        }
    }

    function buildBotEntry (activity) {
        const c = $('<div/>');
        c.addClass('chat-entry-container');
        const entry = $('<div/>');
        entry.addClass('chat-entry');
        entry.addClass('chat-from-bot');
        entry.text(activity.text);

        if (activity.attachments) {
            activity.attachments.forEach(function (attachment) {
                switch (attachment.contentType) {
                case 'application/vnd.microsoft.card.hero':
                    console.log('hero card rendering not supported');
                    // renderHeroCard(attachment, entry);
                    break;

                case 'image/png':
                case 'image/jpeg':
                    console.log('Opening the requested image ' + attachment.contentUrl);
                    entry.append("<div class='chat-img' style='background-size: cover; background-image: url(" + attachment.contentUrl + ")' />");
                    break;
                }
            });
        }

        c.append(entry);
        $('.chat-history').append(c);

        const h = entry.height();
        entry.parent().height(h);
    }

    function scrollToBottomOfChat () {
        const el = $('.chat-history');
        el.scrollTop(el[0].scrollHeight);
    }

    getToken().then(function (token) {
        startConversation(token)
            .then(function (response) {
                return response.conversationId;
            })
            .then(function (conversationId) {
                sendMessagesFromInputBox(conversationId, token);
                pollMessages(conversationId, token);
            });
    });
})();
