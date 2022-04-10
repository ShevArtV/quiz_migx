import Quiz from './quiz.js';
document.querySelectorAll('.jsQuizForm').forEach(function(el){
    new Quiz(el);
});
