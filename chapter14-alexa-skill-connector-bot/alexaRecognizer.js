exports.recognizer = {
    recognize: function (context, done) {
        const msg = context.message;

        // we only look at directline messages that include additional data
        if (msg.address.channelId === 'directline' && msg.sourceEvent) {

            const alexaMessage = msg.sourceEvent.directline.alexaMessage;

            // skip if no alexaMessage
            if (alexaMessage) {
                if (alexaMessage.request.type === 'IntentRequest') {
                    // Pass IntentRequest into the dialogs.
                    // The odd thing is that the slots and entities structure is different. If we mix LUIS/Alexa
                    // it would make sense to normalize the format.
                    const alexaIntent = alexaMessage.request.intent;
                    const response = {
                        intent: alexaIntent.name,
                        entities: alexaIntent.slots,
                        score: 1.0
                    };
                    done(null, response);
                    return;
                } else if (alexaMessage.request.type === 'LaunchRequest' || alexaMessage.request.type === 'SessionEndedRequest') {
                    // LaunchRequest and SessionEndedRequest are simply passed through as intents
                    const response = {
                        intent: alexaMessage.request.type,
                        score: 1.0
                    };
                    done(null, response);
                    return;
                }
            }
        }
        done(null, { score: 0 });
    }
};