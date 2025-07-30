console.log('theme.js loaded');

// Theme management with dropdown menu
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = {
            light: { name: 'Light Mode', icon: '☀️' },
            dark: { name: 'Dark Mode', icon: '🌙' },
            sunset: { name: 'Sunset Ocean', icon: '🌅' },
            forest: { name: 'Forest Nature', icon: '🌲' },
            galaxy: { name: 'Purple Galaxy', icon: '✨' },
            minimalist: { name: 'Minimalist Gray', icon: '⚪' },
            retro: { name: 'Retro 80s', icon: '🎮' },
            coffee: { name: 'Coffee Warm', icon: '☕' },
            girly: { name: 'Girly Pink', icon: '🌸' }
        };
        
        this.init();
    }
    
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.updateDropdownDisplay();
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, using light theme`);
            themeName = 'light';
        }
        
        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        
        this.updateDropdownDisplay();
        this.updateActiveOption();
    }
    
    updateDropdownDisplay() {
        const dropdownBtn = document.getElementById('theme-dropdown-btn');
        const theme = this.themes[this.currentTheme];
        
        if (dropdownBtn) {
            const btnText = dropdownBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = theme.name;
            }
        }
    }
    
    updateActiveOption() {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === this.currentTheme) {
                option.classList.add('active');
            }
        });
    }
    
    setupEventListeners() {
        // Dropdown button click
        const dropdownBtn = document.getElementById('theme-dropdown-btn');
        if (dropdownBtn) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        // Theme option clicks
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const themeName = option.dataset.theme;
                this.setTheme(themeName);
                this.closeDropdown();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.theme-dropdown')) {
                this.closeDropdown();
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }
    
    toggleDropdown() {
        const dropdownMenu = document.getElementById('theme-dropdown-menu');
        const dropdownBtn = document.getElementById('theme-dropdown-btn');
        
        if (dropdownMenu && dropdownBtn) {
            const isOpen = dropdownMenu.classList.contains('show');
            
            if (isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
    }
    
    openDropdown() {
        const dropdownMenu = document.getElementById('theme-dropdown-menu');
        const dropdownBtn = document.getElementById('theme-dropdown-btn');
        
        if (dropdownMenu && dropdownBtn) {
            dropdownMenu.classList.add('show');
            dropdownBtn.classList.add('active');
        }
    }
    
    closeDropdown() {
        const dropdownMenu = document.getElementById('theme-dropdown-menu');
        const dropdownBtn = document.getElementById('theme-dropdown-btn');
        
        if (dropdownMenu && dropdownBtn) {
            dropdownMenu.classList.remove('show');
            dropdownBtn.classList.remove('active');
        }
    }
    
    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    // Public method to get theme info
    getThemeInfo(themeName) {
        return this.themes[themeName] || this.themes.light;
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
