document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("apiKey");
    const modelSelect = document.getElementById("modelSelect");
    const saveButton = document.getElementById("saveSettings");

    // Load saved settings
    chrome.storage.local.get(["openaiApiKey", "chatgptModel"], function (data) {
        if (data.openaiApiKey) apiKeyInput.value = data.openaiApiKey;
        if (data.chatgptModel) modelSelect.value = data.chatgptModel;
    });

    // Save settings
    saveButton.addEventListener("click", function () {
        const apiKey = apiKeyInput.value.trim();
        const model = modelSelect.value;

        if (!apiKey) {
            alert("Please enter your OpenAI API Key.");
            return;
        }

        chrome.storage.local.set({ openaiApiKey: apiKey, chatgptModel: model }, function () {
            alert("Settings saved!");
        });
    });
});
