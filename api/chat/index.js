module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    // Using your exact variable names from the Azure Portal
    const endpoint = process.env.Endpoint;
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; // Change to process.env.ForumMod if you want the other agent!

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
