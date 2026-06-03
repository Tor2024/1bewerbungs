process.env.GEMINI_API_KEY = 'AIzaSyDq7FNnypiK7DVuv3LDkzg9LRz_rm1zv3s';

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
