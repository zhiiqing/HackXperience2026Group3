module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    // Get your environment variables from Azure
    const endpoint = process.env.Endpoint;
    const apiKey = process.env.API;
    
    // Clean up the endpoint URL to make sure it points to the OpenAI inference route
    // If your endpoint is 'https://xxx.services.ai.azure.com/api/projects/hackathongroup3', 
    // we use standard chat completions deployment mapping.
    let baseEndpoint = endpoint.split('/api/projects/')[0];
    if (!baseEndpoint) {
        baseEndpoint = endpoint;
    }

    try {
        // Using the standard Azure OpenAI deployment chat completions route
        const response = await fetch(`${baseEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview`, {
            method: 'POST',
            headers: { 
                'api-key': apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a helpful, empathetic mental wellness and project assistant for HackXperience." },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 800
            })
        });

        const textResponse = await response.text();
        
        // Safety check to prevent JSON parsing crashes if Azure returns an empty or HTML error page
        if (!textResponse) {
            throw new Error("Received empty response from Azure server.");
        }

        const data = JSON.parse(textResponse);
        
        if (data.choices && data.choices.length > 0) {
            const replyText = data.choices[0].message.content;
            context.res = { body: { reply: replyText } };
        } else if (data.error) {
            context.res = { status: 500, body: { reply: "Azure Error: " + data.error.message } };
        } else {
            context.res = { status: 500, body: { reply: "Unexpected response structure from Azure." } };
        }

    } catch (error) {
        context.res = { status: 500, body: { reply: "Error: " + error.message } };
    }
};
