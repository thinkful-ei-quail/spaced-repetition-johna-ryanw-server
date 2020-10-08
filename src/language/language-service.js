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
        'language.total_score as totalScore'
      )
      .where('language.id', language_id)
      .first();
  },

  async processGuess(db, language_id, guess) {
    db = await db.transaction();

    // fetch current word info
    const currentWordRow = await db('language')
      .join('word as w0', 'language.head', 'w0.id')
      .select('w0.id', 'w0.next', 'w0.memory_value', 'w0.translation')
      .where('language.id', language_id)
      .first();
    const { translation, next: newHeadId } = currentWordRow;

    // calculating word updates
    const isCorrect = translation === guess;
    const fieldToIncrement = isCorrect ? 'correct_count' : 'incorrect_count';
    const newMemValue = isCorrect ? currentWordRow.memory_value * 2 : 1;

    // find insertion point to move the current word
    let destQuery = db.from(`word as w${newMemValue}`);
    for (let x = newMemValue; x-- > 1; )
      destQuery = destQuery.joinRaw(`join word as w${x} on case 
        when w${x + 1}.next is null and w${x}.id = w${x + 1}.id then 1
        when w${x}.id = w${x + 1}.next then 1
        else 0
        end = 1`);

    const destWordRow = await destQuery
      .select('w1.id', 'w1.next')
      .where(`w${newMemValue}.id`, newHeadId)
      .first();

    // getting the next word
    const nextWordRow = await db('word')
      .select('word.original')
      .where('word.id', newHeadId)
      .first();

    // update the total score and removing the current word from the linked list
    const languageUpdates = {
      head: newHeadId,
    };
    if (isCorrect) {
      languageUpdates.total_score = db.raw('total_score + 1');
    }
    const totalScore = (
      await db('language')
        .update(languageUpdates)
        .where('language.id', language_id)
        .returning('total_score')
    )[0];

    console.log(totalScore);

    // update the word removed from the linked list
    const wordUpdates = {
      memory_value: newMemValue,
      next: destWordRow.next,
      [fieldToIncrement]: db.raw('?? + 1', [fieldToIncrement]),
    };
    const wordUpdateRow = (
      await db('word')
        .update(wordUpdates)
        .where('id', currentWordRow.id)
        .returning(['correct_count', 'incorrect_count'])
    )[0];

    // Reinsert the removed word back into the list
    await db('word')
      .update('next', currentWordRow.id)
      .where('id', destWordRow.id);

    db.commit();

    return {
      isCorrect,
      answer: translation,
      wordCorrectCount: wordUpdateRow.correct_count,
      wordIncorrectCount: wordUpdateRow.incorrect_count,
      nextWord: nextWordRow.original,
      totalScore,
    };
  },
};

module.exports = LanguageService;
