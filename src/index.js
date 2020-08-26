const {Bot} = require('tgapi');
const axios = require('axios');
const express = require('express');
const Kraken = require("kraken");
const Jimp = require('jimp');
const convertapi = require('convertapi')('PYCFytfnkGHPKMGY');
const fs = require('fs');
const botToken = '1313443151:AAGVVJsJm2ZS8X4KQTJEJt00WF-76oW__JY';
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const bot = new Bot(botToken);
const app = express();
const polling = bot.polling({
    limit: 50,
    timeout: 60,
});

const kraken = new Kraken({
    "api_key": "3a551b9a72372a1576e6b92b5c4e43c6",
    "api_secret": "6b80d397633e0daa95a759440127b6fe12712396"
});

app.use(express.static('/'));

polling.on('message', async message => {
    const command = message.text;

    if (!message.photo) {
        bot.sendMessage({chat_id: message.chat.id, text: `Expected photo`});
        return;
    }

    let fileInfo;
    try {
        fileInfo = await bot.getFile({file_id: message.photo[message.photo.length - 1].file_id});
    } catch (e) {
        bot.sendMessage({chat_id: message.chat.id, text: e.response});
    }

    if (!fileInfo.ok) {
        bot.sendMessage({chat_id: message.chat.id, text: `Something went wrong with getting photo`});
        return;
    }

    try {
        await downloadImage(fileInfo);
    } catch (e) {
        bot.sendMessage({chat_id: message.chat.id, text: e.response});
    }

    await Jimp.read('file.jpeg')
        .then(lenna => {
            return lenna
                .resize(512, 512)
                .write('file.png');
        })
        .catch(err => {
            console.error(err);
        });

    const response = await bot.sendDocument({
        chat_id: message.chat.id,
        document: 'https://resize-photo-bot.herokuapp.com/file.png',
    });

    if (!response.ok) {
        bot.sendMessage({chat_id: message.chat.id, text: response.description})
    }
});

async function downloadImage(fileInfo) {
    const file = fs.createWriteStream('file.jpeg');
    const photo = await axios({
        url: `${pathToFile}/${fileInfo.result.file_path}`,
        method: 'GET',
        responseType: 'stream'
    });

    photo.data.pipe(file);

    return new Promise((resolve, reject) => {
        file.on('finish', resolve);
        file.on('error', reject)
    })
}

app.listen(process.env.PORT || 8080, () => {
    console.log(`listening on port ${process.env.PORT}`);
});
