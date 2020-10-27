import {axios, botToken, pathToFile} from '../config'
import sendText from './sendText';
import {Response} from "express";
import fs from 'fs';

const downloadImage = async (fileInfo: string, fileName: string, chatId: number, res: Response) => {
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
};

export default downloadImage;