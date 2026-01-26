/**
 * Insight AI - Document Intelligence
 * Frontend Chat Interface
 */

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("questionInput");
const sendBtn = document.getElementById("sendBtn");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");

const API_BASE = "http://localhost:8000";
const API_URL = `${API_BASE}/ask`;
const INGEST_URL = `${API_BASE}/ingest`;

/**
 * Creates a user avatar element
 */
function createUserAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;
  return avatar;
}

/**
 * Creates a bot avatar element
 */
function createBotAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  `;
  return avatar;
}

/**
 * Adds a user message to the chat
 */
function addUserMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message user message-enter";

  const avatar = createUserAvatar();

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatBox.appendChild(msg);
  smoothScrollToBottom();
}

/**
 * Formats a source object for display
 */
function formatSource(source) {
  if (typeof source === 'string') {
    return source;
  }

  let text = source.source || 'unknown';
  const parts = [];

  if (source.page) {
    parts.push(`p. ${source.page}`);
  }
  if (source.section) {
    parts.push(`"${source.section}"`);
  }

  if (parts.length > 0) {
    text += ` (${parts.join(', ')})`;
  }

  return text;
}

/**
 * Adds a bot response message to the chat
 */
function addBotMessage(answer, confidence, sources) {
  const msg = document.createElement("div");
  msg.className = "message bot message-enter";

  const avatar = createBotAvatar();

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  // Answer label
  const label = document.createElement("div");
  label.className = "answer-label";
  label.textContent = "Analysis Result";

  // Answer text
  const answerText = document.createElement("div");
  answerText.className = "answer-text";
  answerText.textContent = answer;

  bubble.appendChild(label);
  bubble.appendChild(answerText);

  // Confidence badge
  if (confidence !== undefined) {
    const conf = document.createElement("div");
    conf.className = "confidence-badge";
    conf.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22,4 12,14.01 9,11.01"/>
      </svg>
      Confidence: ${confidence}/10
    `;
    bubble.appendChild(conf);
  }

  // Sources section
  if (sources && sources.length > 0) {
    const srcTitle = document.createElement("div");
    srcTitle.className = "sources-title";
    srcTitle.textContent = "Referenced Sources";
    bubble.appendChild(srcTitle);

    const srcContainer = document.createElement("div");
    srcContainer.className = "sources-container";

    sources.forEach((src, index) => {
      const span = document.createElement("span");
      span.className = "source";

      const sourceText = formatSource(src);

      span.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        ${sourceText}
      `;
      srcContainer.appendChild(span);
    });

    bubble.appendChild(srcContainer);
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatBox.appendChild(msg);
  smoothScrollToBottom();
}

/**
 * Creates the DNA helix thinking indicator
 */
function createThinkingIndicator() {
  const msg = document.createElement("div");
  msg.className = "message bot message-enter";
  msg.id = "thinking-message";
  msg.setAttribute("role", "status");
  msg.setAttribute("aria-live", "polite");
  msg.setAttribute("aria-label", "Processing your query");

  const avatar = createBotAvatar();

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const indicator = document.createElement("div");
  indicator.className = "thinking-indicator";
  indicator.innerHTML = `
    <div class="dna-spinner" aria-hidden="true"></div>
    <div class="thinking-text">
      Analyzing documents
      <span class="thinking-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </div>
  `;

  bubble.appendChild(indicator);
  msg.appendChild(avatar);
  msg.appendChild(bubble);

  return msg;
}

/**
 * Announces a message to screen readers
 */
function announceToScreenReader(message) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);

  // Remove after announcement is made
  setTimeout(() => {
    announcement.remove();
  }, 1000);
}

/**
 * Smooth scroll to bottom of chat
 */
function smoothScrollToBottom() {
  chatBox.scrollTo({
    top: chatBox.scrollHeight,
    behavior: 'smooth'
  });
}

/**
 * Handles sending a question to the API
 */
async function sendQuestion() {
  const question = input.value.trim();
  if (!question) return;

  // Add user message
  addUserMessage(question);
  input.value = "";

  // Announce to screen readers
  announceToScreenReader("Message sent. Analyzing your query.");

  // Show thinking indicator
  const thinking = createThinkingIndicator();
  chatBox.appendChild(thinking);
  smoothScrollToBottom();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await response.json();

    // Remove thinking indicator
    const thinkingEl = document.getElementById("thinking-message");
    if (thinkingEl) {
      thinkingEl.remove();
    }

    // Add bot response
    addBotMessage(
      data.answer,
      data.confidence,
      data.sources
    );

    // Announce response to screen readers
    announceToScreenReader("New response received from Insight AI.");

    // Return focus to input for continued conversation
    input.focus();

  } catch (err) {
    // Remove thinking indicator
    const thinkingEl = document.getElementById("thinking-message");
    if (thinkingEl) {
      thinkingEl.remove();
    }

    // Show error message
    addBotMessage(
      "Unable to connect to the analysis server. Please ensure the backend service is running and try again.",
      1,
      []
    );

    // Announce error to screen readers
    announceToScreenReader("Error: Unable to connect to the analysis server.");

    // Return focus to input
    input.focus();
  }
}

// ===== File Upload =====

/**
 * Updates the upload status display
 */
function updateUploadStatus(message, type = 'info') {
  uploadStatus.textContent = message;
  uploadStatus.className = `upload-status ${type}`;
}

/**
 * Polls job status until completion
 */
async function pollJobStatus(jobId) {
  const maxAttempts = 60;
  const pollInterval = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${INGEST_URL}/${jobId}/status`);
      const data = await response.json();

      if (data.status === 'completed') {
        updateUploadStatus(`Ingested ${data.chunks_added} chunks from ${data.filename}`, 'success');
        return data;
      } else if (data.status === 'failed') {
        updateUploadStatus(`Error: ${data.error || 'Ingestion failed'}`, 'error');
        return data;
      } else {
        updateUploadStatus(`Processing ${data.filename}...`, 'info');
      }
    } catch (err) {
      console.error('Error polling job status:', err);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  updateUploadStatus('Ingestion timeout - please check server logs', 'error');
  return null;
}

/**
 * Uploads a file and starts ingestion
 */
async function uploadFile(file) {
  if (!file) return;

  // Validate file type
  const validTypes = ['.pdf', '.txt'];
  const fileExt = '.' + file.name.split('.').pop().toLowerCase();
  if (!validTypes.includes(fileExt)) {
    updateUploadStatus('Only PDF and TXT files are supported', 'error');
    return;
  }

  updateUploadStatus(`Uploading ${file.name}...`, 'info');
  dropzone.classList.add('uploading');

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(INGEST_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    const data = await response.json();
    updateUploadStatus(`Ingestion started for ${file.name}`, 'info');

    // Poll for completion
    await pollJobStatus(data.job_id);

  } catch (err) {
    console.error('Upload error:', err);
    updateUploadStatus(`Error: ${err.message}`, 'error');
  } finally {
    dropzone.classList.remove('uploading');
  }
}

// Dropzone event handlers
dropzone.addEventListener('click', () => {
  fileInput.click();
});

dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadFile(file);
  }
  fileInput.value = '';
});

// Drag and drop handlers
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    uploadFile(files[0]);
  }
});

// Event listeners
sendBtn.addEventListener("click", sendQuestion);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendQuestion();
  }
});

// ===== Theme Switching =====
const themeToggle = document.querySelector('.theme-toggle');
const themeMenu = document.querySelector('.theme-menu');
const themeOptions = document.querySelectorAll('.theme-option');

/**
 * Sets the application theme
 */
function setTheme(theme) {
  // Sunset is the default theme (no data-theme attribute needed)
  if (theme === 'sunset') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  localStorage.setItem('theme', theme);

  // Update active state on theme options
  themeOptions.forEach(option => {
    if (option.dataset.theme === theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

/**
 * Toggles the theme menu open/closed
 */
function toggleThemeMenu() {
  const isOpen = themeMenu.classList.toggle('open');
  themeToggle.classList.toggle('active', isOpen);
  themeToggle.setAttribute('aria-expanded', isOpen);
}

/**
 * Closes the theme menu
 */
function closeThemeMenu() {
  themeMenu.classList.remove('open');
  themeToggle.classList.remove('active');
  themeToggle.setAttribute('aria-expanded', 'false');
}

// Theme toggle click handler
themeToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleThemeMenu();
});

// Theme option click handlers
themeOptions.forEach(option => {
  option.addEventListener('click', () => {
    setTheme(option.dataset.theme);
    closeThemeMenu();
  });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!themeToggle.contains(e.target) && !themeMenu.contains(e.target)) {
    closeThemeMenu();
  }
});

// Keyboard navigation for theme menu
themeToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleThemeMenu();
  } else if (e.key === 'Escape') {
    closeThemeMenu();
    themeToggle.focus();
  }
});

themeMenu.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeThemeMenu();
    themeToggle.focus();
  }
});

// Focus input on page load and initialize theme
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme from localStorage or default to sunset
  const savedTheme = localStorage.getItem('theme') || 'sunset';
  setTheme(savedTheme);

  input.focus();
});
