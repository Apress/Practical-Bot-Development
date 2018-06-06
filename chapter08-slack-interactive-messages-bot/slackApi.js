const restify = require('restify');

function postEphemeral(token, channel, user, text, attachments) {
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: 'https://slack.com/api/chat.postEphemeral',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        console.log('posting ephemeral to user [%s] in [%s]', user, channel);
        client.post('',
            {
                channel: channel,
                user: user,
                text: text,
                attachments: attachments
            },
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
}

function deleteChat(token, channel, messageTs) {
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: 'https://slack.com/api/chat.delete',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        console.log('deleting message [%s] in [%s]', messageTs, channel);
        client.post('',
            {
                channel: channel,
                ts: messageTs
            },
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
}


function updateMessage(token, channel, ts, text, attachments) {
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: 'https://slack.com/api/chat.update',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        client.post('',
            {
                channel: channel,
                ts: ts,
                text: text,
                attachments: attachments
            },
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
};

function postMessage(token, channel, text, attachments) {
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: 'https://slack.com/api/chat.postMessage',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        client.post('',
            {
                channel: channel,
                text: text,
                attachments: attachments
            },
            function (err, req, res, obj) {
                if (err) {
                    console.log('%j', err);
                    reject(err);
                    return;
                }
                console.log('%d -> %j', res.statusCode, res.headers);
                console.log('%j', obj);
                resolve(obj);
            });
    });
}

exports.postMessage = postMessage;
exports.postEphemeral = postEphemeral;
exports.updateMessage = updateMessage;
exports.deleteChat = deleteChat;