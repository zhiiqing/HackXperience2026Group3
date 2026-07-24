module.exports = async function (context, req) {
    const userMessage = req.body.message;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const agentId = process.env.AGENT_ID;

    try {
        const response = await fetch(`${endpoint}/openai/assistants/${agentId}/threads/messages`, {
            method: 'POST',
            headers: { 
                'api-key': apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ role: "user", content: userMessage })
        });

        const data = await response.json();
        context.res = { body: { reply: data.content[0].text.value } };
    } catch (error) {
        context.res = { status: 500, body: { reply: "Error: Could not reach the agent." } };
    }
};
