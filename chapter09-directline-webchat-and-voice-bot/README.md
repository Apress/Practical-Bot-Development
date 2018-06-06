# Directline Web Chat and Twilio Voice Bot

Practical Bot Development - Chapter 9

This bot is a demostration of talking to an existing Azure Bot Service bot using the Directline API. It consists of three components:

1. The bot
1. A custom web chat implementation
1. A voice bot implementation using Twilio

## Getting Started

These instructions will get you a copy of the project up and running on your local machine. You will need to make sure you create a .env file which has your Bot Id and Bot Password. You will also need the Directline Key and a Key to utilize the Bing Speech API to convert SSML into speech audio files.

### Installing and Running

Easy. Peasy.

```
npm install
npm start
```

By default, the bot will run on port 3978. 

* Go to http://localhost:3978/ to test the custom web chat interface
* If Twilio configured and ngrok running, you can call your Twilio number to call the bot