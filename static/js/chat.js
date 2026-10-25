/**
 * CareerX Career Assistant & Placement Coach
 * Client Script (chat.js)
 */

document.addEventListener('DOMContentLoaded', function () {
    let currentSessionId = null;
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesStream = document.getElementById('chatMessagesStream');
    const messagesList = document.getElementById('messagesList');
    const welcomeBanner = document.getElementById('chatWelcomeBanner');
    const typingIndicator = document.getElementById('typingIndicator');
    const roleSelect = document.getElementById('chatRoleSelect');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const chatSidebar = document.getElementById('chatSidebar');
    const chatSessionsList = document.getElementById('chatSessionsList');

    // Determine initial active session if one exists
    const firstSessionEl = document.querySelector('.chat-session-item.active') || document.querySelector('.chat-session-item');
    if (firstSessionEl) {
        currentSessionId = parseInt(firstSessionEl.getAttribute('data-session-id'), 10);
        loadSessionMessages(currentSessionId);
    }

    // Auto-expand textarea on typing
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 140) + 'px';
        sendBtn.disabled = this.value.trim() === '';
    });

    // Enter to send (Shift+Enter for newline)
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() !== '') {
                submitChatMessage();
            }
        }
    });

    // Mobile sidebar toggle
    if (sidebarToggleBtn && chatSidebar) {
        sidebarToggleBtn.addEventListener('click', function () {
            chatSidebar.classList.toggle('open');
        });
    }

    // New Chat Button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function () {
            currentSessionId = null;
            document.querySelectorAll('.chat-session-item').forEach(el => el.classList.remove('active'));
            messagesList.innerHTML = '';
            welcomeBanner.style.display = 'block';
            chatInput.value = '';
            chatInput.style.height = 'auto';
            chatInput.focus();
            if (chatSidebar.classList.contains('open')) {
                chatSidebar.classList.remove('open');
            }
        });
    }

    // Reset / Clear messages in view
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', function () {
            messagesList.innerHTML = '';
            welcomeBanner.style.display = 'block';
        });
    }

    // Bind existing session clicks
    setupSessionClickHandlers();

    function setupSessionClickHandlers() {
        document.querySelectorAll('.chat-session-item').forEach(item => {
            item.onclick = function () {
                const sId = parseInt(this.getAttribute('data-session-id'), 10);
                if (sId !== currentSessionId) {
                    document.querySelectorAll('.chat-session-item').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                    currentSessionId = sId;
                    loadSessionMessages(sId);
                }
                if (chatSidebar.classList.contains('open')) {
                    chatSidebar.classList.remove('open');
                }
            };
        });
    }

    // Load session messages from API
    async function loadSessionMessages(sessionId) {
        try {
            welcomeBanner.style.display = 'none';
            messagesList.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading conversation...</div>';
            
            const res = await fetch(`/api/chat/session/${sessionId}`);
            if (!res.ok) throw new Error('Failed to fetch session');
            const data = await res.json();
            
            messagesList.innerHTML = '';
            if (data.messages && data.messages.length > 0) {
                welcomeBanner.style.display = 'none';
                data.messages.forEach(m => {
                    appendMessageBubble(m.role, m.content, m.timestamp);
                });
            } else {
                welcomeBanner.style.display = 'block';
            }
            scrollToBottom();
        } catch (err) {
            console.error('Error loading session messages:', err);
            messagesList.innerHTML = '<div style="color:var(--accent-crimson);text-align:center;padding:1rem;">Failed to load conversation history.</div>';
        }
    }

    // Submit user message
    window.submitChatMessage = async function () {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Hide welcome banner
        welcomeBanner.style.display = 'none';

        // Render user bubble immediately
        appendMessageBubble('user', text, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        scrollToBottom();

        // Show typing indicator
        typingIndicator.style.display = 'flex';
        scrollToBottom();

        const targetRole = roleSelect ? roleSelect.value : 'Software Engineer';

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    session_id: currentSessionId,
                    target_role: targetRole
                })
            });

            const data = await res.json();
            typingIndicator.style.display = 'none';

            if (!res.ok || data.error) {
                appendMessageBubble('assistant', '⚠️ *Oops, I encountered a temporary problem generating a response. Please try again!*');
            } else {
                // Update session state
                if (!currentSessionId && data.session_id) {
                    currentSessionId = data.session_id;
                    addNewSessionToSidebar(data.session_id, text.substring(0, 30) + '...');
                }
                appendMessageBubble('assistant', data.reply, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } catch (err) {
            typingIndicator.style.display = 'none';
            console.error('Chat error:', err);
            appendMessageBubble('assistant', '⚠️ *Network error communicating with CareerX assistant engine. Please verify your connection.*');
        }

        scrollToBottom();
        chatInput.focus();
    };

    // Suggested prompt click helper
    window.sendSuggestedPrompt = function (promptText) {
        chatInput.value = promptText.trim();
        chatInput.dispatchEvent(new Event('input'));
        submitChatMessage();
    };

    // Delete a session
    window.deleteSession = async function (sessionId) {
        if (!confirm('Are you sure you want to delete this conversation?')) return;
        try {
            const res = await fetch(`/api/chat/session/${sessionId}/delete`, { method: 'POST' });
            if (res.ok) {
                const el = document.querySelector(`.chat-session-item[data-session-id="${sessionId}"]`);
                if (el) el.remove();
                if (currentSessionId === sessionId) {
                    currentSessionId = null;
                    messagesList.innerHTML = '';
                    welcomeBanner.style.display = 'block';
                }
            }
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    function addNewSessionToSidebar(sessionId, title) {
        const emptyNotice = document.getElementById('emptySessionsNotice');
        if (emptyNotice) emptyNotice.remove();

        const item = document.createElement('div');
        item.className = 'chat-session-item active';
        item.setAttribute('data-session-id', sessionId);
        item.innerHTML = `
            <i class="fa-regular fa-message session-icon"></i>
            <span class="session-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
            <button type="button" class="session-delete-btn" title="Delete conversation" onclick="event.stopPropagation(); deleteSession(${sessionId});">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        document.querySelectorAll('.chat-session-item').forEach(el => el.classList.remove('active'));
        chatSessionsList.prepend(item);
        setupSessionClickHandlers();
    }

    function appendMessageBubble(role, content, timeStr) {
        const isUser = (role === 'user');
        const row = document.createElement('div');
        row.className = `message-row ${isUser ? 'user' : 'assistant'}`;

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.innerHTML = isUser ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = 'msg-bubble-wrap';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';

        if (isUser) {
            bubble.textContent = content;
        } else {
            bubble.innerHTML = formatMarkdown(content);
        }

        bubbleWrap.appendChild(bubble);

        if (timeStr) {
            const timeEl = document.createElement('span');
            timeEl.className = 'msg-timestamp';
            timeEl.textContent = timeStr;
            bubbleWrap.appendChild(timeEl);
        }

        row.appendChild(avatar);
        row.appendChild(bubbleWrap);
        messagesList.appendChild(row);

        // Bind copy buttons inside code blocks
        bubble.querySelectorAll('.code-copy-btn').forEach(btn => {
            btn.onclick = function () {
                const pre = this.closest('pre');
                const code = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
                navigator.clipboard.writeText(code).then(() => {
                    const original = this.innerHTML;
                    this.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    setTimeout(() => this.innerHTML = original, 2000);
                });
            };
        });
    }

    function scrollToBottom() {
        messagesStream.scrollTop = messagesStream.scrollHeight;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Lightweight Markdown formatter for assistant responses
    function formatMarkdown(text) {
        if (!text) return '';
        let html = text;

        // Fenced code blocks ```lang ... ```
        html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, function (match, lang, code) {
            return `<pre><button type="button" class="code-copy-btn"><i class="fa-regular fa-copy"></i> Copy</button><code>${escapeHtml(code.trim())}</code></pre>`;
        });

        // Inline code `code`
        html = html.replace(/`([^`]+)`/g, function (match, code) {
            return `<code>${escapeHtml(code)}</code>`;
        });

        // Headings ### Heading
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Bullet lists - item
        html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
        html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');

        // Numbered lists 1. item
        html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');

        // Paragraph breaks
        html = html.replace(/\n\n+/g, '</p><p>');
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/\n/g, '<br>');

        return html;
    }
});
