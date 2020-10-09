const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');

const languageRouter = express.Router();
const jsonBodyParser = express.json();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    );

    if (!language)
      return res.status(404).json({
        error: 'You don\'t have any languages',
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/', async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/head', async (req, res, next) => {
  try {
    const data = await LanguageService.getNextWord(
      req.app.get('db'),
      req.user.id
    );
    res.json({
      language: data.name,
      nextWord: data.original,
      wordCorrectCount: data.correct_count,
      wordIncorrectCount: data.incorrect_count,
      totalScore: data.total_score,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.post('/guess', jsonBodyParser, async (req, res, next) => {
  const { guess } = req.body;
  let language = req.language;

  if (!guess) {
    return res.status(400).json({
      error: 'Missing \'guess\' in request body',
    });
  }

  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      language.id
    );
    const linkedList = await LanguageService.createLinkedList(words);

    let isCorrect;
    let newNode = linkedList.head.data;

    // if guess is correct:
    if (newNode.translation === guess) {
      isCorrect = true;
      language.total_score++;
      newNode.correct_count++;
      let memoryValue = newNode.memory_value * 2;
      newNode.memory_value = Math.min(memoryValue, words.length);
    } // if guess is incorrect
    else {
      isCorrect = false;
      newNode.incorrect_count++;
      newNode.memory_value = 1;
    }
    // remove the current node
    linkedList.remove(newNode);

    // insert back into list at the index of its memory value
    linkedList.insertAt(newNode.memory_value, newNode);

    language.head = linkedList.head.data.id;

    await LanguageService.updateDatabase(
      req.app.get('db'),
      language,
      linkedList,
      req.user.id
    );

    let nextWord = await LanguageService.getNextWord(
      req.app.get('db'),
      req.user.id
    );

    let newNextWord = {
      nextWord: nextWord.original,
      totalScore: nextWord.total_score,
      wordCorrectCount: nextWord.correct_count,
      wordIncorrectCount: nextWord.incorrect_count,
      translation: newNode.translation,
      isCorrect,
    };

    res.json(newNextWord);
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
