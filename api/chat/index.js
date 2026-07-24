module.exports = async function (context, req) {
    const userMessage = req.body && req.body.message;
    if (!userMessage) {
        context.res = { status: 400, body: { reply: "Please provide a message." } };
        return;
    }

    const endpoint = process.env.Endpoint; 
    const apiKey = process.env.API;
    const deploymentName = process.env.gpt5.6 || "gpt-5.6-sol"; // Fallback to your model name

    if (!endpoint || !apiKey) {
        context.res = { body: { reply: "Configuration Error: Endpoint or API key missing in environment variables." } };
        return;
    }

    try {
        const cleanEndpoint = endpoint.replace(/\/$/, "");
        const chatUrl = `${cleanEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: { 
                'api-key': apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are an AI assistant that helps people find information." },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7
            })
        });

        const rawText = await response.text();
        if (!response.ok) {
            context.res = { body: { reply: `Azure API Error (${response.status}): ${rawText}` } };
            return;
        }

        const data = JSON.parse(rawText);
        const replyText = data.choices?.[0]?.message?.content || "No response generated.";

        context.res = { body: { reply: replyText } };
    } catch (error) {
        context.res = { body: { reply: "Server Error: " + error.message } };
    }
};
