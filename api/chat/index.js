module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    const endpoint = process.env.Endpoint;
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot;

    try {
        // Using a widely supported preview api-version
        const apiVersion = "2024-02-15-preview";

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

        const runData = await runRes.json();
        if (!runData.id || !runData.thread_id) {
            throw new Error(runData.error ? runData.error.message : "Failed to start assistant run.");
        }

        const threadId = runData.thread_id;
        const runId = runData.id;

        // Poll until completion
        let status = runData.status;
        let attempts = 0;
        
        while (status !== "completed" && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            const statusRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=${apiVersion}`, {
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

        // Retrieve messages
        const messagesRes = await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=${apiVersion}`, {
            method: 'GET',
            headers: { 'api-key': apiKey }
        });
        const messagesData = await messagesRes.json();
        
        const assistantMessage = messagesData.data.find(m => m.role === "assistant");
        const replyText = assistantMessage ? assistantMessage.content[0].text.value : "No response generated.";

        context.res = { body: { reply: replyText } };

    } catch (error) {
        context.res = { status: 500, body: { reply: "Agent Error: " + error.message } };
    }
};
