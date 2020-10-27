import {axios, botToken} from '../config'
import {Response} from "express";

const sendText = async (res: Response, chatId: number, output: string) => {
    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: output
            });
    } catch (e) {
        console.log('ERROR', `TEXT ${output}`,  93,  e.response);
    }
};

export default sendText;
