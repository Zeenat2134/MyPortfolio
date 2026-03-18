require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- DATABASE SETUP ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Cloud!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Blueprint for Portfolio Data
const PortfolioSchema = new mongoose.Schema({
    skills: { type: Object, default: {} },
    projects: { type: Array, default: [] },
    certs: { type: Array, default: [] },
    achievements: { type: Array, default: [] }
});
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

// NEW: Blueprint for Contact Messages
const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
    date: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model('ContactMessage', ContactSchema);

// --- API ROUTES ---

// 1. Fetch Portfolio Data
app.get('/api/portfolio', async (req, res) => {
    try {
        const data = await Portfolio.findOne(); 
        if (data) res.json(data);
        else res.status(404).json({ message: "No data found yet." });
    } catch (err) {
        res.status(500).json({ error: "Server Error fetching data" });
    }
});

// 2. Save Portfolio Data (Admin Only)
app.post('/api/portfolio', async (req, res) => {
    const { newData, secretKey } = req.body;
    if (secretKey !== 'zeenat21') return res.status(403).json({ error: 'Unauthorized: Invalid Key' });

    try {
        await Portfolio.findOneAndUpdate({}, newData, { upsert: true, new: true });
        console.log("Portfolio successfully saved to MongoDB!");
        res.json({ message: 'Portfolio updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to database" });
    }
});

// 3. NEW: Receive and Save Contact Messages
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Save it to MongoDB!
        const newMessage = new ContactMessage({ name, email, subject, message });
        await newMessage.save();
        
        console.log(`📩 New message received from: ${name} (${email})`);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
        console.error("Failed to save message:", err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
});