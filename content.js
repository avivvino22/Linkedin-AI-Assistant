console.log("LinkedIn AI Response Extension Loaded");

function sendAIRequest(postStringData, post, button) {
    if (!postStringData) {
        console.log("No post content found.");
        return;
    }

    button.innerText = "⏳ Generating...";
    button.disabled = true;

    chrome.storage.local.get(["openaiApiKey", "chatgptModel"], function (data) {
        if (!data.openaiApiKey) {
            displayMessageInCommentBox(post, "⚠️ Please set your OpenAI API key in the extension settings.");
            button.innerText = "✨ AI Response";
            button.disabled = false;
            return;
        }

        chrome.runtime.sendMessage(
            {
                action: "generateAIResponse",
                postContent: postStringData,
                apiKey: data.openaiApiKey,
                model: data.chatgptModel
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError.message);
                    button.innerText = "✨ AI Response";
                    button.disabled = false;
                    return;
                }

                if (response && response.aiResponse) {
                    console.log("✅ AI Response:", response.aiResponse);
                    injectAIResponseIntoComment(post, response.aiResponse);
                } else {
                    console.error("❌ Failed to get AI response.");
                    displayMessageInCommentBox(post, "❌ Error generating response.");
                }

                button.innerText = "✨ AI Response";
                button.disabled = false;
            }
        );
    });
}

function openCommentBox(post) {
    const commentButton = post.querySelector("button.comment-button");
    if (commentButton) {
        commentButton.click();
        console.log("✅ Comment box opened.");
    } else {
        console.warn("⚠️ Comment button not found.");
    }
}

function injectAIResponseIntoComment(post, aiResponse) {
    let attempt = 0;
    const maxAttempts = 5; // Retry 5 times

    function tryInject() {
        let commentBox = post.querySelector(".editor-content .ql-editor");

        if (!commentBox && attempt < maxAttempts) {
            openCommentBox(post);
            attempt++;
            console.warn(`⏳ Waiting for comment box... Attempt ${attempt}/${maxAttempts}`);

            // Retry after 500ms
            setTimeout(tryInject, 500);
        } else if (commentBox) {
            insertText(commentBox, aiResponse);
        } else {
            console.error("❌ Could not find comment box after multiple attempts.");
        }
    }

    tryInject();
}

function insertText(commentBox, text) {
    commentBox.focus();
    document.execCommand("insertText", false, text);
    console.log("✅ Injected AI Response into comment box.");
}

function displayMessageInCommentBox(post, message) {
    openCommentBox(post);
    setTimeout(() => {
        let commentBox = post.querySelector(".editor-content .ql-editor");
        if (commentBox) {
            insertText(commentBox, message);
        }
    }, 1000);
}

function extractPostContent(post) {
    let postStringData = "";

    const standardPostContent = post.querySelector("span.break-words.tvm-parent-container");
    if (standardPostContent) {
        postStringData = standardPostContent.innerText.trim();
    }

    if (!postStringData) {
        const aggregatedPostContent = post.querySelector(".update-components-text span.break-words");
        if (aggregatedPostContent) {
            postStringData = aggregatedPostContent.innerText.trim();
        }
    }

    if (!postStringData) {
        const searchResultPostContent = post.querySelector(".feed-shared-inline-show-more-text span.break-words");
        if (searchResultPostContent) {
            postStringData = searchResultPostContent.innerText.trim();
        }
    }

    if (!postStringData) {
        const aggregatePostContent = post.querySelector(".feed-shared-update-v2 .break-words");
        if (aggregatePostContent) {
            postStringData = aggregatePostContent.innerText.trim();
        }
    }

    return postStringData;
}

function injectAIButton(post) {
    const socialActionBar = post.querySelector(".feed-shared-social-action-bar");

    if (socialActionBar && !post.querySelector(".ai-response-main-container")) {
        // Create AI Response Container
        const aiResponseContainer = document.createElement("div");
        aiResponseContainer.classList.add("ai-response-main-container");

        // Create AI Response Button
        const button = document.createElement("button");
        button.innerText = "✨ AI Response";
        button.className = "sticky"; // THe original class name is: ai-response-btn artdeco-button artdeco-button--muted artdeco-button--3 artdeco-button--tertiary
        button.style.cssText = `
          background: linear-gradient(135deg, #0073b1 0%, #004b79 100%);
          color: white;
          font-weight: bold;
          border: none;
          cursor: pointer;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          width: 100%;
          max-width: 180px;
          border-radius: 20px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        `;

        button.addEventListener("mouseover", function() {
          button.style.background = "linear-gradient(135deg, #005582 0%, #003a5c 100%)";
          button.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
        });

        button.addEventListener("mouseleave", function() {
          button.style.background = "linear-gradient(135deg, #0073b1 0%, #004b79 100%)";
          button.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
        });

        button.addEventListener("click", function () {
            let postStringData = extractPostContent(post);

            if (postStringData) {
                console.log("📌 Extracted Post Data:", postStringData);
                sendAIRequest(postStringData, post, button);
            } else {
                console.warn("⚠️ No post content detected.");
                displayMessageInCommentBox(post, "⚠️ Unable to extract post content.");
            }
        });

        // Append button to container
        aiResponseContainer.appendChild(button);

        // Add space between LinkedIn buttons and AI Response button
        socialActionBar.style.marginBottom = "10px";

        // Insert AI response container under the social action bar
        socialActionBar.insertAdjacentElement("afterend", aiResponseContainer);

        console.log("✅ Injected AI Response button inside AI Response Container.");
    }
}


function scanAndInjectButtons() {
    const postRegex = /^urn:li:(activity|aggregate):\d+/;
    const posts = document.querySelectorAll("div[data-id], li.search-results__search-feed-update, div.feed-shared-update-v2");

    posts.forEach((post) => {
        const dataId = post.getAttribute("data-id");
        if (postRegex.test(dataId) || post.classList.contains("search-results__search-feed-update") || post.classList.contains("feed-shared-update-v2")) {
            injectAIButton(post);
        }
    });

    console.log("🔍 Scanning and injecting buttons in all found posts...");
}

// Run scanning function periodically
setInterval(scanAndInjectButtons, 1000);
setTimeout(scanAndInjectButtons, 2000);
