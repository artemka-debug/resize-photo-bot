const {Bot} = require('tgapi');
const axios = require('axios');
const express = require('express');
const app = express();
var convertapi = require('convertapi')('PYCFytfnkGHPKMGY');
const fs = require('fs');
const sharp = require('sharp');
const handleResize = require('./handleResize');
const botToken = '1313443151:AAGVVJsJm2ZS8X4KQTJEJt00WF-76oW__JY';
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const bot = new Bot(botToken);
const polling = bot.polling({
    limit: 50,
    timeout: 60,
});

app.use(express.static('/Users/tricky_artem/telegram_bot/resize_photo'));

polling.on('message', async message => {
    const command = message.text;

    if (!message.photo) {
        bot.sendMessage({chat_id: message.chat.id, text: `Expected photo`})
        return;
    }

    const fileInfo = await bot.getFile({file_id: message.photo[2].file_id});

    if (!fileInfo.ok) {
        bot.sendMessage({chat_id: message.chat.id, text: `Something went wrong with getting photo`})
        return;
    }


    const file = fs.createWriteStream('file.jpeg');
    const photo = await axios({
        url: `${pathToFile}/${fileInfo.result.file_path}`,
        method: 'GET',
        responseType: 'stream'
    });

    photo.data.pipe(file)
    
    convertapi.convert('png', {
        File: 'file.jpeg',
        ImageHeight: '512',
        ImageWidth: '512'
    }, 'jpeg').then(function(result) {
        result.saveFiles('./');
    });

    const res = await bot.sendDocument({
        chat_id: message.chat.id,
        document: '/file.png'
    })

    if (!res.ok) {
        bot.sendMessage({chat_id: message.chat.id, text: res.description})
    }

    fs.unlink('file.jpeg', function () {
        console.log('Succsecfully deleted');
    });
    fs.unlink('file.png', function () {
        console.log('Succsecfully deleted');
    });
});

app.listen(8080, () => {
    console.log('listening on port 8080');
});
