module.exports = async function (context, req) {
    const userMessage = req.body && req.body.message;

    if (!userMessage) {
        context.res = { status: 400, body: { reply: "Error: Please provide a message." } };
        return;
    }

    const endpoint = process.env.Endpoint; 
    const apiKey = process.env.API;

    try {
        // Use standard Chat Completions endpoint (instant and stable)
        const chatUrl = `${endpoint.replace(/\/$/, "")}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01`;

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: { 
                'api-key': apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are HackXperience AI, a helpful assistant for mental wellness and project guidance." },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7
            })
        });

        const rawText = await response.text();
        if (!rawText) throw new Error("Azure returned an empty response.");
        
        const data = JSON.parse(rawText);

        if (data.error) {
            throw new Error(data.error.message);
        }

        const replyText = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : "No response generated.";

        context.res = { body: { reply: replyText } };

    } catch (error) {
        context.res = { 
            status: 500, 
            body: { reply: "Connection Error: " + error.message } 
        };
    }
};
