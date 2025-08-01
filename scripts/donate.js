// Donate Section Functionality
class DonateManager {
    constructor() {
        this.paypalEmail = 'MoReqasse1'; // PayPal.me username
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCopyButtons();
    }

    setupEventListeners() {
        // PayPal donation buttons
        document.querySelectorAll('.paypal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePayPalDonation(btn);
            });
        });

        // Custom amount input
        const customAmountInput = document.getElementById('custom-amount');
        if (customAmountInput) {
            customAmountInput.addEventListener('input', (e) => {
                this.updateCustomButton(e.target.value);
            });
        }

        // Copy buttons for bank details
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyToClipboard(btn);
            });
        });

        // Copyable bank details (click to copy)
        document.querySelectorAll('.info-value.copyable').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyTextToClipboard(element.textContent, element);
            });
        });
    }

    setupCopyButtons() {
        // Add copy functionality to bank details
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    this.copyTextToClipboard(targetElement.textContent, btn);
                }
            });
        });
    }

    handlePayPalDonation(button) {
        let amount = 5; // Default amount

        if (button.classList.contains('custom')) {
            const customInput = document.getElementById('custom-amount');
            amount = parseFloat(customInput.value) || 5;
        } else {
            amount = parseFloat(button.getAttribute('data-amount')) || 5;
        }

        // Validate amount
        if (amount < 1) {
            this.showNotification('Please enter a valid amount (minimum $1)', 'error');
            return;
        }

        // Create PayPal donation URL
        const paypalUrl = this.createPayPalUrl(amount);
        
        // Open PayPal in new window
        window.open(paypalUrl, '_blank', 'width=600,height=600');
        
        // Show success message
        this.showNotification(`Redirecting to PayPal for $${amount} donation...`, 'success');
    }

    createPayPalUrl(amount) {
        // PayPal.me URL format
        const paypalMeUrl = `https://www.paypal.me/${this.paypalEmail}/${amount}`;
        
        // Alternative: PayPal donation button URL
        // const paypalDonateUrl = `https://www.paypal.com/donate/?hosted_button_id=YOUR_BUTTON_ID&amount=${amount}`;
        
        return paypalMeUrl;
    }

    updateCustomButton(value) {
        const customBtn = document.getElementById('paypal-custom-btn');
        if (customBtn) {
            const amount = parseFloat(value) || 5;
            const btnText = customBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = `Donate $${amount.toFixed(2)}`;
            }
        }
    }

    async copyTextToClipboard(text, element) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Visual feedback
            if (element.classList.contains('copy-btn')) {
                element.classList.add('copied');
                const originalIcon = element.querySelector('.copy-icon');
                if (originalIcon) {
                    originalIcon.textContent = '✓';
                }
                
                setTimeout(() => {
                    element.classList.remove('copied');
                    if (originalIcon) {
                        originalIcon.textContent = '📋';
                    }
                }, 2000);
            } else {
                // For copyable text elements
                element.style.background = 'var(--success)';
                element.style.color = 'white';
                
                setTimeout(() => {
                    element.style.background = '';
                    element.style.color = '';
                }, 1000);
            }
            
            this.showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    copyToClipboard(button) {
        const targetId = button.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            this.copyTextToClipboard(targetElement.textContent, button);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `donate-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--accent)'};
            color: white;
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-size: 0.9rem;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Method to update PayPal email (can be called from other scripts)
    updatePayPalEmail(email) {
        this.paypalEmail = email;
    }

    // Method to get current PayPal email
    getPayPalEmail() {
        return this.paypalEmail;
    }
}

// Initialize donate manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.donateManager = new DonateManager();
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DonateManager;
}
