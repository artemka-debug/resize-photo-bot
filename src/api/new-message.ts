import downloadImage from "../utils/downloadImage";
import sendText from "../utils/sendText";
import Jimp from "jimp";
import sendDocument from "../utils/sendDocument";
import {promisify} from "util";
import fs from "fs";
import {Response, Request} from "express";

const newMessage = async (req: Request, res: Response) => {
    const {chatId, photo} = req.body.tgBody;

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
};

export default newMessage;