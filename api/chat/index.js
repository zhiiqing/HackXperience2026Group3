module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    const endpoint = process.env.Endpoint;
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; // Matches your environment variable

    try {
        // 1. Create thread and run in a single request, passing the agentId directly
        const runRes = await fetch(`${endpoint}/openai/threads/runs?api-version=2024-05-01-preview`, {
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

        const runData = await runRes.json();
        if (!runData.id || !runData.thread_id) {
            throw new Error(runData.error ? runData.error.message : "Failed to start assistant run.");
        }

        const threadId = runData.thread_id;
        const runId = runData.id;

        // 2. Poll until the run is completed (up to 15 seconds)
        let status = runData.status;
        let attempts = 0;
        
        while (status !== "completed" && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            const statusRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=2024-05-01-preview`, {
                method: 'GET',
                headers: { 'api-key': apiKey }
            });
            const statusData = await statusRes.json();
            status = statusData.status;

            if (status === "failed" || status === "cancelled" || status === "expired") {
                throw new Error("Agent execution failed with status: " + status);
            }
        }

        if (status !== "completed") {
            throw new Error("Run timed out.");
        }

        // 3. Retrieve the messages from the thread to get the agent's reply
        const messagesRes = await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=2024-05-01-preview`, {
            method: 'GET',
            headers: { 'api-key': apiKey }
        });
        const messagesData = await messagesRes.json();
        
        // Extract the latest assistant message
        const assistantMessage = messagesData.data.find(m => m.role === "assistant");
        const replyText = assistantMessage ? assistantMessage.content[0].text.value : "No response generated.";

        context.res = { body: { reply: replyText } };

    } catch (error) {
        context.res = { status: 500, body: { reply: "Agent Error: " + error.message } };
    }
};
