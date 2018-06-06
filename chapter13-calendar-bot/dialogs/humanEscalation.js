const builder = require('botbuilder');
const constants = require('../constants');
const request = require('request');
const chatbase = require('../chatbase').chatbase;

const libName = 'humanEscalation';
const escalateDialogName = 'escalate';

const lib = new builder.Library(libName);

let pageAccessToken = null;
exports.pageAccessToken = (val) => {
    if(val) pageAccessToken = val;
    return pageAccessToken;
};

exports.escalateToHuman = (session, pageAccessTokenArg, userId) => {
    session.beginDialog(libName + ':' + escalateDialogName, { pageAccessToken: pageAccessTokenArg || pageAccessToken });
};

lib.dialog(escalateDialogName, (session, args, next) => {
    chatbase.build(session.message.text, session.message.address.user.id, args, true).send();
    handover(session.message.address.user.id, args.pageAccessToken || pageAccessToken);
    session.endDialog('Just hold tight... getting someone for you...');
}).triggerAction({
    matches: constants.intentNames.HumanHandover
});

exports.create = () => { return lib.clone(); }

function makeFacebookGraphRequest(d, psid, metadata, procedure, pageAccessToken) {
    const data = Object.assign({}, d);
    data.recipient = { 'id': psid };
    data.metadata = metadata;

    const options = {
        uri: "https://graph.facebook.com/v2.6/me/" + procedure + "?access_token=" + pageAccessToken,
        json: data,
        method: 'POST'
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
                return;
            }
            console.log(body);
            resolve();
        });
    });
}

const secondaryApp = 263902037430900; // this is the ID to utilize when handing over to a page
function handover(psid, pageAccessToken) {
    return makeFacebookGraphRequest({ 'target_app_id': secondaryApp }, psid, 'test', 'pass_thread_control', pageAccessToken);
}

function takeControl(psid, pageAccessToken) {
    return makeFacebookGraphRequest({}, psid, 'test', 'take_thread_control', pageAccessToken);
}