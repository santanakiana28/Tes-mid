// index.js
const fs = require('fs'); //manggil file json
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser'); //untuk parsing body
const bcrypt = require('bcryptjs'); //
const { body, validationResult } = require('express-validator');
const db = require('./db');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); //untuk menampilkan halaman ejs

// Middleware for serving static files
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.render('home'));

// Load About page with JSON data
app.get('/about', (req, res) => {
    const aboutPath = path.join(__dirname, '/data/about.json');
    fs.readFile(aboutPath, 'utf8', (err, data) => {
      if (err) {
        console.error("Error reading JSON file", err);
        return res.status(500).send("Server error");
      }
  
      const aboutData = JSON.parse(data); // Parse JSON data
      res.render('about', { data: aboutData });
    });
  });

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Register route
app.post('/register', [
  body('email').isEmail().withMessage('Enter a valid email') //isemail > fungsi untuk menetukan apakah email uda ditulis secara benar atau beluum
  
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { //
    return res.render('register', { errors: errors.array() });
  }

  const { name, username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = 'INSERT INTO register (name, username, email, password) VALUES (?, ?, ?, ?)';
  db.query(query, [name, username, email, hashedPassword], (err, result) => {
    if (err) throw err;
    res.redirect('/login');
  });
});

// Login route
app.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { errors: errors.array() });
  }

  const { email, password } = req.body;

  db.query('SELECT * FROM register WHERE email = ?', [email], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }

    const user = results[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }

    res.redirect('/');
  });
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
