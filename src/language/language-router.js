const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');

const languageRouter = express.Router();

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
      req.language.id
    );
    res.json(data);
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.post('/guess', express.json(), async (req, res, next) => {
  const { guess } = req.body;

  if (!guess) {
    return res.status(400).json({
      error: 'Missing \'guess\' in request body',
    });
  }

  if (typeof guess !== 'string') return res.status(400).send();
  try {
    const result = await LanguageService.processGuess(
      req.app.get('db'),
      req.language.id,
      guess
    );
    console.log(result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = languageRouter;
