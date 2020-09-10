// require('dotenv').config();
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

        if (!message.photo) {
            await sendText(res, message.chat.id, 'Expected photo');
            res.send();
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
        const {chatId, photo} = req.tgBody;

        const fileName = `${Date.now()}`;
        try {
            await downloadImage(photo[photo.length - 1].file_id, fileName, chatId, res);
            await sendText(res, chatId, `Starting converting file`);
            const readFile = await Jimp.read(`${fileName}.jpeg`);
            readFile.resize(512, 512).write(`${fileName}.png`);
            await sendText(res, chatId, `Converted`);
            await sendDocument(res, chatId, `https://resize-photo-bot.herokuapp.com/${fileName}.png`);
        } catch (e) {
            await sendText(res, chatId, 'Error appeared when converting the file');
            res.send();
        }

        const unlinkAsync = promisify(fs.unlink);

        try {
            await unlinkAsync(`${fileName}.jpeg`);
            await unlinkAsync(`${fileName}.png`);
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
        console.log('ERROR', `TEXT ${output}`,  93,  e.response);
    }
}

async function sendDocument(res, chatId, resizedImage) {
    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            chat_id: chatId,
            document: resizedImage
        });
    } catch (e) {
        console.log('ERROR', 104, e.response);
    }
}

app.listen(process.env.PORT || 8080, () => {
    console.log(`listening on port ${process.env.PORT || 8080}`);
});
