module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    const endpoint = process.env.Endpoint;
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; // Matches your environment variable for the agent

    try {
        // 1. Create a thread
        const threadRes = await fetch(`${endpoint}/openai/threads?api-version=2024-05-01-preview`, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
        });
        const threadData = await threadRes.json();
        if (!threadData.id) throw new Error("Could not create thread.");
        const threadId = threadData.id;

        // 2. Post user message to the thread
        await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=2024-05-01-preview`, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: "user", content: userMessage })
        });

        // 3. Create a run for the specific Agent ID
        const runRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs?api-version=2024-05-01-preview`, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ assistant_id: agentId })
        });
        const runData = await runRes.json();
        if (!runData.id) throw new Error("Could not run the agent.");
        const runId = runData.id;

        // 4. Poll for completion (up to 15 seconds)
        let status = "queued";
        let attempts = 0;
        while ((status === "queued" || status === "in_progress") && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
            
            const statusRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=2024-05-01-preview`, {
                method: 'GET',
                headers: { 'api-key': apiKey }
            });
            const statusData = await statusRes.json();
            status = statusData.status;

            if (status === "completed") break;
            if (status === "failed" || status === "cancelled") {
                throw new Error("Agent run failed.");
            }
        }

        // 5. Retrieve the agent's response messages
        const messagesRes = await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=2024-05-01-preview`, {
            method: 'GET',
            headers: { 'api-key': apiKey }
        });
        const messagesData = await messagesRes.json();
        
        // Find the assistant's reply text
        const lastMessage = messagesData.data.find(m => m.role === "assistant");
        const replyText = lastMessage ? lastMessage.content[0].text.value : "No response generated.";

        context.res = { body: { reply: replyText } };

    } catch (error) {
        context.res = { status: 500, body: { reply: "Agent Error: " + error.message } };
    }
};
