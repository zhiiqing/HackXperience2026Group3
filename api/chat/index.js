module.exports = async function (context, req) {
    const userMessage = req.body && req.body.message;

    if (!userMessage) {
        context.res = { status: 400, body: { reply: "Error: Please provide a message." } };
        return;
    }

    const endpoint = process.env.Endpoint; 
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; 

    try {
        const apiVersion = "2024-05-01-preview";

        // 1. Create a thread and run the agent in a single call
        const runRes = await fetch(`${endpoint}/openai/threads/runs?api-version=${apiVersion}`, {
            method: 'POST',
            headers: { 
                'api-key': apiKey, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                assistant_id: agentId,
                thread: {
                    messages: [
                        { role: "user", content: userMessage }
                    ]
                }
            })
        });

        const rawText = await runRes.text();
        if (!rawText) throw new Error("Azure returned an empty response during run creation.");
        const runData = JSON.parse(rawText);
        
        if (!runData.id || !runData.thread_id) {
            throw new Error(runData.error ? runData.error.message : "Failed to start agent thread.");
        }

        const threadId = runData.thread_id;
        const runId = runData.id;

        // 2. Poll until the agent completes your request
        let status = runData.status;
        let attempts = 0;
        
        while (status !== "completed" && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            const statusRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=${apiVersion}`, {
                method: 'GET',
                headers: { 'api-key': apiKey }
            });
            const statusText = await statusRes.text();
            if (!statusText) continue;
            
            const statusData = JSON.parse(statusText);
            status = statusData.status;

            if (status === "failed" || status === "cancelled" || status === "expired") {
                throw new Error("Agent run failed with status: " + status);
            }
        }

        if (status !== "completed") {
            throw new Error("Agent response timed out.");
        }

        // 3. Fetch messages from the completed thread
        const messagesRes = await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=${apiVersion}`, {
            method: 'GET',
            headers: { 'api-key': apiKey }
        });
        const messagesText = await messagesRes.text();
        if (!messagesText) throw new Error("Failed to retrieve messages from thread.");
        
        const messagesData = JSON.parse(messagesText);
        const assistantMessage = messagesData.data.find(m => m.role === "assistant");
        
        const replyText = assistantMessage ? assistantMessage.content[0].text.value : "No response generated.";

        context.res = { body: { reply: replyText } };

    } catch (error) {
        context.res = { 
            status: 500, 
            body: { reply: "Agent Connection Error: " + error.message } 
        };
    }
};
