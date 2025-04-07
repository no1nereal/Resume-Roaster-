import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required but not set in environment variables');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({
    limit: '1mb' // Limit payload size
}));
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// API Routes
app.post('/api/roast', async (req, res) => {
    try {
        const body = req.body;
        
        if (!body?.messages || !Array.isArray(body.messages)) {
            return res.status(400).json({
                error: 'Invalid request: messages array is required'
            });
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: body.messages,
                temperature: body.temperature || 0.7,
                max_tokens: body.max_tokens || 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenAI API Error:', data);
            return res.status(response.status).json({
                error: data.error?.message || 'OpenAI API request failed'
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 