const builder = require('botbuilder');
const CryptoJS = require('crypto-js'); // used for encrypting state
const moment = require('moment');
const google = require('googleapis');
const calendar = google.calendar('v3');
const OAuth2 = google.auth.OAuth2;

const _ = require('underscore');

const constants = require('../constants');
const utils = require('../utils');

const libName = 'auth';
const lib = new builder.Library(libName);

const googleApiScopes = [
    'https://www.googleapis.com/auth/calendar'
];

lib.dialog(constants.dialogNames.Auth.Login, [(session, args) => {
    session.beginDialog(constants.dialogNames.Auth.EnsureCredentials);
}, (session, args) => {
    if (args.response.authenticated) {
        session.send('You are now logged in!');
    } else {
        session.endDialog('Failed with error: ' + args.response.error)
    }
}]).triggerAction({
    matches: /^login$/i
});

lib.dialog(constants.dialogNames.Auth.Logout, [(session, args) => {
    if (!session.privateConversationData.tokens) {
        session.endDialog('You are already logged out!');
    } else {
        const client = getAuthClientFromSession(session);
        client.revokeCredentials();
        delete session.privateConversationData['tokens'];
        session.endDialog('You are now logged out!');
    }
}]).triggerAction({
    matches: /^logout$/i
});

lib.dialog(constants.dialogNames.Auth.EnsureCredentials, [(session, args) => {
    if (session.privateConversationData.tokens) {
        // if we have the tokens... we're good. if we have the tokens for too long and the tokens expired
        // we'd need to somehow handle it here.
        session.endDialogWithResult({ response: { authenticated: true } });
        return;
    }

    const oauth2Client = getAuthClient();
    const state = {
        address: session.message.address
    };
    const encryptedState = CryptoJS.AES.encrypt(JSON.stringify(state), process.env.AES_PASSPHRASE).toString();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: googleApiScopes,
        state: encryptedState
    });

    const card = new builder.SigninCard(session).button('Login to Google', authUrl).text('Need to get your credentials. Please login here.');
    // var card = new builder.HeroCard(session)
    //     .title('Login to Google')
    //     .text("Need to get your credentials. Please login here.")
    //     .buttons([
    //         builder.CardAction.(session, authUrl, 'Login')
    //     ]);
    console.log(authUrl);

    const loginReply = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments([card]);

    session.send(loginReply);
}, (session, args) => {
    session.endDialogWithResult({ response: { authenticated: true } });
}]);

lib.dialog(constants.dialogNames.Auth.Error, (session, args) => {
    session.endDialogWithResult({ response: { authenticated: false, error: args.error } });
});

lib.dialog(constants.dialogNames.Auth.StoreTokensAndResume, [(session, args, next) => {
    session.privateConversationData.tokens = args.tokens;

    console.log(args);
    if (args.followUpDialog) {
        session.beginDialog(args.followUpDialog, args.followUpDialogArgs);
    } else {
        next();
    }
}, (session, args) => {
    session.endDialogWithResult({ response: { authenticated: true } });
}]);

lib.dialog(constants.dialogNames.Auth.AuthConfirmation, [
    (session, args) => {
        session.beginDialog(args.dialogName, args);
    },
    (session, args) => {
        if (args.response.authenticated) {
            session.endDialog('You are now logged in.')
        } else {
            session.endDialog('Error occured while logging in. ' + args.response.error);
        }
    }
]);

function isInEnsure(session) {
    return _.find(session.dialogStack(), function (p) { return p.id.indexOf(constants.dialogNames.Auth.EnsureCredentials) >= 0; }) != null;
}

const beginErrorDialog = (session, args) => {
    if (isInEnsure(session)) {
        session.replaceDialog(libName + ':' + constants.dialogNames.Auth.Error, args);
    } else {
        args.dialogName = constants.dialogNames.Auth.Error;
        session.beginDialog(libName + ':' + constants.dialogNames.Auth.AuthConfirmation, args);
    }
};

const beginStoreTokensAndResume = (session, args) => {
    if (isInEnsure(session)) {
        session.beginDialog(libName + ':' + constants.dialogNames.Auth.StoreTokensAndResume, args);
    } else {
        args.dialogName = constants.dialogNames.Auth.StoreTokensAndResume;
        session.beginDialog(libName + ':' + constants.dialogNames.Auth.AuthConfirmation, args);
    }
};

const ensureLoggedIn = (session) => {
    session.beginDialog(libName + ':' + constants.dialogNames.Auth.EnsureCredentials);
};

function getAuthClientFromSession(session) {
    const auth = getAuthClient(session.privateConversationData.tokens);
    return auth;
};

function getAuthClient(tokens) {
    const auth = new OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    if (tokens) {
        auth.setCredentials(tokens);
    }
    return auth;
}

let postLoginDialog = null;
exports.setResolvePostLoginDialog = f => {
    postLoginDialog = f;
};

exports.getAuthClientFromSession = getAuthClientFromSession;
exports.create = () => { return lib.clone(); }
exports.ensureLoggedIn = ensureLoggedIn;

exports.oAuth2Callback = (bot, req, res, next) => {
    const code = req.query.code;
    const encryptedState = req.query.state;
    const oauthError = req.query.error;
    const state = JSON.parse(CryptoJS.AES.decrypt(encryptedState, process.env.AES_PASSPHRASE).toString(CryptoJS.enc.Utf8));
    const oauth2Client = getAuthClient();
    res.contentType = 'json';

    bot.loadSession(state.address, (sessionLoadError, session) => {
        if (sessionLoadError) {
            console.log('SessionLoadError:' + sessionLoadError);
            beginErrorDialog(session, { error: 'unable to load session' });
            res.send(401, {
                status: 'Unauthorized'
            });
        } else if (oauthError) {
            console.log('OAuthError:' + oauthError);
            beginErrorDialog(session, { error: 'Access Denied' });
            res.send(401, {
                status: 'Unauthorized'
            });
        } else {
            oauth2Client.getToken(code, (error, tokens) => {
                if (!error) {
                    oauth2Client.setCredentials(tokens);

                    let args = {
                        tokens: tokens
                    };

                    if (postLoginDialog) {
                        args = postLoginDialog(session, args);
                    }
                    beginStoreTokensAndResume(session, args);
                    res.send(200, {
                        status: 'success'
                    });
                } else {
                    beginErrorDialog(session, {
                        error: error
                    });
                    res.send(500, {
                        status: 'error'
                    });
                }
            });
        }
        next();
    });
};
