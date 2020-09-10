require('dotenv').config();
const bodyParser = require('body-parser');
const axios = require('axios');
const express = require('express');
const Jimp = require('jimp');
const {promisify} = require('util');
const fs = require('fs');
const botToken = process.env.TG_TOKEN;
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const app = express();

app.use(express.static('/app'));
app.use(bodyParser.json());

app.post('/new-message',
    // MIDDLEWARE :))
    async (req, res, next) => {
        const {message} = req.body;

        console.log(message);
        if (!message.photo) {
            await sendText(res, message.chat.id, 'Expected photo');
            return;
        }

        req.tgBody = {
            chatId: message.chat.id,
            photo: message.photo
        };
        next();
    },
    // MAIN FUNCTION :))
    async (req, res) => {
        console.log('got photo');
        const {chatId, photo} = req.tgBody;

        const fileName = `${Date.now()}`;
        try {
            await downloadImage(photo[photo.length - 1].file_id, fileName, chatId, res);
            await sendText(res, chatId, `Starting converting file`);
            const res = await Jimp.read(`${fileName}.jpeg`);
            res.resize(512, 0).write(`${fileName}.png`);
            await sendText(res, chatId, `Converted`);
            await sendDocument(res, chatId, `https://resize-photo-bot.herokuapp.com/${fileName}.png`);
        } catch (e) {
            await sendText(res, chatId, JSON.stringify(e.response));
        }

        const unlinkAsync = promisify(fs.unlink);

        try {
            await unlinkAsync(`${fileName}.png`);
            await unlinkAsync(`${fileName}.jpeg`);
        } catch (err) {
            console.log(err ? err : 'error is not present');
        }
        res.send();
    });

async function downloadImage(fileInfo, fileName, chatId, res) {
    let response;

    try {
        response = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileInfo}`);
    } catch (e) {
        await sendText(res, chatId, JSON.stringify(e.response));
        return
    }

    const file = fs.createWriteStream(`${fileName}.jpeg`);
    const photo = await axios({
        url: `${pathToFile}/${response.data.result.file_path}`,
        method: 'GET',
        responseType: 'stream'
    });

    photo.data.pipe(file);

    return new Promise((resolve, reject) => {
        file.on('finish', resolve);
        file.on('error', reject)
    })
}

async function sendText(res, chatId, output) {
    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: output
            });
    } catch (e) {
        console.log('ERROR', e);
    }
}

async function sendDocument(res, chatId, resizedImage) {
    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            chat_id: chatId,
            document: resizedImage
        });
    } catch (e) {
        console.log('ERROR', e);
    }
}

app.listen(process.env.PORT || 8080, () => {
    console.log(`listening on port ${process.env.PORT || 8080}`);
});
