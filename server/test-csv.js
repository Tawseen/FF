const path = require('path');
const { getQuestionsFromCSV } = require('./google-sheets-csv');

const csvPath = path.resolve(__dirname, 'questions.csv'); // Correct path to your CSV file

getQuestionsFromCSV(csvPath)
  .then((questions) => {
    console.log('Loaded questions:');
    console.dir(questions, { depth: null });
  })
  .catch((err) => {
    console.error('Error loading questions:', err);
  });
