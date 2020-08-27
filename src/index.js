const {Bot} = require('tgapi');
const axios = require('axios');
const express = require('express');
const Jimp = require('jimp');
const fs = require('fs');
const botToken = '1313443151:AAFyoTe-9Hr65vQcqnyFtKKDthplHOV6c8E';
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const bot = new Bot(botToken);
const app = express();
const polling = bot.polling({
    limit: Infinity
});

app.use(express.static('/app'));

polling.on('update', (obj) => {
    const file = fs.createWriteStream(`${Date.now()}-update.txt`);
    file.write(`${new Date(Date.now()).toDateString()} ${JSON.stringify(obj)} \n`);
    file.end();
});
polling.on('error', (err) => {
    const file = fs.createWriteStream(`${Date.now()}-error.txt`);
    file.write(`${new Date(Date.now()).toDateString()} ${JSON.stringify(err)} \n`);
    file.end();
});
polling.on('message', async message => {
    console.log('got message');
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


    const fileName = `${Date.now()}-${message.chat.id}`;
    try {
        await downloadImage(fileInfo, fileName);
    } catch (e) {
        bot.sendMessage({chat_id: message.chat.id, text: e.response});
    }
    console.log('after downloading file');

    bot.sendMessage({chat_id: message.chat.id, text: `Starting converting file`});
    await Jimp.read(`${fileName}.jpeg`)
        .then(lenna => {
            return lenna
                .resize(512, 512)
                .write(`${fileName}.png`);
        })
        .catch(err => {
            bot.sendMessage({chat_id: message.chat.id, text: 'Something went wrong with converting your file' + err});
        });
    console.log('after converting file');

    await bot.sendMessage({chat_id: message.chat.id, text: `Converted`});
    const response = await bot.sendDocument({
        chat_id: message.chat.id,
        document: `https://resize-photo-bot.herokuapp.com/${fileName}.png`,
    });

    if (!response.ok) {
        bot.sendMessage({chat_id: message.chat.id, text: response.description})
    }

    fs.unlink(`${fileName}.png`, (err) => {
        console.log(err ? err : 'error is not present');
    });
    fs.unlink(`${fileName}.jpeg`, (err) => {
        console.log(err ? err : 'error is not present');
    });
});

async function downloadImage(fileInfo, fileName) {
    const file = fs.createWriteStream(`${fileName}.jpeg`);
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
    console.log(`listening on port ${process.env.PORT || 8080}`);
});
