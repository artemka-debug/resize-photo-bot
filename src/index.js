const {Bot} = require('tgapi');
const axios = require('axios');
const express = require('express');
const AWS = require('aws-sdk');
const convertapi = require('convertapi')('PYCFytfnkGHPKMGY');
const fs = require('fs');
const Kraken = require("kraken");
const sharp = require('sharp');
const handleResize = require('./handleResize');
const botToken = '1313443151:AAGVVJsJm2ZS8X4KQTJEJt00WF-76oW__JY';
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const bot = new Bot(botToken);
const app = express();
const polling = bot.polling({
    limit: 50,
    timeout: 60,
});
const s3 = new AWS.S3({
    accessKeyId: 'AKIAV7QSZQXX3KEDXIHQ',
    secretAccessKey: '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'
});
// const kraken = new Kraken({
//     "api_key": "3a551b9a72372a1576e6b92b5c4e43c6",
//     "api_secret": "6b80d397633e0daa95a759440127b6fe12712396"
// });
//
// const karkenParams = {
//     "url": "http://localhost:8080/file.png",
//     "wait": true,
//     "s3_store": {
//         "key": "AKIAV7QSZQXX3KEDXIHQ",
//         "secret": "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",
//         "bucket": "we-tube-bucket",
//         "path": "file.png",
//         "region": "eu-west-3",
//         "headers": {
//             "Cache-Control": "max-age=2592000000",
//         }
//     }
// };
//
// kraken.url(karkenParams, function (status) {
//     if (status.success) {
//         console.log("Success. Optimized image URL: %s", status.kraked_url);
//     } else {
//         console.log("Fail. Error message: %s", status.message);
//     }
// });

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
        ImageWidth: '450',
        ImageQuality: '75'
    }, 'jpeg').then(function (result) {
        result.saveFiles('./');
        bot.sendMessage({chat_id: message.chat.id, text: 'Image has successfully been converted. Wait for response'})

        s3.putObject({
            Bucket: 'we-tube-bucket',
            Key: 'file.png',
            Body: fs.readFileSync('./file.png')
        })
            .promise()
            .then(async res => {
                const response = await bot.sendDocument({
                    chat_id: message.chat.id,
                    document: 'https://we-tube-bucket.s3.eu-west-3.amazonaws.com/file.png',
                })

                if (!response.ok) {
                    bot.sendMessage({chat_id: message.chat.id, text: res.description})
                }

                // s3.deleteObject({
                //     Bucket: 'we-tube-bucket',
                //     Key: 'file.png',
                // }, (err, data) => console.log(err ? err : data));

                // fs.unlink('file.jpeg', function (err) {
                //     console.log(err)
                // });
                // fs.unlink('file.png', function (err) {
                //     console.log(err)
                // });
            })
            .catch(err => bot.sendMessage({chat_id: message.chat.id, text: err}))
    });
});

app.listen(8080, () => {
    console.log('listening on port 8080');
});
