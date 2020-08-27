const Telegraf = require('telegraf');
const axios = require('axios');
const express = require('express');
const Jimp = require('jimp');
const fs = require('fs');
const botToken = '1313443151:AAFyoTe-9Hr65vQcqnyFtKKDthplHOV6c8E';
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const bot = new Telegraf(botToken);
const app = express();

app.use(express.static('/app'));
bot.on('message', async ctx => {
    console.log('got message');
    if (!ctx.updateSubTypes.includes('photo')) {
        await ctx.reply('Expected photo');
        return;
    }

    const fileName = `${Date.now()}`;
    try {
        await downloadImage(ctx.message.photo[ctx.message.photo.length - 1].file_id, fileName, ctx);
    } catch (e) {
        await ctx.reply(JSON.stringify(e.message));
    }

    await ctx.reply(`Starting converting file`);
    await Jimp.read(`${fileName}.jpeg`)
        .then(lenna => {
            return lenna
                .resize(512, 512)
                .write(`${fileName}.png`);
        })
        .catch(err => {
            ctx.reply(JSON.stringify(err.message));
        });

    await ctx.reply(`Converted`);
    try {
        await ctx.replyWithDocument(`https://resize-photo-bot.herokuapp.com/${fileName}.png`);
    } catch (e) {
        await ctx.reply(JSON.stringify(e.message));
    }

    fs.unlink(`${fileName}.png`, (err) => {
        console.log(err ? err : 'error is not present');
    });
    fs.unlink(`${fileName}.jpeg`, (err) => {
        console.log(err ? err : 'error is not present');
    });
});

async function downloadImage(fileInfo, fileName, ctx) {
    let res;

    try {
        res = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileInfo}`);
    } catch (e) {
        ctx.reply(JSON.stringify(e.message));
        return
    }

    const file = fs.createWriteStream(`${fileName}.jpeg`);
    const photo = await axios({
        url: `${pathToFile}/${res.data.result.file_path}`,
        method: 'GET',
        responseType: 'stream'
    });

    photo.data.pipe(file);

    return new Promise((resolve, reject) => {
        file.on('finish', resolve);
        file.on('error', reject)
    })
}

bot.launch();

app.get('/test', (req, res) => {
    res.json({hi: 'good'});
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`listening on port ${process.env.PORT || 8080}`);
});
