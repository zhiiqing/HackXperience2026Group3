module.exports = async function (context, req) {
    const message = req.body.message;
    
    // Azure automatically looks for these Environment Variables
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    // Use fetch here to call your Foundry Agent's Thread ID
    // (This is the secure "phone call" to the brain)
    const response = await fetch(`${endpoint}/threads/.../messages`, {
        method: 'POST',
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
    });

    const result = await response.json();
    context.res = { body: { reply: result.message } };
};
