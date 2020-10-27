const axios = require('axios');
const botToken = process.env.TG_TOKEN;
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;

export {
    axios, botToken, pathToFile
}