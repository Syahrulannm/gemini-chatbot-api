// DOM Elements
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// API endpoint
const API_ENDPOINT = "/api/chat";
const THINKING_MESSAGE = "Thinking...";
const ERROR_MESSAGE = "Failed to get response from server.";
const NO_RESULT_MESSAGE = "Sorry, no response received.";

// Track if a request is in progress
let isWaitingForResponse = false;

/**
 * Append a message to the chat box
 * @param {string} message - The message content
 * @param {string} role - 'user' or 'bot'
 * @returns {HTMLElement} - The message element created
 */
function appendMessage(message, role) {
  const messageElement = document.createElement("div");
  messageElement.className = `message ${role}`;
  messageElement.textContent = message;
  chatBox.appendChild(messageElement);

  // Auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;

  return messageElement;
}

/**
 * Build the conversation history from displayed messages
 * @returns {Array} - Array of message objects with role and content
 */
function buildConversationHistory() {
  const messages = chatBox.querySelectorAll(".message");
  const conversation = [];

  messages.forEach((msg) => {
    const role = msg.classList.contains("user") ? "user" : "bot";
    const content = msg.textContent;

    // Skip "Thinking..." messages - don't send temporary placeholders to API
    if (content === THINKING_MESSAGE) {
      return;
    }

    conversation.push({ role, content });
  });

  return conversation;
}

/**
 * Send message to the backend API
 * @param {Array} conversation - The conversation history
 * @returns {Promise<string>} - The AI response or error message
 */
async function sendMessageToAPI(conversation) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if result exists and is not empty
    if (!data.result || data.result.trim() === "") {
      return NO_RESULT_MESSAGE;
    }

    return data.result;
  } catch (error) {
    console.error("API Error:", error);
    return ERROR_MESSAGE;
  }
}

/**
 * Handle form submission
 * @param {Event} event - The form submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  // Prevent multiple submissions
  if (isWaitingForResponse) {
    return;
  }

  const userMessage = userInput.value.trim();

  // Validate input
  if (!userMessage) {
    return;
  }

  // Disable form while processing
  isWaitingForResponse = true;
  chatForm.querySelector("button").disabled = true;

  // Clear input field
  userInput.value = "";

  // Add user message to chat
  appendMessage(userMessage, "user");

  // Add thinking message and get its reference
  const thinkingElement = appendMessage(THINKING_MESSAGE, "bot");

  // Build conversation history including the new user message
  const conversation = buildConversationHistory();

  // Send to API and get response
  const aiResponse = await sendMessageToAPI(conversation);

  // Replace thinking message with actual response
  thinkingElement.textContent = aiResponse;

  // Re-enable form
  isWaitingForResponse = false;
  chatForm.querySelector("button").disabled = false;
  userInput.focus();
}

/**
 * Initialize the chat application
 */
function initializeChat() {
  chatForm.addEventListener("submit", handleFormSubmit);
  userInput.focus();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeChat);
} else {
  initializeChat();
}
