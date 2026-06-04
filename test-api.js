// IMPORTANT: Never commit API keys!
// Set GEMINI_API_KEY environment variable before running this test
if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable not set');
    console.error('Usage: GEMINI_API_KEY=your_key_here node test-api.js');
    process.exit(1);
}

const handler = require('./api/generate.js');

const mockReq = {
    method: 'POST',
    body: {
        masterCV: {
            personalInfo: {
                name: 'Oleh Kalchenko',
                email: 'test@test.com'
            }
        },
        jobDescription: 'Frontend Developer position at Test GmbH'
    }
};

const mockRes = {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(key, value) {
        this.headers[key] = value;
    },
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(data) {
        this.body = data;
        console.log('Status:', this.statusCode);
        console.log('Response:', JSON.stringify(data, null, 2));
    },
    end() {
        console.log('End called');
    }
};

handler(mockReq, mockRes);
