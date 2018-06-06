require('dotenv-extended').load();

const chatbase = require('@google/chatbase')
    .setApiKey(process.env.CHATBASE_KEY) // Your Chatbase API Key
    .setAsTypeUser()
    .setVersion('1.0')
    .setPlatform('SAMPLE'); // The platform you are interacting with the user over

exports.chatbase = chatbase;
chatbase.build = function (text, user_id, args, handled) {
    let intent = args;
    if (typeof (intent) !== 'string') {
        intent = args && args.intent && args.intent.intent;
    }

    var msg = chatbase.newMessage();
    msg.setIntent(intent).setUserId(user_id).setMessage(text);

    if (handled === undefined && !intent) {
        msg.setAsNotHandled();
    } else if (handled === true) {
        msg.setAsHandled();
    } else if (handled === false) {
        msg.setAsNotHandled();
    }

    return msg;
}

exports.middleware = {
    // receive: function (event, next) {
    //     chatbase.newMessage()
    //         .setAsTypeUser()
    //         .setMessage(event.text)
    //         .send()
    //         .then(() => {
    //             next();
    //         })
    //         .catch(err => {
    //             console.error(err);
    //             next();
    //         });
    // },
    send: function (event, next) {
        if (event.type === 'message') {
            const msg = chatbase.newMessage()
                .setAsTypeAgent()
                .setUserId(event.address.user.id)
                .setMessage(event.text);
            if (!event.text && event.attachments) {
                msg.setMessage(event.attachmentLayout);
            }
            msg.send()
                .then(() => {
                    next();
                })
                .catch(err => {
                    console.error(err);
                    next();
                });
        } else {
            next();
        }
    }
};