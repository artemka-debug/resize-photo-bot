import sendText from "../utils/sendText";
import {Response, Request, NextFunction} from "express";

const parseTgBody = async (req: Request, res: Response, next: NextFunction) => {
    const {message} = req.body;

    if (!message.photo) {
        await sendText(res, message.chat.id, 'Expected photo');
        res.send();
        return;
    }

    req.body.tgBody = {
        chatId: message.chat.id,
        photo: message.photo
    };
    next();
};

export default parseTgBody;