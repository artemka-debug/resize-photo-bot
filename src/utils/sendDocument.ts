import {axios, botToken} from '../config'
import {Response} from "express";

const sendDocument = async (res: Response, chatId: number, resizedImage: string) => {
    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            chat_id: chatId,
            document: resizedImage
        });
    } catch (e) {
        console.log('ERROR', 104, e.response);
    }
};

export default sendDocument;