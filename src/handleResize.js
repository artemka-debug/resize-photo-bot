const handleResize = async (bot, message) => {
    console.log(await bot.answerCallbackQuery(), message);
};

module.exports = handleResize;
