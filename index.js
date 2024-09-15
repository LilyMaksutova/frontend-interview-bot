require('dotenv').config();
const {
  Bot,
  Keyboard,
  GrammyError,
  HttpError,
  InlineKeyboard,
} = require('grammy');
const bot = new Bot(process.env.BOT_API_KEY);
const { getRandomQuestion, getCorrectAnswer } = require('./utils');

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('TypeScript')
    .row()
    .text('React')
    .text('Redux')
    .row()
    .text('Случайный вопрос')
    .resized();
  await ctx.reply(
    'Привет! Я - Frontend Interview Bot 🤖 \nЯ помогу тебе с подготовкой к frontend-собеседованиям'
  );
  await ctx.reply('Давай приступим! Выбери тему вопроса в меню 👇', {
    reply_markup: startKeyboard,
  });
});

const sanitizeHTML = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

bot.hears(
  [
    'CSS',
    'HTML',
    'JavaScript',
    'TypeScript',
    'React',
    'Redux',
    'Случайный вопрос',
  ],
  async (ctx) => {
    const topic = ctx.message.text.toLowerCase();
    const result = getRandomQuestion(topic);
    if (!result || !result.question) {
      await ctx.reply(
        `Не удалось получить вопрос по теме "${topic}". Возможно, вопросы закончились. Попробуйте другую тему.`
      );
      return;
    }
    const { question, questionTopic } = result;
    let inlineKeyboard;

    if (question.hasOptions) {
      const buttonRows = question.options.map((option) => [
        InlineKeyboard.text(
          option.text,
          JSON.stringify({
            type: `${questionTopic}-option`,
            isCorrect: option.isCorrect,
            questionId: question.id,
          })
        ),
      ]);
      inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
      inlineKeyboard = new InlineKeyboard().text(
        'Узнать ответ',
        JSON.stringify({
          type: questionTopic,
          questionId: question.id,
        })
      );
    }
    const sanitizedQuestionText = sanitizeHTML(question.text);

    await ctx.reply(`<b>${sanitizedQuestionText}</b>`, {
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });
  }
);

bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);
  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    await ctx.reply(answer, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply('Верно ✅');
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split('-')[0],
    callbackData.questionId
  );
  await ctx.reply(`Неверно ❌ Правильный ответ: ${answer}`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});
bot.start();
