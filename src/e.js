const Jimp = require('jimp');

const test = async () => {
    const res = await Jimp.read(`download (3).jpeg`);

    try {
        res.resize(512, 0).write(`asdfa.png`);
    } catch (e) {
        console.log('ERROR', e);
    }
};

test();
