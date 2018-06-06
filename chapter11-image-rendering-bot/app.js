require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');
const request = require('request');
const moment = require('moment');
const _ = require('underscore');
const puppeteer = require('puppeteer');
const vsprintf = require('sprintf').vsprintf;
const util = require('util');
const fs = require('fs');
const uuid = require('uuid');
const azureStorage = require('azure-storage');

const datapoints = {
    last_price: 'last_price',
    last_year_low: '52_week_low',
    last_year_high: '52_week_high',
    ask_price: 'ask_price',
    ask_size: 'ask_size',
    bid_price: 'bid_price',
    bid_size: 'bid_size',
    volume: 'volume',
    name: 'name',
    change: 'change',
    percent_change: 'percent_change',
    last_timestamp: 'last_timestamp',
    open_price: 'open_price',
    high_price: 'high_price',
    low_price: 'low_price'
};

const url = "https://api.intrinio.com/data_point?ticker=%s&item=" + _.map(Object.keys(datapoints), p => datapoints[p]).join(',');
const pricesUrl = "https://api.intrinio.com/prices?identifier=%s&page_size=30";

const blob = azureStorage.createBlobService(process.env.IMAGE_STORAGE_CONNECTION_STRING);

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});
server.get(/\/?.*/, restify.plugins.serveStatic({
    directory: './public'
}))

// Create chat bot and listen to messages
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, [
    session => {
        const ticker = session.message.text.toUpperCase();
        const tickerUrl = vsprintf(url, [ticker]);
        const pricesTickerUrl = vsprintf(pricesUrl, [ticker]);

        const opts = {
            auth: {
                user: process.env.INTRINIO_USER,
                pass: process.env.INTRINIO_PASS
            }
        };

        request.get(tickerUrl, opts, (quote_error, quote_response, quote_body) => {
            request.get(pricesTickerUrl, opts, (prices_error, prices_response, prices_body) => {
                if (quote_error) {
                    console.log('error while fetching data:\n' + quote_error);
                    session.endConversation('Error while fetching data. Please try again later.');
                    return;
                } else if (prices_error) {
                    console.log('error while fetching data:\n' + prices_error);
                    session.endConversation('Error while fetching data. Please try again later.');
                    return;
                }

                const quoteResults = JSON.parse(quote_body).data;
                const priceResults = JSON.parse(prices_body).data;

                const prices = _.map(priceResults, p => p.close);
                const sparklinedata = prices.join(',');

                fs.readFile("cardTemplate.html", "utf8", function (err, data) {
                    const last_price = getval(quoteResults, ticker, datapoints.last_price).value;
                    const change = getval(quoteResults, ticker, datapoints.change).value;
                    const percent_change = getval(quoteResults, ticker, datapoints.percent_change).value;
                    const name = getval(quoteResults, ticker, datapoints.name).value;
                    const last_timestamp = getval(quoteResults, ticker, datapoints.last_timestamp).value;
                    const yearhigh = getval(quoteResults, ticker, datapoints.last_year_high).value;
                    const yearlow = getval(quoteResults, ticker, datapoints.last_year_low).value;

                    const bidsize = getval(quoteResults, ticker, datapoints.bid_size).value;
                    const bidprice = getval(quoteResults, ticker, datapoints.bid_price).value;
                    const asksize = getval(quoteResults, ticker, datapoints.ask_size).value;
                    const askprice = getval(quoteResults, ticker, datapoints.ask_price).value;

                    data = data.replace('${bid}', vsprintf('%d x %.2f', [bidsize, bidprice]));
                    data = data.replace('${ask}', vsprintf('%d x %.2f', [asksize, askprice]));
                    data = data.replace('${52weekhigh}', vsprintf('%.2f', [yearhigh]));
                    data = data.replace('${52weeklow}', vsprintf('%.2f', [yearlow]));
                    data = data.replace('${ticker}', ticker);
                    data = data.replace('${companyName}', name);
                    data = data.replace('${last_price}', last_price);

                    let changeClass = '';
                    if (change > 0) changeClass = 'positive';
                    else if (change < 0) changeClass = 'negative';

                    data = data.replace('${changeClass}', changeClass);
                    data = data.replace('${change}', vsprintf('%.2f%%', [change]));
                    data = data.replace('${percent_change}', vsprintf('%.2f%%', [percent_change]));
                    data = data.replace('${last_timestamp}', moment(last_timestamp).format('LLL'));
                    data = data.replace('${sparklinedata}', sparklinedata);

                    renderHtml(data, 584, 304).then(cardData => {
                        const uniqueId = uuid();

                        const name = uniqueId + '.png';
                        const pathToFile = 'images/'+name;
                        fs.writeFileSync(pathToFile, cardData);

                        const containerName = 'image-rendering-bot';
                        blob.createContainerIfNotExists(containerName, {
                            publicAccessLevel: 'blob'
                        }, function (error, result, response) {
                            if (!error) {
                                blob.createBlockBlobFromLocalFile(containerName, name, pathToFile, function (error, result, response) {
                                    if (!error) {
                                        fs.unlinkSync(pathToFile);
                                        const imageUri = blob.getUrl(containerName, name);

                                        const card = new builder.HeroCard(session)
                                            .buttons([
                                                builder.CardAction.postBack(session, ticker, 'Quote Again')])
                                            .images([
                                                builder.CardImage.create(session, imageUri)
                                            ])
                                            .title(ticker + ' Quote')
                                            .subtitle('Last Updated: ' + moment(last_timestamp).format('LLL'));

                                        const msg = new builder.Message(session);
                                        msg.addAttachment(card.toAttachment());
                                        session.send(msg);
                                    } else {
                                        console.error(error);
                                    }
                                });
                            } else {
                                console.error(error);
                            }
                        });
                    });
                });
            });
        });
    }
]);

const getval = function (arr, ticker, data_point) {
    const r = _.find(arr, p => p.identifier === ticker && p.item === data_point);
    return r;
}

const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);


async function renderHtml(html, width, height) {
    var browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: width, height: height });
    await page.goto(`data:text/html,${html}`, { waitUntil: 'load' });
    const pageResultBuffer = await page.screenshot({ omitBackground: true });
    await page.close();
    browser.disconnect();
    return pageResultBuffer;
}

// unused Adaptive Card
function renderStockCard(data, ticker) {
    const last_price = getval(data, ticker, datapoints.last_price).value;
    const change = getval(data, ticker, datapoints.change).value;
    const percent_change = getval(data, ticker, datapoints.percent_change).value;
    const name = getval(data, ticker, datapoints.name).value;
    const last_timestamp = getval(data, ticker, datapoints.last_timestamp).value;

    const open_price = getval(data, ticker, datapoints.open_price).value;
    const low_price = getval(data, ticker, datapoints.low_price).value;
    const high_price = getval(data, ticker, datapoints.high_price).value;
    const yearhigh = getval(data, ticker, datapoints.last_year_high).value;
    const yearlow = getval(data, ticker, datapoints.last_year_low).value;


    const bidsize = getval(data, ticker, datapoints.bid_size).value;
    const bidprice = getval(data, ticker, datapoints.bid_price).value;
    const asksize = getval(data, ticker, datapoints.ask_size).value;
    const askprice = getval(data, ticker, datapoints.ask_price).value;

    let color = 'default';
    if (change > 0) color = 'good';
    else if (change < 0) color = 'warning';

    let facts = [
        { title: 'Bid', value: vsprintf('%d x %.2f', [bidsize, bidprice]) },
        { title: 'Ask', value: vsprintf('%d x %.2f', [asksize, askprice]) },
        { title: '52-Week High', value: vsprintf('%.2f', [yearhigh]) },
        { title: '52-Week Low', value: vsprintf('%.2f', [yearlow]) }
    ];

    let card = {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "speak": vsprintf("%s stock is trading at $%.2f a share, which is down %.2f%%", [name, last_price, percent_change]),
        "body": [
            {
                "type": "Container",
                "items": [
                    {
                        "type": "TextBlock",
                        "text": vsprintf("%s ( %s)", [name, ticker]),
                        "size": "medium",
                        "isSubtle": false
                    },
                    {
                        "type": "TextBlock",
                        "text": moment(last_timestamp).format('LLL'),
                        "isSubtle": true
                    }
                ]
            },
            {
                "type": "Container",
                "spacing": "none",
                "items": [
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": vsprintf("%.2f", [last_price]),
                                        "size": "extraLarge"
                                    },
                                    {
                                        "type": "TextBlock",
                                        "text": vsprintf("%.2f (%.2f%%)", [change, percent_change]),
                                        "size": "small",
                                        "color": color,
                                        "spacing": "none"
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "FactSet",
                                        "facts": facts
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }

    return card;
}