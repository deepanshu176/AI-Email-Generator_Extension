console.log("Email Extractor Extension Loaded");

// Create the AI-Reply button
function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO vT-T-I-Js-Gz T-I-atl L3 ai-reply-button';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI-Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

// Get email content from Gmail
function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];

    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content && content.innerText.trim().length > 0) {
            return content.innerText.trim();
        }
    }

    return '';
}

// Find the toolbar in Gmail's compose window
function findComposeToolbar() {
    const selectors = [
        '.aDh', '.btC', '[role="toolbar"]', '.gU.Up'
    ];

    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }

    return null;
}

// Inject the AI-Reply button into the compose toolbar
function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    console.log("Toolbar found, creating AI button");
    const button = createAIButton();

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.setAttribute('disabled', true);

            const emailContent = getEmailContent();
            if (!emailContent) {
                alert("No email content found.");
                return;
            }

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailContent, tone: "professional" })
            });

            if (!response.ok) throw new Error('API request failed');

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error("Compose box not found");
            }

        } catch (error) {
            console.error(error);
            alert("Error generating reply");
        } finally {
            button.innerHTML = 'AI-Reply';
            button.removeAttribute('disabled');
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
}

// Observe the DOM for compose window changes
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches?.('.aDh, .btC, [role="dialog"]') || node.querySelector?.('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose elements detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
