const fs = require('fs');
const { parse } = require('csv-parse');

function getQuestionsFromCSV(csvFilePath) {
  return new Promise((resolve, reject) => {
    const questions = [];
    fs.createReadStream(csvFilePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row) => {
        const answers = [];
        for (let i = 1; i <= 8; i++) {
          const answerTextRaw = row[`Answer${i}`];
          const answerText = answerTextRaw ? answerTextRaw.trim() : '';
          const scoreRaw = row[`Score${i}`];
          const score = parseInt(scoreRaw, 10);
          if (answerText && !isNaN(score)) {
            answers.push({ text: answerText, points: score });
          }
        }

        questions.push({
          category: row.Category,
          questionNumber: row.QuestionNumber,
          question: row.Question,
          answers,
        });
      })
      .on('end', () => resolve(questions))
      .on('error', reject);
  });
}

module.exports = { getQuestionsFromCSV };
