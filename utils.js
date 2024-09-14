const questions = require('./questions.json');
const { Random } = require('random-js');

const usedQuestions = {};

const getRandomQuestion = (topic) => {
  const random = new Random();
  let questionTopic = topic.toLowerCase();

  if (topic === 'случайный вопрос') {
    questionTopic =
      Object.keys(questions)[
        random.integer(0, Object.keys(questions).length - 1)
      ];
  }

  if (!usedQuestions[questionTopic]) {
    usedQuestions[questionTopic] = [];
  }

  const availableQuestions = questions[questionTopic].filter(
    (q) => !usedQuestions[questionTopic].includes(q.id)
  );

  if (availableQuestions.length === 0) {
    usedQuestions[questionTopic] = [];
    return getRandomQuestion(topic);
  }

  const randomQuestionIndex = random.integer(0, availableQuestions.length - 1);

  const selectedQuestion = availableQuestions[randomQuestionIndex];

  usedQuestions[questionTopic].push(selectedQuestion.id);

  return {
    question: selectedQuestion,
    questionTopic,
  };
};

const getCorrectAnswer = (topic, id) => {
  const question = questions[topic].find((q) => q.id === id);
  if (!question.hasOptions) {
    return question.answer;
  }
  return question.options.find((option) => option.isCorrect).text;
};

module.exports = { getRandomQuestion, getCorrectAnswer };
