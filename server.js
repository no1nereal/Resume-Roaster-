const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting middleware - 20 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: { error: 'Too many requests. Please try again in 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(cors());
// Increase payload limit and add error handling
app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch(e) {
            res.status(400).json({ error: 'Invalid JSON payload' });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.static(path.join(__dirname)));

// Apply rate limiting to the API endpoint
app.use('/api/roast', limiter);

// OpenAI API proxy endpoint
app.post('/api/roast', async (req, res) => {
    try {
        // Validate request body
        if (!req.body || !req.body.messages) {
            throw new Error('Invalid request format');
        }

        // Check if this is a vision request (has image content)
        const isVisionRequest = req.body.messages?.some(msg => 
            msg.content?.some?.(content => content.type === 'image_url')
        );

        const model = isVisionRequest ? 'gpt-4-vision-preview' : 'gpt-4';
        const maxTokens = isVisionRequest ? 1000 : 500;

        console.log('Processing request with model:', model);
        if (isVisionRequest) {
            console.log('Vision request detected');
        }

        const openAIRequest = {
            ...req.body,
            model: model,
            max_tokens: maxTokens
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(openAIRequest)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API Error:', error);
            throw new Error(error.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(error.status || 500).json({ 
            error: 'Failed to process request: ' + error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 