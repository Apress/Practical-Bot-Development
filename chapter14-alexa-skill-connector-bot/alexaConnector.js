const md5 = require('md5');
const restify = require('restify');
const moment = require('moment');
const _ = require('underscore');

const cachedConversations = {};

exports.handler = function (req, res, next) {
    const reqContents = req.body;
    console.log('Incoming message', reqContents);

    const userId = reqContents.session.user.userId;
    const userIdHash = md5(userId); // the length of the user id is too long for the bot framework so we use the md5 hash
    const cachedConv = cachedConversations[userId];
    let p = Promise.resolve(cachedConv);
    if (reqContents.session.new || !cachedConv) {
        p = startConversation(process.env.DL_KEY).then(conv => {
            cachedConversations[userId] = { id: conv.conversationId, watermark: null, lastAccessed: moment().format() };
            console.log('created conversation [%s] for user [%s] hash [%s]', conv.conversationId, userId, userIdHash);
            return cachedConversations[userId];
        });
    }

    p.then(conv => {
        postActivity(process.env.DL_KEY, conv.id, {
            from: { id: userIdHash, name: userIdHash }, // required (from.name is optional)        
            type: 'message',
            text: '',
            sourceEvent: {
                'directline': {
                    alexaMessage: reqContents
                }
            }
        }).then(() => {
            if (reqContents.request.type === 'SessionEndedRequest') {
                buildAndSendSessionEnd(req, res, next);
                return;
            }

            let timeoutAttempts = 0;
            const intervalSleep = 500;
            const timeoutInMs = 10000;
            const maxTimeouts = timeoutInMs / intervalSleep;
            const interval = setInterval(() => {

                getActivities(process.env.DL_KEY, conv.id, conv.watermark).then(activitiesResponse => {
                    const temp = _.filter(activitiesResponse.activities, (m) => m.from.id !== userIdHash);
                    if (temp.length > 0) {
                        clearInterval(interval);
                        const responseActivity = temp[0];
                        console.log('Bot response:', responseActivity);

                        conv.watermark = activitiesResponse.watermark;
                        conv.lastAccessed = moment().format();
                        const keepSessionOpen = responseActivity.channelData && responseActivity.channelData.keepSessionOpen;
                        const reprompt = responseActivity.channelData && responseActivity.channelData.reprompt;
                        buildAndSendSpeech(responseActivity.speak, keepSessionOpen, reprompt, req, res, next);
                    } else {
                        // no-op
                    }
                    timeoutAttempts++;

                    if (timeoutAttempts >= maxTimeouts) {
                        clearInterval(interval);
                        buildTimeoutResponse(req, res, next);
                    }
                });
            }, intervalSleep);
        });
    });
};

function buildTimeoutResponse(req, res, next) {
    res.send(504);
    next();
}

function buildAndSendSpeech(speak, keepSessionOpen, reprompt, req, res, next) {
    let responseJson =
        {
            "version": "1.0",
            "response": {
                "outputSpeech": {
                    "type": "PlainText",
                    "text": speak
                },
                // TODO REPROMPT
                "shouldEndSession": !keepSessionOpen
            }
        };
    if (reprompt) {
        responseJson.reprompt = {
            outputSpeech: {
                type: 'PlainText',
                text: reprompt
            }
        };
    }
    console.log('Final response to Alexa:', responseJson);
    res.send(200, responseJson);
    next();
}

function buildAndSendSessionEnd(req, res, next) {
    let responseJson =
        {
            "version": "1.0"
        };
    res.send(200, responseJson);
    next();
}

const baseUrl = 'https://directline.botframework.com/v3/directline';
const conversationsUrl = baseUrl + '/conversations';

function startConversation(token) {
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: conversationsUrl,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        client.post('', {},
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

function postActivity(token, conversationId, activity) {
    // POST to conversations endpoint
    var url = conversationsUrl + '/' + conversationId + '/activities';
    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        client.post('', activity,
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

function getActivities(token, conversationId, watermark) {
    // GET activities from conversations endpoint
    var url = conversationsUrl + '/' + conversationId + '/activities';
    if (watermark) {
        url = url + '?watermark=' + watermark;
    }

    return new Promise((resolve, reject) => {
        let client = restify.createJsonClient({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        client.get('',
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
