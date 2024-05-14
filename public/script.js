
document.addEventListener('DOMContentLoaded', function() {
    loadQuestions();
});

function loadQuestions() {
    fetch('/questions')
        .then(response => response.json())
        .then(data => {
            const questionsSection = document.getElementById('questionsSection');
            questionsSection.innerHTML = '';
            data.questions.forEach(question => {
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                questionItem.innerHTML = `
                    <div class="question-text">${question.question}</div>
                    <div class="buttons">
                        <button onclick="toggleAnswerForm(this, ${question.id})">Reply</button>
                        <button onclick="toggleAnswers(this)">Show Replies (${question.answers.length})</button>
                    </div>
                    <div class="answers" style="display: none;">
                        ${question.answers.map(answer => `
                            <div class="answer-display">${answer.answer}</div>
                        `).join('')}
                    </div>
                `;
                questionsSection.insertBefore(questionItem, questionsSection.firstChild);
            });
        }).catch(error => {
            console.error('Error loading questions:', error);
        });
}

function submitQuestion() {
    const questionInput = document.getElementById('questionInput');
    const questionText = questionInput.value.trim();
    if (questionText) {
        fetch('/question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: questionText }),
        })
        .then(response => response.json())
        .then(data => {
            displayQuestion(data.question_id, questionText);
            questionInput.value = ''; // Clear the input after submitting
        }).catch(error => {
            console.error('Error posting question:', error);
        });
    }
}

function displayQuestion(questionId, questionText) {
    const questionsSection = document.getElementById('questionsSection');
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.innerHTML = `
        <div class="question-text">${questionText}</div>
        <div class="buttons">
            <button onclick="toggleAnswerForm(this, ${questionId})">Reply</button>
            <button onclick="toggleAnswers(this)">Show Replies (0)</button>
        </div>
        <div class="answers" style="display: none;"></div>
    `;
    questionsSection.insertBefore(questionItem, questionsSection.firstChild);
}

function toggleAnswerForm(button, questionId) {
    const questionItem = button.parentElement.parentElement;
    const answersDiv = questionItem.querySelector('.answers');
    let form = answersDiv.querySelector('.answer-form');
    if (!form) {
        form = document.createElement('div');
        form.className = 'answer-form';
        form.innerHTML = `
            <textarea class="answer-input" placeholder="Write a reply..." rows="3"></textarea>
            <button onclick="submitAnswer(this, ${questionId})">Submit</button>
        `;
        answersDiv.appendChild(form);
    }
    answersDiv.style.display = 'block'; // Ensure the answer form is visible
    form.querySelector('.answer-input').focus(); // Focus on the text area
}

function submitAnswer(button, questionId) {
    const answerInput = button.previousElementSibling;
    const answerText = answerInput.value.trim();
    if (answerText) {
        fetch('/answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question_id: questionId, answer: answerText }),
        })
        .then(response => response.json())
        .then(data => {
            displayAnswer(answerInput.parentElement.parentElement, answerText);
            answerInput.value = ''; // Clear the text area after submitting
            updateAnswerCount(answerInput.parentElement.parentElement.previousElementSibling);
            alert('Your reply has been registered');
        }).catch(error => {
            console.error('Error posting answer:', error);
        });
    }
}

function displayAnswer(answersDiv, answerText) {
    const answerDisplay = document.createElement('div');
    answerDisplay.className = 'answer-display';
    answerDisplay.textContent = answerText;
    answersDiv.appendChild(answerDisplay); // Insert the answer at the end of the answers div
}

function toggleAnswers(button) {
    const answersDiv = button.nextElementSibling;
    const isVisible = answersDiv.style.display === 'block';
    answersDiv.style.display = isVisible ? 'none' : 'block';
    button.textContent = isVisible ? `Show Replies (${answersDiv.children.length})` : `Hide Replies (${answersDiv.children.length})`;
}

function updateAnswerCount(buttonsDiv) {
    const answersDiv = buttonsDiv.nextElementSibling;
    const answerCount = answersDiv.children.length;
    const showButton = buttonsDiv.querySelector('button:nth-child(2)');
    showButton.textContent = `Show Replies (${answerCount})`;
}
