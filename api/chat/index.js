module.exports = async function (context, req) {
    const userMessage = req.body.message;
    
    const endpoint = process.env.Endpoint;
    const apiKey = process.env.API;
    const agentId = process.env.AIChatbot; // Uses your AIChatbot variable

    try {
        // 1. Create a new thread
        const threadRes = await fetch(`${endpoint}/openai/threads?api-version=2024-05-01-preview`, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
        });
        const threadData = await threadRes.json();
        const threadId = threadData.id;

        // 2. Add the user message to the thread
        await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=2024-05-01-preview`, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: "user", content: userMessage })
        });

        // 3. Run the assistant on the thread
        const runRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs?api-version=2024-05-01-preview`, {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ assistant_id: agentId })
        });
        const runData = await runRes.json();
        const runId = runData.id;

        // 4. Poll until the run is completed
        let status = "in_progress";
        let assistantReply = "Sorry, I couldn't get a response.";
        
        while (status === "in_progress" || status === "queued") {
            await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
            const checkRes = await fetch(`${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=2024-05-01-preview`, {
                method: 'GET',
                headers: { 'api-key': apiKey }
            });
            const checkData = await checkRes.json();
            status = checkData.status;

            if (status === "completed") {
                // 5. Get the messages from the thread
                const msgRes = await fetch(`${endpoint}/openai/threads/${threadId}/messages?api-version=2024-05-01-preview`, {
                    method: 'GET',
                    headers: { 'api-key': apiKey }
                });
                const msgData = await msgRes.json();
                assistantReply = msgData.data[0].content[0].text.value;
            } else if (status === "failed" || status === "cancelled") {
                break;
            }
        }

        context.res = { body: { reply: assistantReply } };
    } catch (error) {
        context.res = { status: 500, body: { reply: "Error: " + error.message } };
    }
};
