const _ = require('underscore');
const cognitiveServices = require('cognitive-services');
const translator = require('mstranslator');

const textAnalytics = new cognitiveServices.textAnalytics({
    apiKey: process.env.TA_KEY,
    endpoint: process.env.TA_ENDPOINT
});
const translatorApi = new translator({ api_key: process.env.TRANSLATOR_KEY }, true);
const userLanguageMap = {};

class TranslatorMiddleware {
    receive(event, next) {
        if (event.type !== 'message') { next(); return; }

        if (event.text == null || event.text.length == 0) {
            // if there is not input and we already have a language, leave as is, otherwise set to English
            userLanguageMap[event.user.id] = userLanguageMap[event.user.id] || 'en';
            next();
            return;
        }

        textAnalytics.detectLanguage({
            body: {
                documents: [
                    {
                        id: "1",
                        text: event.text
                    }
                ]
            }
        }).then(result => {
            const languageOptions = _.find(result.documents, p => p.id === "1").detectedLanguages;
            let lang = 'en';

            if (languageOptions && languageOptions.length > 0) {
                lang = languageOptions[0].iso6391Name;
            }
            userLanguageMap[event.user.id] = lang;

            if (lang === 'en') next();
            else {
                translatorApi.translate({
                    text: event.text,
                    from: languageOptions[0].iso6391Name,
                    to: 'en'
                }, (err, result) => {
                    if (err) {
                        console.error(err);
                        lang = 'en';
                        userLanguageMap[event.user.id] = lang;
                        next();
                    }
                    else {
                        event.text = result;
                        next();
                    }
                });
            }
        });
    }
    send(event, next) {
        if (event.type === 'message') {
            const userLang = userLanguageMap[event.address.user.id] || 'en';

            if (userLang === 'en') { next(); }
            else {
                translatorApi.translate({
                    text: event.text,
                    from: 'en',
                    to: userLang
                }, (err, result) => {
                    if (err) {
                        console.error(err);
                        next();
                    }
                    else {
                        event.text = result;
                        next();
                    }
                });
            }
        }
        else {
            next();
        }
    }
}

exports.TranslatorMiddleware = TranslatorMiddleware;