function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                const messagesContainer = document.getElementById('messagesContainer');
                const now = new Date();
                const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                
                const messageElement = document.createElement('div');
                messageElement.className = 'message own';
                messageElement.innerHTML = `
                    <div class="message-avatar">ME</div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-username">Me</span>
                            <span class="message-time">${time}</span>
                        </div>
                        <div class="message-text">${message}</div>
                    </div>
                `;
                
                messagesContainer.appendChild(messageElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                input.value = '';
            }
        }

        // Initialize event listeners when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Message input event listener
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
            }

            // File input event listener
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const messagesContainer = document.getElementById('messagesContainer');
                        const now = new Date();
                        const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        
                        const messageElement = document.createElement('div');
                        messageElement.className = 'message own';
                        messageElement.innerHTML = `
                            <div class="message-avatar">ME</div>
                            <div class="message-content">
                                <div class="message-header">
                                    <span class="message-username">Me</span>
                                    <span class="message-time">${time}</span>
                                </div>
                                <div class="message-text">
                                    <i class="fas fa-file"></i> Shared file: ${file.name}
                                </div>
                            </div>
                        `;
                        
                        messagesContainer.appendChild(messageElement);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                });
            }
        });

        function openVideoModal(videoFile, mentorName) {
            const modal = document.getElementById('videoModal');
            const video = document.getElementById('modalVideo');
            if (modal && video) {
                video.src = 'media/' + videoFile;
                modal.style.display = 'flex';
                video.play().catch(function(error) {
                    console.log('Video autoplay failed:', error);
                });
            }
        }

        function closeVideoModal() {
            const modal = document.getElementById('videoModal');
            const video = document.getElementById('modalVideo');
            if (modal && video) {
                video.pause();
                modal.style.display = 'none';
                video.src = '';
            }
        }

        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('videoModal');
            if (modal && event.target === modal) {
                closeVideoModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeVideoModal();
            }
        });

        function sendMessage() {
    console.log("Message sent");
}
