# Alexa Skill Connector Bot
Practical Bot Development - Chapter 14

This code is a demostration of writing a Bot Builder based bot that supports Alexa skills. In particular, we chose to develop a Bot Builder backend to support the financial bot interaction model developed during the chapter. There are a number of different components in here:
1. Under /skill, we include the interaction model JSON as well as the original AWS Lambda skill code. 
1. We develop a Bot Builder bot that follows the same logic flow as the AWS Lambda skill code
1. We create a custom recognizer for our bot to accept Alexa intent and slot data and show how the Bot Builder can handle things such as built-in Alexa intents
1. We show the code for a proof of concept Alexa Skill to Bot Builder connector.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine. You will need to make sure you create a .env file which has your Bot Id and Bot Password. You will also need the Directline Key.

### Installing and Running

Easy. Peasy.

```
npm install
npm start
```

By default, the bot will run on port 3978. 

* Connect your Alexa skill to your local bot running on http://localhost:3978/api/alexa
* Set up an Alexa skill as per chapter 14 and connect the configuration end point to your local /api/alexa endpoint.