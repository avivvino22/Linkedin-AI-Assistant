chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generateAIResponse") {
        chrome.storage.local.get(["openaiApiKey", "chatgptModel"], async function (data) {
            const apiKey = data.openaiApiKey;
            const model = data.chatgptModel || "gpt-4o"; // Default to GPT-4o if not set

            if (!apiKey) {
                console.error("No OpenAI API key found in storage.");
                sendResponse({ aiResponse: "❌ Please enter your OpenAI API key in settings." });
                return;
            }

            try {
                const aiReply = await generateAIResponse(request.postContent, apiKey, model);
                sendResponse({ aiResponse: aiReply });
            } catch (error) {
                console.error("Error fetching AI response:", error);
                sendResponse({ aiResponse: "⚠️ Error generating response." });
            }
        });

        return true; // Required to keep sendResponse alive for async calls
    }
});

async function generateAIResponse(postStringData, apiKey, model) {
    if (!postStringData) {
        return "⚠️ No post content provided.";
    }

    const systemMessage = `
    You are a skilled professional in crafting engaging and thoughtful replies to LinkedIn posts. Your job is to write responses that feel natural, add value to the conversation, and align with the original post’s tone. Keep it concise, insightful, and professional while making sure it encourages engagement.

    **Guidelines:**
      - Keep responses short and clean.
      - Write like a human, avoiding robotic or overly structured phrasing.
      - Maintain a natural and professional conversational tone.
      - Offer meaningful insights instead of generic compliments.
      - Ensure flawless grammar and an engaging tone.
      - Avoid hashtags, excessive emojis, or AI-like phrasing.

    Given the following LinkedIn post, generate a thoughtful and engaging response that enhances the discussion.
  `;

    const requestBody = {
        model: model, // Uses the user-selected ChatGPT model
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: postStringData }
        ],
        max_tokens: 1000,
        temperature: 0.7
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.choices[0]?.message?.content.trim() || "⚠️ No response generated.";
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "❌ Failed to fetch AI response.";
    }
}