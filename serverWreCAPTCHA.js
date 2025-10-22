require('dotenv').config();
const express = require('express');
const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");
const { getAuth } = require('firebase/auth');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fetch = require('node-fetch');

// Import configurations
const firebaseConfig = require('./config/firebase');
const sessionConfig = require('./config/session');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());
app.use(session(sessionConfig));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

// Import and use routes
const authRoutes = require('./routes/auth')(app, auth, db);
const propertyRoutes = require('./routes/properties')(app, db);
const messageRoutes = require('./routes/messages')(app);


app.use('/', authRoutes);
app.use('/', propertyRoutes);
app.use('/', messageRoutes);


// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/resetPassword', (req, res) => {
    res.sendFile(path.join(__dirname, 'resetPassword.html'));
});

app.get('/dashboard', (req, res) => {
    const userRole = req.session.role;
    if (userRole === 'tenant') {
        res.sendFile(path.join(__dirname, 'tenant_dashboard.html'));
    } else if (userRole === 'landlord') {
        res.sendFile(path.join(__dirname, 'landlord_dashboard.html'));
    } else {
        res.status(403).send('Access denied');
    }
});

app.get('/searchResults', (req, res) => {
    res.sendFile(path.join(__dirname, 'searchResults.html'));
    console.log("searchResults sent");
});

// reCAPTCHA verification endpoint
app.post('/verify-recaptcha', async (req, res) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const token = req.body['g-recaptcha-response'];
    if (!token) {
        return res.status(400).json({ success: false, message: 'No reCAPTCHA token provided.' });
    }
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    try {
        const response = await fetch(verificationURL, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            res.json({ success: true, message: 'reCAPTCHA verified successfully.' });
        } else {
            res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying reCAPTCHA.', error });
    }
});



// Start server
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;