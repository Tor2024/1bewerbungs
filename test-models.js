const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('Set GEMINI_API_KEY before running this script.');
    process.exit(1);
}

const MODELS_TO_TEST = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash'
];

async function testModel(modelName) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Return only the word OK.' }]
                    }]
                })
            }
        );

        if (response.ok) {
            console.log(`${modelName}: works`);
            return modelName;
        }

        const error = await response.json();
        console.log(`${modelName}: ${error.error?.code || response.status} - ${error.error?.status || response.statusText}`);
        return null;
    } catch (error) {
        console.log(`${modelName}: ${error.message}`);
        return null;
    }
}

async function testAllModels() {
    const workingModels = [];

    for (const model of MODELS_TO_TEST) {
        const result = await testModel(model);
        if (result) {
            workingModels.push(result);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\nWorking models:');
    console.log(workingModels.length ? workingModels.join('\n') : 'none');
}

testAllModels();
