const { listen } = require('../app');
const LinkedList = require('./LinkedList');

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
        'word.id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
        'language.head'
      )
      .join('language', 'language.id', '=', 'word.language_id')
      .where({ language_id });
  },

  // Todo Write service object methods to GET the following:

  getNextWord(db, user_id) {
    return db
      .from('language')
      .select(
        'language.head',
        'word.original',
        'word.correct_count',
        'word.incorrect_count',
        'language.total_score'
      )
      .where('language.id', user_id)
      .first()
      .leftJoin('word', 'language.head', 'word.id');
  },

  // 1. The next word (original) the user needs to submit their answer for.
  // 2. The correct count for that word.
  // 3. The incorrect count for that word.
  // 4. The total score for the user so far.

  // Todo Write service object methods for populating the linked list with words from the database

  createLinkedList(words) {
    let linkedList = new LinkedList();

    let currentWord = words.find((word) => word.id === word.head);
    console.log(words);
    linkedList.insertFirst(currentWord);
    let nextWord = words.find((word) => {
      return word.id === currentWord.next;
    });

    while (nextWord) {
      linkedList.insertLast(nextWord);
      nextWord = words.find((word) => {
        return word.id === nextWord.next;
      });
    }
    return linkedList;
  },

  async updateDatabase(db, language, linkedList, user_id) {
    let trx = await db.transaction();
    try {
      let currentNode = linkedList.head;

      while (currentNode) {
        let data = currentNode.data;

        await db('word')
          .transacting(trx)
          .where({ id: data.id })
          .update({
            next: currentNode.next && currentNode.next.data.id,
            correct_count: data.correct_count,
            incorrect_count: data.incorrect_count,
            memory_value: data.memory_value,
          });
        currentNode = currentNode.next;
      }

      await db('language').transacting(trx).where({ user_id }).update({
        head: language.head,
        total_score: language.total_score,
      });

      await trx.commit();
    } catch (error) {
      console.log(error.stack());
      await trx.rollback();
    }
  },
};

module.exports = LanguageService;
