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
      .where('language.id', language_id).first();
  },

  async processGuess(db, language_id, guess) {
    db = await db.transaction();
    console.log(`guessed: ${guess}`);
    const currentWordRow = await db('language').join('word as w0', 'language.head', 'w0.id')
      .select('w0.id', 'w0.next', 'w0.memory_value', 'w0.translation')
      .where('language.id', language_id).first();
    const { translation } = currentWordRow;
    console.log(currentWordRow);
    const isCorrect = (translation === guess);
    const fieldToIncrement = isCorrect ? 'correct_count' : 'incorrect_count';
    const newMemValue = isCorrect ? currentWordRow.memory_value * 2 : 1;
    let destQuery = db.from(`word as w${newMemValue}`);
    for(let x = newMemValue; x-->1;)
      destQuery = destQuery.join(`word as w${x}`, `w${x}.id`, `w${x+1}.next`);
    const targetWordRow = await destQuery.select('w1.id', 'w1.next').where(`w${newMemValue}.id`, currentWordRow.next).first();
    const newValues = {
      memory_value: newMemValue,
      next: targetWordRow.next,
      [fieldToIncrement]: db.raw('?? + 1', [fieldToIncrement])
    };
    console.log(newValues);
    await db('language').update('head', currentWordRow.next).where('language.id', language_id);
    await db('word').update(newValues).where('id', currentWordRow.id);
    await db('word').update('next', currentWordRow.id).where('id', targetWordRow.id);
    db.commit();
    return { isCorrect, translation };
  }
};

module.exports = LanguageService;
