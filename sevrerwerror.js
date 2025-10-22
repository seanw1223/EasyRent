require('dotenv').config();
const express = require('express');
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get } = require("firebase/database");
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(express.static(path.join(__dirname, 'public')));

const googleApiKey = process.env.GOOGLE_API_KEY;

const firebaseConfig = {
    apiKey: googleApiKey,
    authDomain: "easyrent-9b025.firebaseapp.com",
    databaseURL: "https://easyrent-9b025-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "easyrent-9b025",
    storageBucket: "easyrent-9b025.appspot.com",
    messagingSenderId: "701935235340",
    appId: "1:701935235340:web:aeb3e8e2b715a27227d929",
    measurementId: "G-5B0RSMB262"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

// Utility function to sanitize email
function sanitizeEmail(email) {
    return email.replace(/[.#$[\]]/g, '_');
}

// Async wrapper to handle errors in async routes
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Single dashboard route
app.get('/dashboard', (req, res, next) => {
    const userRole = req.session.role;

    if (userRole === 'tenant') {
        res.sendFile(path.join(__dirname, 'tenant_dashboard.html'));
    } else if (userRole === 'landlord') {
        res.sendFile(path.join(__dirname, 'landlord_dashboard.html'));
    } else {
        next({ status: 403, message: 'Access denied' });
    }
});

// Serve the login page as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Serve the reset page
app.get('/resetPassword', (req, res) => {
    res.sendFile(path.join(__dirname, 'resetPassword.html'));
});

// Registration route
app.post('/register', asyncHandler(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return next({ status: 400, message: "Email, password, and role are required" });
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        const sanitizedEmail = sanitizeEmail(email);
        const reference = ref(db, 'users/' + sanitizedEmail);
        await set(reference, { email, role });

        res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            return next({ status: 409, message: "Email is already in use" });
        }
        next(error); // Let the centralized error handler handle it
    }
}));

// Login route
app.post('/login', asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next({ status: 400, message: "Email and password are required" });
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const sanitizedEmail = sanitizeEmail(email);
        const reference = ref(db, 'users/' + sanitizedEmail);
        const snapshot = await get(reference);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            req.session.role = userData.role; // Store user role in the session
            return res.status(200).json({
                message: "Login successful",
                role: userData.role
            });
        } else {
            return next({ status: 404, message: "User not found" });
        }
    } catch (error) {
        console.error('Login error:', error);
        return next({ status: 401, message: "Incorrect email or password" });
    }
}));

// Centralized error handler
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace for debugging
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
