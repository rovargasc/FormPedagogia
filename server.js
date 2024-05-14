
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Create tables if they do not exist
pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        datetime TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL,
        answer TEXT NOT NULL,
        datetime TIMESTAMP NOT NULL,
        FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
    );
`, (err) => {
    if (err) {
        console.error('Error creating tables:', err.stack);
    }
});

// Endpoint to post a question
app.post('/question', (req, res) => {
    const { question } = req.body;
    const datetime = new Date().toISOString();
    pool.query(
        `INSERT INTO questions (question, datetime) VALUES ($1, $2) RETURNING id`,
        [question, datetime],
        (err, result) => {
            if (err) {
                console.error('Error inserting question:', err.stack);
                res.status(500).send({ error: err.message });
                return;
            }
            res.send({ question_id: result.rows[0].id, datetime });
        }
    );
});

// Endpoint to post an answer
app.post('/answer', (req, res) => {
    const { question_id, answer } = req.body;
    const datetime = new Date().toISOString();
    pool.query(
        `INSERT INTO answers (question_id, answer, datetime) VALUES ($1, $2, $3) RETURNING id`,
        [question_id, answer, datetime],
        (err, result) => {
            if (err) {
                console.error('Error inserting answer:', err.stack);
                res.status(500).send({ error: err.message });
                return;
            }
            res.send({ answer_id: result.rows[0].id, datetime });
        }
    );
});

// Endpoint to get all questions and their answers
app.get('/questions', (req, res) => {
    pool.query(`SELECT * FROM questions ORDER BY datetime DESC`, (err, questionsResult) => {
        if (err) {
            console.error('Error retrieving questions:', err.stack);
            res.status(500).send({ error: err.message });
            return;
        }
        const questions = questionsResult.rows;
        const questionIds = questions.map(q => q.id);
        if (questionIds.length === 0) {
            res.send({ questions: [] });
            return;
        }
        pool.query(`SELECT * FROM answers WHERE question_id = ANY($1::int[])`, [questionIds], (err, answersResult) => {
            if (err) {
                console.error('Error retrieving answers:', err.stack);
                res.status(500).send({ error: err.message });
                return;
            }
            const answers = answersResult.rows;
            const response = questions.map(question => ({
                ...question,
                answers: answers.filter(answer => answer.question_id === question.id)
            }));
            res.send({ questions: response });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
