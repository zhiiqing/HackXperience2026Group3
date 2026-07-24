module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    const endpoint = process.env.Endpoint; // https://.../api/projects/hackathongroup3
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; // Your agent ID: af77a774-...

    try {
        // Foundry Agent Service endpoint pattern
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
            context.res = { status: 500, body: { reply: "Foundry Error: " + data.message } };
        } else {
            context.res = { status: 500, body: { reply: "Unexpected response format from Foundry agent." } };
        }

    } catch (error) {
        context.res = { status: 500, body: { reply: "Error: " + error.message } };
    }
};
