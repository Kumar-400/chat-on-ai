const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const chatHistoryList = document.getElementById('chatHistoryList');
const newChatButton = document.getElementById('newChatButton');
const clearButton = document.getElementById('clearButton');
const themeToggle = document.getElementById('themeToggle');
const loadingSpinner = document.getElementById('loadingSpinner');

let chatHistory = [];
let savedChats = [];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = "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";

const API_HEADERS = {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
};

// Show loading spinner
const showLoadingSpinner = () => {
    loadingSpinner.style.display = 'block';
};

// Hide loading spinner
const hideLoadingSpinner = () => {
    loadingSpinner.style.display = 'none';
};

// Show typing indicator
const showTyping = () => {
    typingIndicator.style.display = 'flex';
};

// Hide typing indicator
const hideTyping = () => {
    typingIndicator.style.display = 'none';
};

// Send message to assistant
const sendMessage = async () => {
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user-message');
    userInput.value = '';
    updateSendButtonState();

    chatHistory.push({ role: 'user', content: message });

    showLoadingSpinner();
    showTyping();

    try {
        const response = await axios.post(GROQ_API_URL, {
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Use markdown for formatting, including tables and code blocks. Use LaTeX for mathematical expressions, enclosed in $$ for display math or $ for inline math.' },
                ...chatHistory
            ],
            model: 'llama-3.1-70b-versatile',
            temperature: 0.5,
            max_tokens: 1024
        }, { headers: API_HEADERS });

        const assistantMessage = response.data.choices?.[0]?.message?.content;
        if (assistantMessage) {
            addFormattedMessageToChat(assistantMessage, 'assistant-message');
            chatHistory.push({ role: 'assistant', content: assistantMessage });
            updateClearButtonState();
            updateChatTitle(getChatTitle());
        } else {
            addMessageToChat("Sorry, I couldn't generate a response. Please try again.", 'assistant-message');
        }
    } catch (error) {
        console.error('API Error:', error);
        addMessageToChat("Sorry, I encountered an error. Please try again later.", 'assistant-message');
    } finally {
        hideLoadingSpinner();
        hideTyping();
        updateClearButtonState();
    }
};

// Add plain message to chat
const addMessageToChat = (message, className) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    msgDiv.textContent = message;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Add formatted message with markdown and code highlighting
const addFormattedMessageToChat = (message, className) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    msgDiv.innerHTML = marked.parse(message);
    renderMathInElement(msgDiv, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
    });

    // Add copy buttons to code blocks
    msgDiv.querySelectorAll('pre code').forEach(codeBlock => {
        codeBlock.classList.add('hljs');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeBlock);
        }
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(codeBlock.textContent);
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        };
        codeBlock.parentNode.insertBefore(copyBtn, codeBlock);
    });

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Clear chat messages
const clearChat = () => {
    chatMessages.innerHTML = '';
    chatHistory = [];
    addWelcomeMessage();
    updateChatTitle('New Chat');
    updateClearButtonState();
};

// Add welcome message
const addWelcomeMessage = () => {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.classList.add('welcome-message');
    welcomeDiv.innerHTML = `
        <h2>Welcome to ChatOn AI Assistant! 👋</h2>
        <p>How can I help you today? Here are some suggestions:</p>
        <ul>
            <li>Explain quantum computing</li>
            <li>Write a short story about time travel</li>
            <li>Tips for improving productivity</li>
            <li>Best practices for sustainable living</li>
        </ul>
    `;
    chatMessages.appendChild(welcomeDiv);

    // Add event listeners to suggestion items
    welcomeDiv.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            userInput.value = item.textContent;
            sendMessage();
        });
    });
};

// Update send button state based on input
const updateSendButtonState = () => {
    sendButton.disabled = userInput.value.trim() === '';
    sendButton.style.opacity = sendButton.disabled ? '0.5' : '1';
};

// Update clear button state
const updateClearButtonState = () => {
    clearButton.disabled = chatMessages.childElementCount === 0 || !!document.querySelector('.welcome-message');
    clearButton.style.cursor = clearButton.disabled ? 'not-allowed' : 'pointer';
};

// Get chat title based on first message
const getChatTitle = () => {
    if (chatHistory.length > 0) {
        const firstMsg = chatHistory[0].content;
        return firstMsg.length > 30 ? `${firstMsg.slice(0, 30)}...` : firstMsg;
    }
    return 'New Chat';
};

// Update chat header title
const updateChatTitle = (title) => {
    const chatTitle = document.getElementById('currentChatTitle');
    if (chatTitle) {
        chatTitle.textContent = title;
    }
};

// Toggle dark mode
const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    const themeIcon = themeToggle.querySelector('i');
    themeIcon.classList.toggle('fa-moon');
    themeIcon.classList.toggle('fa-sun');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};

// Load dark mode preference
const loadDarkModePreference = () => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
};

// Event listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('input', updateSendButtonState);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
clearButton.addEventListener('click', clearChat);
themeToggle.addEventListener('click', toggleDarkMode);
newChatButton.addEventListener('click', () => {
    if (chatHistory.length > 0) {
        const title = getChatTitle();
        savedChats.unshift({ title, history: [...chatHistory] });
        renderChatHistory();
    }
    clearChat();
});

// Initialize chat with welcome message
const initializeChat = () => {
    clearChat();
    loadDarkModePreference();
};

// Render chat history
const renderChatHistory = () => {
    chatHistoryList.innerHTML = '';
    if (savedChats.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No saved chats';
        chatHistoryList.appendChild(li);
    } else {
        savedChats.forEach((chat, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="chat-title">${chat.title}</span>
                <div class="chat-actions">
                    <button class="view" aria-label="View Chat"><i class="fas fa-eye"></i></button>
                    <button class="rename" aria-label="Rename Chat"><i class="fas fa-edit"></i></button>
                    <button class="delete" aria-label="Delete Chat"><i class="fas fa-trash"></i></button>
                </div>
            `;
            chatHistoryList.appendChild(li);

            li.querySelector('.chat-title').addEventListener('click', () => loadChatHistory(index));
            li.querySelector('.view').addEventListener('click', () => loadChatHistory(index));
            li.querySelector('.rename').addEventListener('click', (e) => {
                e.stopPropagation();
                renameChatHistoryItem(index);
            });
            li.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChatHistoryItem(index);
            });
        });
    }
};

// Load specific chat history
const loadChatHistory = (index) => {
    const chat = savedChats[index];
    chatMessages.innerHTML = '';
    chatHistory = [...chat.history];
    chat.history.forEach(message => {
        addFormattedMessageToChat(message.content, message.role === 'user' ? 'user-message' : 'assistant-message');
    });
    updateChatTitle(chat.title);
    updateClearButtonState();
};

// Rename chat history item
const renameChatHistoryItem = (index) => {
    const newTitle = prompt('Enter new title:', savedChats[index].title);
    if (newTitle) {
        savedChats[index].title = newTitle;
        renderChatHistory();
    }
};

// Delete chat history item
const deleteChatHistoryItem = (index) => {
    if (confirm('Are you sure you want to delete this chat?')) {
        savedChats.splice(index, 1);
        renderChatHistory();
    }
};

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', initializeChat);

// Initialize Speech Recognition
const micButton = document.getElementById('micButton');
let recognition;
let recognizing = false;

// Check for browser support
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // When recognition starts
    recognition.onstart = () => {
        recognizing = true;
        micButton.classList.add('listening');
        micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>'; // Change icon to indicate listening
        micButton.setAttribute('aria-pressed', 'true');
    };

    // When a result is returned
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value += transcript;
        updateSendButtonState();
    };

    // Handle errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert('Speech recognition error: ' + event.error);
    };

    // When recognition ends
    recognition.onend = () => {
        recognizing = false;
        micButton.classList.remove('listening');
        micButton.innerHTML = '<i class="fas fa-microphone"></i>'; // Revert icon back
        micButton.setAttribute('aria-pressed', 'false');
    };

    // Toggle recognition on mic button click
    micButton.addEventListener('click', () => {
        if (recognizing) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
} else {
    // If Speech Recognition is not supported
    micButton.disabled = true;
    micButton.title = 'Speech Recognition not supported in this browser';
    micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
}