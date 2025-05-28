// Initialize Feather icons
feather.replace();

const socket = io();
let messageCount = 0;
let blockedCount = 0;
let markdownEnabled = true;

// Configure marked options
marked.setOptions({
    breaks: true,
    gfm: true,
    sanitize: false
});

// Custom Modal Functions
function createModal(title, message, type = 'info', buttons = null) {
    // Remove existing modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Determine icon based on type
    const icons = {
        'success': 'check',
        'error': 'x',
        'warning': 'alert-triangle',
        'info': 'info'
    };
    
    const titles = {
        'success': title || 'Berhasil',
        'error': title || 'Error',
        'warning': title || 'Peringatan',
        'info': title || 'Informasi'
    };

    // Default buttons
    if (!buttons) {
        buttons = [{
            text: 'OK',
            type: 'primary',
            action: () => closeModal()
        }];
    }

    // Create modal content
    overlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">
                <i data-feather="x" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="modal-header">
                <div class="modal-icon ${type}">
                    <i data-feather="${icons[type]}" style="width: 16px; height: 16px;"></i>
                </div>
                <h3 class="modal-title">${titles[type]}</h3>
            </div>
            <div class="modal-body">${message}</div>
            <div class="modal-footer">
                ${buttons.map((btn, index) => `
                    <button class="modal-btn ${btn.type === 'secondary' ? 'secondary' : btn.type === 'danger' ? 'danger' : ''}" 
                            onclick="handleModalButton(${index})">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Store button actions
    overlay._buttonActions = buttons.map(btn => btn.action);

    // Add to body
    document.body.appendChild(overlay);
    
    // Initialize feather icons in modal
    feather.replace();
    
    // Show modal with animation
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    return overlay;
}

function handleModalButton(index) {
    const modal = document.querySelector('.modal-overlay');
    if (modal && modal._buttonActions && modal._buttonActions[index]) {
        modal._buttonActions[index]();
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function showNotification(message, type = 'info', title = null) {
    createModal(title, message, type);
}

function showConfirm(message, onConfirm, onCancel = null, title = null) {
    const buttons = [
        {
            text: 'Batal',
            type: 'secondary',
            action: () => {
                closeModal();
                if (onCancel) onCancel();
            }
        },
        {
            text: 'Ya',
            type: 'primary',
            action: () => {
                closeModal();
                onConfirm();
            }
        }
    ];
    
    createModal(title || 'Konfirmasi', message, 'warning', buttons);
}

function showPrompt(message, onConfirm, title = null) {
    // Remove existing modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create modal content with input field
    overlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">
                <i data-feather="x" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="modal-header">
                <div class="modal-icon info">
                    <i data-feather="edit-3" style="width: 16px; height: 16px;"></i>
                </div>
                <h3 class="modal-title">${title || 'Input'}</h3>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 1rem;">${message}</p>
                <input type="text" id="promptInput" class="form-input" placeholder="Masukkan teks..." style="margin: 0;">
            </div>
            <div class="modal-footer">
                <button class="modal-btn secondary" onclick="closeModal()">
                    Batal
                </button>
                <button class="modal-btn" onclick="handlePromptConfirm()">
                    OK
                </button>
            </div>
        </div>
    `;

    // Store callback
    overlay._promptCallback = onConfirm;

    // Add to body
    document.body.appendChild(overlay);
    
    // Initialize feather icons in modal
    feather.replace();
    
    // Show modal with animation
    setTimeout(() => {
        overlay.classList.add('show');
        // Focus on input
        const input = overlay.querySelector('#promptInput');
        if (input) {
            input.focus();
            // Handle Enter key
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handlePromptConfirm();
                }
            });
        }
    }, 10);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    return overlay;
}

function handlePromptConfirm() {
    const modal = document.querySelector('.modal-overlay');
    const input = modal?.querySelector('#promptInput');
    
    if (modal && input && modal._promptCallback) {
        const value = input.value.trim();
        closeModal();
        modal._promptCallback(value);
    }
}

// WebSocket connection events
socket.on('connect', () => {
    updateConnectionStatus('Connected', 'connected');
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    updateConnectionStatus('Disconnected', 'disconnected');
    console.log('Disconnected from server');
});

function updateConnectionStatus(text, status) {
    const statusEl = document.getElementById('connectionStatus');
    statusEl.innerHTML = `
        <i data-feather="${status === 'connected' ? 'wifi' : 'wifi-off'}" style="width: 16px; height: 16px;"></i>
        ${text}
    `;
    statusEl.className = `status ${status}`;
    feather.replace();
}

// WhatsApp events
socket.on('qr-code', (qr) => {
    const qrContainer = document.getElementById('qrContainer');
    qrContainer.innerHTML = `
        <div style="text-align: center;">
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Scan QR Code dengan WhatsApp</h4>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}" class="qr-code" alt="QR Code">
            <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">Buka WhatsApp → Tiga titik → Perangkat Tertaut → Tautkan Perangkat</p>
        </div>
    `;
});

socket.on('whatsapp-ready', () => {
    document.getElementById('botStatus').textContent = '✅';
    document.getElementById('qrContainer').innerHTML = `
        <div style="text-align: center;">
            <i data-feather="check-circle" style="width: 48px; height: 48px; color: var(--primary-green); margin-bottom: 1rem;"></i>
            <h4 style="color: var(--primary-green); margin-bottom: 0.5rem;">WhatsApp Bot Ready!</h4>
            <p style="color: var(--text-secondary);">Bot siap menerima dan membalas pesan</p>
        </div>
    `;
    feather.replace();
    addMessage('System', 'WhatsApp bot is now ready and listening for messages', 'system');
});

socket.on('whatsapp-authenticated', () => {
    addMessage('System', 'WhatsApp authenticated successfully', 'system');
});

socket.on('whatsapp-disconnected', (data) => {
    document.getElementById('botStatus').textContent = '❌';
    addMessage('System', `WhatsApp disconnected: ${data.reason}`, 'system');
});

socket.on('auth-failure', (data) => {
    addMessage('System', `Authentication failed: ${data.error}`, 'error');
});

// Message events
socket.on('message-received', (data) => {
    messageCount++;
    document.getElementById('messageCount').textContent = messageCount;
    addMessage(data.from, data.body, 'received');
});

socket.on('message-blocked', (data) => {
    blockedCount++;
    document.getElementById('blockedCount').textContent = blockedCount;
    addMessage('🚫 BLOCKED', `Message from ${data.contact}: "${data.message}"`, 'blocked');
});

socket.on('ai-response', (data) => {
    addMessage('AI Bot', data.response, 'sent', true);
});

socket.on('error', (data) => {
    addMessage('Error', data.message, 'error');
});

// AI Provider hot reload events
socket.on('ai-provider-reloaded', (data) => {
    addMessage('System', `🔥 ${data.message}`, 'system');
    showNotification(`🔥 Hot Reload Complete!\n\nAI Provider: ${getProviderName(data.newProvider)}\nNo restart required!`, 'success');
    
    // Auto-refresh provider config to show new status
    setTimeout(() => {
        loadProviderConfig();
    }, 1000);
});

// System prompt hot reload events
socket.on('system-prompt-reloaded', (data) => {
    addMessage('System', `🔥 ${data.message}`, 'system');
    showNotification(`🔥 System Prompt Hot Reload Complete!\n\nPrompt updated instantly without restart!`, 'success');
});

// Functions
function startWhatsApp() {
    socket.emit('start-whatsapp');
    document.getElementById('qrContainer').innerHTML = `
        <div style="text-align: center;">
            <div class="loading-spinner" style="width: 32px; height: 32px; margin-bottom: 1rem;"></div>
            <p>Starting WhatsApp client...</p>
        </div>
    `;
}

function stopWhatsApp() {
    socket.emit('stop-whatsapp');
    document.getElementById('botStatus').textContent = '❌';
    document.getElementById('qrContainer').innerHTML = `
        <div style="text-align: center;">
            <i data-feather="x-circle" style="width: 48px; height: 48px; color: #ef4444; margin-bottom: 1rem;"></i>
            <p>WhatsApp client stopped</p>
        </div>
    `;
    feather.replace();
}

function clearSession() {
    showConfirm('Apakah Anda yakin ingin menghapus session WhatsApp? Anda harus scan QR code lagi.', () => {
        fetch('/api/whatsapp/session', {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Session berhasil dihapus!', 'success');
                // Reset status display
                document.getElementById('whatsapp-status').textContent = 'Disconnected';
                document.getElementById('qr-code').innerHTML = '';
                updateStatus('WhatsApp session telah dihapus');
            } else {
                showNotification('Gagal menghapus session: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Terjadi kesalahan saat menghapus session', 'error');
        });
    });
}

async function updatePrompt(hotReload = false) {
    const prompt = document.getElementById('systemPrompt').value;
    if (!prompt.trim()) {
        showNotification('Please enter a prompt', 'error');
        return;
    }

    const action = hotReload ? 'Hot reloaded' : 'Updated';

    try {
        const response = await fetch('/api/ai/prompt', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, hotReload })
        });

        const result = await response.json();
        if (result.success) {
            showNotification(`Prompt ${action} successfully!`, 'success');
        } else {
            showNotification('Failed to update prompt', 'error');
        }
    } catch (error) {
        showNotification('Error updating prompt: ' + error.message, 'error');
    }
}

async function loadPrompt() {
    try {
        const response = await fetch('/api/ai/prompt');
        const result = await response.json();
        document.getElementById('systemPrompt').value = result.prompt;
        showNotification('Prompt loaded successfully', 'success');
    } catch (error) {
        showNotification('Error loading prompt: ' + error.message, 'error');
    }
}

async function updateBlacklist() {
    const blacklistWords = document.getElementById('blacklistWords').value;

    try {
        const response = await fetch('/api/ai/blacklist', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ blacklistWords })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Blacklist updated successfully!', 'success');
            loadBlacklist();
        } else {
            showNotification('Failed to update blacklist', 'error');
        }
    } catch (error) {
        showNotification('Error updating blacklist: ' + error.message, 'error');
    }
}

async function loadBlacklist() {
    try {
        const response = await fetch('/api/ai/blacklist');
        const result = await response.json();
        document.getElementById('blacklistWords').value = result.blacklistWords;
        document.getElementById('blacklistCount').textContent = result.totalBlacklistWords;
    } catch (error) {
        showNotification('Error loading blacklist: ' + error.message, 'error');
    }
}

async function testBlacklist() {
    showPrompt('Masukkan pesan untuk diuji coba di blacklist:', (testMessage) => {
        if (!testMessage) return;

        fetch('/api/ai/blacklist/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: testMessage })
        })
        .then(response => response.json())
        .then(result => {
            if (result.isBlocked) {
                showNotification(`🚫 Pesan DIBLOKIR!\n\nKata terlarang: "${result.blockedWord}"\nAlasan: ${result.reason}`, 'error');
            } else {
                showNotification(`✅ Pesan AMAN!`, 'success');
            }
        })
        .catch(error => {
            showNotification('Error testing blacklist: ' + error.message, 'error');
        });
    });
}

function clearMessages() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = `
        <div class="empty-state">
            <i data-feather="message-square" class="empty-state-icon"></i>
            <p>No messages yet. Messages will appear here in real-time.</p>
        </div>
    `;
    feather.replace();
}

function addMessage(from, body, type, enableMarkdown = false) {
    const messagesContainer = document.getElementById('messages');
    
    // Remove empty state if present
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Process message content
    let processedBody = body;
    let toggleButton = '';
    
    if (enableMarkdown && markdownEnabled && type === 'sent') {
        try {
            const htmlContent = marked.parse(body);
            processedBody = DOMPurify.sanitize(htmlContent);
            toggleButton = `
                <button class="markdown-toggle" onclick="toggleMarkdown(this, '${encodeURIComponent(body)}')">
                    <i data-feather="code" style="width: 12px; height: 12px;"></i>
                    Plain Text
                </button>
            `;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            processedBody = body.replace(/\n/g, '<br>');
        }
    } else {
        processedBody = body.replace(/\n/g, '<br>');
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-sender">
                <i data-feather="${getMessageIcon(type)}" style="width: 16px; height: 16px;"></i>
                ${from}
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${toggleButton}
                <div class="message-time">
                    <i data-feather="clock" style="width: 12px; height: 12px;"></i>
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
        <div class="message-content">
            ${processedBody}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Re-initialize Feather icons
    feather.replace();
}

function getMessageIcon(type) {
    const icons = {
        'received': 'message-circle',
        'sent': 'send',
        'system': 'info',
        'error': 'alert-circle',
        'blocked': 'shield'
    };
    return icons[type] || 'message-square';
}

function toggleMarkdown(button, originalText) {
    const messageContent = button.closest('.message').querySelector('.message-content');
    const decodedText = decodeURIComponent(originalText);
    
    if (button.textContent.trim() === 'Plain Text') {
        messageContent.innerHTML = decodedText.replace(/\n/g, '<br>');
        button.innerHTML = `
            <i data-feather="eye" style="width: 12px; height: 12px;"></i>
            Markdown
        `;
    } else {
        try {
            const htmlContent = marked.parse(decodedText);
            messageContent.innerHTML = DOMPurify.sanitize(htmlContent);
            button.innerHTML = `
                <i data-feather="code" style="width: 12px; height: 12px;"></i>
                Plain Text
            `;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            messageContent.innerHTML = decodedText.replace(/\n/g, '<br>');
        }
    }
    feather.replace();
}

// AI Provider Management Functions
async function loadProviderConfig() {
    try {
        const response = await fetch('/api/ai/provider');
        const config = await response.json();
        
        // Update current provider display
        const currentProviderEl = document.getElementById('currentProvider');
        const providerIcon = getProviderIcon(config.currentProvider);
        const providerName = getProviderName(config.currentProvider);
        const hasApiKey = config.providerConfig[config.currentProvider].hasApiKey;
        
        currentProviderEl.innerHTML = `
            <i data-feather="${providerIcon}" style="width: 20px; height: 20px; color: ${hasApiKey ? 'var(--primary-green)' : '#ef4444'};"></i>
            <span style="font-weight: 600; color: ${hasApiKey ? 'var(--primary-green)' : '#ef4444'};">
                ${providerName}
            </span>
            <span style="color: var(--text-secondary); font-size: 0.8rem;">
                (${config.providerConfig[config.currentProvider].model})
            </span>
        `;
        
        // Update provider select
        document.getElementById('aiProvider').value = config.currentProvider;
        
        // Update provider status
        updateProviderStatus(config);
        
        // Update API key configuration display
        updateApiKeyConfig(config.currentProvider, config.providerConfig);
        
        feather.replace();
    } catch (error) {
        showNotification('Error loading provider config: ' + error.message, 'error');
    }
}

function updateProviderStatus(config) {
    const statusEl = document.getElementById('providerStatus');
    let statusHTML = '<div style="margin-top: 1rem;"><h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-primary);">Provider Status:</h4>';
    
    config.availableProviders.forEach(provider => {
        const providerConfig = config.providerConfig[provider];
        const isActive = provider === config.currentProvider;
        const hasApiKey = providerConfig.hasApiKey;
        const icon = getProviderIcon(provider);
        const name = getProviderName(provider);
        
        let statusColor = '#6b7280'; // gray
        let statusText = 'Not Configured';
        let statusIcon = 'x-circle';
        
        if (hasApiKey) {
            if (isActive) {
                statusColor = 'var(--primary-green)';
                statusText = 'Active';
                statusIcon = 'check-circle';
            } else {
                statusColor = '#3b82f6';
                statusText = 'Ready';
                statusIcon = 'circle';
            }
        }
        
        statusHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-md); margin-bottom: 0.5rem; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i data-feather="${icon}" style="width: 18px; height: 18px; color: ${statusColor};"></i>
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${providerConfig.model}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i data-feather="${statusIcon}" style="width: 16px; height: 16px; color: ${statusColor};"></i>
                    <span style="font-size: 0.8rem; font-weight: 500; color: ${statusColor};">${statusText}</span>
                </div>
            </div>
        `;
    });
    
    statusHTML += '</div>';
    statusEl.innerHTML = statusHTML;
    feather.replace();
}

function updateApiKeyConfig(currentProvider, providerConfig) {
    const configEl = document.getElementById('apiKeyConfig');
    const config = providerConfig[currentProvider];
    const hasApiKey = config.hasApiKey;
    
    let configHTML = `
        <div style="padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-primary);">API Key Configuration:</h4>
            
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <i data-feather="${hasApiKey ? 'check-circle' : 'alert-circle'}" style="width: 20px; height: 20px; color: ${hasApiKey ? 'var(--primary-green)' : '#f59e0b'};"></i>
                <span style="font-weight: 600; color: ${hasApiKey ? 'var(--primary-green)' : '#f59e0b'};">
                    ${hasApiKey ? 'API Key Configured' : 'API Key Required'}
                </span>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <h5 style="margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">Configuration Instructions:</h5>
    `;
    
    if (currentProvider === 'openai') {
        configHTML += `
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" style="color: var(--primary-green);">OpenAI API Keys</a><br>
                2. Create a new API key<br>
                3. Add to .env: <code style="background: rgba(100,116,139,0.1); padding: 0.2rem 0.4rem; border-radius: 3px;">OPENAI_API_KEY=sk-...</code>
            </p>
        `;
    } else if (currentProvider === 'openrouter') {
        configHTML += `
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                1. Visit <a href="https://openrouter.ai/" target="_blank" style="color: var(--primary-green);">OpenRouter</a><br>
                2. Sign up and get API key<br>
                3. Add to .env: <code style="background: rgba(100,116,139,0.1); padding: 0.2rem 0.4rem; border-radius: 3px;">OPENROUTER_API_KEY=sk-or-...</code><br>
                4. Optional: <code style="background: rgba(100,116,139,0.1); padding: 0.2rem 0.4rem; border-radius: 3px;">OPENROUTER_MODEL_NAME=openai/gpt-3.5-turbo</code>
            </p>
        `;
    } else if (currentProvider === 'gemini') {
        configHTML += `
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                1. Visit <a href="https://aistudio.google.com/" target="_blank" style="color: var(--primary-green);">Google AI Studio</a><br>
                2. Create API key for Gemini<br>
                3. Add to .env: <code style="background: rgba(100,116,139,0.1); padding: 0.2rem 0.4rem; border-radius: 3px;">GEMINI_API_KEY=your-key-here</code>
            </p>
        `;
    }
    
    configHTML += `
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
                <strong>Note:</strong> Restart server after updating environment variables.
            </p>
        </div>
    </div>
    `;
    
    configEl.innerHTML = configHTML;
    feather.replace();
}

function getProviderIcon(provider) {
    const icons = {
        'openai': 'zap',
        'openrouter': 'shuffle',
        'gemini': 'star'
    };
    return icons[provider] || 'cpu';
}

function getProviderName(provider) {
    const names = {
        'openai': 'OpenAI',
        'openrouter': 'OpenRouter',
        'gemini': 'Google Gemini'
    };
    return names[provider] || provider;
}

function onProviderChange() {
    const selectedProvider = document.getElementById('aiProvider').value;
    // Just update the display, don't actually change the provider yet
    showNotification(`Selected ${getProviderName(selectedProvider)}. Click "Update Provider" to apply changes.`, 'info');
}

async function updateProvider(hotReload = false) {
    const selectedProvider = document.getElementById('aiProvider').value;
    let confirmMessage = '';

    if (hotReload) {
        confirmMessage = `🔥 Hot Reload: Switch to ${getProviderName(selectedProvider)} instantly tanpa restart?`;
    } else {
        confirmMessage = `Apakah Anda yakin ingin beralih ke ${getProviderName(selectedProvider)}? Ini akan memerlukan restart server.`;
    }

    showConfirm(confirmMessage, async () => {
        try {
            const response = await fetch('/api/ai/provider', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ provider: selectedProvider, hotReload })
            });

            const result = await response.json();
            if (result.success) {
                let message = '';
                
                if (result.hotReloaded) {
                    message = `🔥 Hot Reload Berhasil!\n\n` +
                            `✅ AI Provider: ${getProviderName(selectedProvider)}\n` +
                            `✅ File lingkungan: Diperbarui\n` +
                            `✅ Layanan WhatsApp: Dimuat ulang instan\n\n` +
                            `🚀 Siap digunakan! Tidak perlu restart.`;
                    
                    // Add visual feedback for hot reload success
                    addMessage('System', `🔥 Hot Reload: AI Provider beralih ke ${getProviderName(selectedProvider)} secara instan!`, 'system');
                    
                } else {
                    message = `✅ AI Provider Diperbarui Dengan Sukses!\n\n` +
                             `Provider: ${getProviderName(selectedProvider)}\n` +
                             `File lingkungan: ${result.envUpdated ? 'Diperbarui' : 'Tidak diperbarui'}\n\n` +
                             `⚠️ Penting: Harap restart server untuk menerapkan perubahan pada layanan WhatsApp.\n\n` +
                             `Jalankan: npm start`;
                    
                    addMessage('System', `AI Provider diubah menjadi ${getProviderName(selectedProvider)}. Restart server diperlukan untuk layanan WhatsApp.`, 'system');
                }
                
                showNotification(message, 'success');
                
                // Reload provider config to show updated status
                await loadProviderConfig();
                
            } else {
                showNotification('❌ Gagal memperbarui provider: ' + (result.error || 'Kesalahan tidak diketahui'), 'error');
            }
        } catch (error) {
            showNotification('❌ Kesalahan saat memperbarui provider: ' + error.message, 'error');
        }
    });
}

async function testAI() {
    const testMessage = prompt('Enter a test message for AI:');
    if (!testMessage) return;

    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: testMessage, userId: 'test-frontend' })
        });

        const result = await response.json();
        
        if (result.blocked) {
            showNotification('🚫 Test message was blocked by blacklist filter.', 'error');
        } else if (result.success) {
            addMessage('Test User', testMessage, 'received');
            addMessage('AI Bot (Test)', result.response, 'sent', true);
            showNotification('✅ AI test successful! Check the messages below.', 'success');
        } else {
            showNotification('❌ AI test failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showNotification('Error testing AI: ' + error.message, 'error');
    }
}

// Load current status and configuration on page load
async function loadInitialStatus() {
    try {
        // Load WhatsApp status
        const statusResponse = await fetch('/api/whatsapp/status');
        const status = await statusResponse.json();
        
        if (status.isReady) {
            document.getElementById('botStatus').textContent = '✅';
            document.getElementById('qrContainer').innerHTML = `
                <div style="text-align: center;">
                    <i data-feather="check-circle" style="width: 48px; height: 48px; color: var(--primary-green); margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--primary-green); margin-bottom: 0.5rem;">WhatsApp Bot Ready!</h4>
                    <p style="color: var(--text-secondary);">Bot siap menerima dan membalas pesan</p>
                </div>
            `;
            feather.replace();
            addMessage('System', 'WhatsApp bot status: Ready', 'system');
        } else if (status.hasClient) {
            document.getElementById('botStatus').textContent = '🔄';
            document.getElementById('qrContainer').innerHTML = `
                <div style="text-align: center;">
                    <div class="loading-spinner" style="width: 32px; height: 32px; margin-bottom: 1rem;"></div>
                    <p>WhatsApp client is connecting...</p>
                </div>
            `;
            addMessage('System', 'WhatsApp bot status: Connecting', 'system');
        } else {
            document.getElementById('botStatus').textContent = '❌';
            document.getElementById('qrContainer').innerHTML = `
                <div style="text-align: center;">
                    <i data-feather="square" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>Click "Start Bot" to generate QR code</p>
                </div>
            `;
            feather.replace();
        }
    } catch (error) {
        console.error('Error loading WhatsApp status:', error);
        addMessage('System', 'Failed to load WhatsApp status: ' + error.message, 'error');
    }
}

// Load current prompt and blacklist on page load
window.onload = () => {
    loadPrompt();
    loadBlacklist();
    loadProviderConfig(); // Load provider configuration
    loadInitialStatus(); // Load WhatsApp status
    
    // Add fade-in animation to elements
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
};
