const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score'
      )
      .where('language.user_id', user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count'
      )
      .where({ language_id });
  },

  // Todo Write service object methods to GET the following:

  getNextWord(db, language_id) {
    return db
      .from('language')
      .join('word', 'language.head', 'word.id')
      .select(
        'word.original as nextWord',
        'word.correct_count as wordCorrectCount',
        'word.incorrect_count as wordIncorrectCount',
        'language.total_score as TotalScore'
      )
      .where('language.id', language_id);
  },

  // 1. The next word (original) the user needs to submit their answer for.
  // 2. The correct count for that word.
  // 3. The incorrect count for that word.
  // 4. The total score for the user so far.

  // Todo Write service object methods for populating the linked list with words from the database
};

module.exports = LanguageService;
