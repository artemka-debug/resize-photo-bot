const Telegraf = require('telegraf');
const axios = require('axios');
const express = require('express');
const Jimp = require('jimp');
const {promisify} = require('util');
const fs = require('fs');
const botToken = '1313443151:AAFyoTe-9Hr65vQcqnyFtKKDthplHOV6c8E';
const pathToFile = `https://api.telegram.org/file/bot${botToken}`;
const bot = new Telegraf(botToken);
const app = express();

app.use(express.static('/app'));

bot.on('text', async ctx => {
    await ctx.reply('Expected photo');
});

bot.on('photo', async ctx => {
    console.log('got message');

    const fileName = `${Date.now()}`;
    try {
        await downloadImage(ctx.message.photo[ctx.message.photo.length - 1].file_id, fileName, ctx);
        await ctx.reply(`Starting converting file`);
        const res = await Jimp.read(`${fileName}.jpeg`);
        res.resize(512, 0).write(`${fileName}.png`);
        await ctx.reply(`Converted`);
        await ctx.replyWithDocument(`https://resize-photo-bot.herokuapp.com/${fileName}.png`);
    } catch (e) {
        await ctx.reply(JSON.stringify(e.message));
    }

    const unlinkAsync = promisify(fs.unlink);

    try {
        await unlinkAsync(`${fileName}.png`);
        await unlinkAsync(`${fileName}.jpeg`);
    } catch (err) {
        console.log(err ? err : 'error is not present');
    }
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


setInterval(async () => {
    const res = await bot.telegram.deleteWebhook();
    console.log(res);
}, 10000);

bot.launch();
app.listen(process.env.PORT || 8080, () => {
    console.log(`listening on port ${process.env.PORT || 8080}`);
});
