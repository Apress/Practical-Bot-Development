# Image Rendering Bot

Practical Bot Development - Chapter 11

This bot demostrates the process of rendering a HTML template using headless Chrome using puppeteer. The bot stores rendered images in Azure blob storage.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine. You will need to make sure you create a .env file which has your Bot Id and Bot Password. You will also need a trial account with Intrinio to fetch financial data. Lastly, to store images in Azure Blob Storage, you will need an Azure Storage connection string.

### Installing and Running

Easy. Peasy.

```
npm install
npm start
```

By default, the bot will run on port 3978. 

* Connect your emulator to http://localhost:3978/api/messages
* Enter symbol names such as AAPL, MSFT or FB to get a quote and rendered image