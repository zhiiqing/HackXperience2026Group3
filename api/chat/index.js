module.exports = async function (context, req) {
    const userMessage = req.body && req.body.message;

    if (!userMessage) {
        context.res = {
            status: 400,
            body: { reply: "Error: Please provide a message." }
        };
        return;
    }

    const endpoint = process.env.Endpoint; // https://hackathongroup3-resource.services.ai.azure.com/api/projects/hackathongroup3
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; // af77a774-aa5d-4dab-a688-799b9e80a80f

    try {
        // Correct endpoint path and API version (v1) for Azure AI Foundry Agent Service
        const response = await fetch(`${endpoint}/agents/${agentId}/completions?api-version=v1`, {
            method: 'POST',
            headers: { 
                'api-key': apiKey, 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const replyText = data.choices[0].message.content;
            context.res = { body: { reply: replyText } };
        } else if (data.message) {
            context.res = { status: 500, body: { reply: "Agent Error: " + data.message } };
        } else {
            context.res = { status: 500, body: { reply: "Unexpected response from your AI agent." } };
        }

    } catch (error) {
        context.res = {
            status: 500,
            body: { reply: "Agent Connection Error: " + error.message }
        };
    }
};
