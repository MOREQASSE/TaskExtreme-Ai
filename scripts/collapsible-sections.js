// Collapsible Sections Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize collapsible sections
    initializeCollapsibleSections();
    
    // Restore collapsed states after a small delay
    setTimeout(restoreCollapsedStates, 100);
});

function initializeCollapsibleSections() {
    const sectionToggles = document.querySelectorAll('.section-toggle');
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    // Add click handlers to toggle buttons
    sectionToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSection(this);
        });
    });
    
    // Add click handlers to section headers
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            // Don't trigger if clicking on the toggle button (to avoid double-triggering)
            if (e.target.closest('.section-toggle')) {
                return;
            }
            
            e.preventDefault();
            const toggle = this.querySelector('.section-toggle');
            if (toggle) {
                toggleSection(toggle);
            }
        });
    });
}

function toggleSection(toggle) {
    const sectionId = toggle.getAttribute('data-section');
    const sectionContent = document.getElementById(sectionId + '-content');
    
    if (!sectionContent) {
        console.error('Section content not found for:', sectionId);
        return;
    }
    
    // Toggle the collapsed state
    const isCollapsed = sectionContent.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand the section
        expandSection(sectionContent, toggle);
    } else {
        // Collapse the section
        collapseSection(sectionContent, toggle);
    }
}

function collapseSection(content, toggle) {
    // Add collapsed class to content
    content.classList.add('collapsed');
    
    // Add collapsed class to toggle button
    toggle.classList.add('collapsed');
    
    // Change arrow to right-pointing after a small delay to allow rotation
    setTimeout(() => {
        const arrow = toggle.querySelector('.toggle-arrow');
        if (arrow) {
            arrow.textContent = '▶';
        }
    }, 150);
    
    // Store the collapsed state in localStorage
    const sectionId = toggle.getAttribute('data-section');
    localStorage.setItem(`section-${sectionId}-collapsed`, 'true');
}

function expandSection(content, toggle) {
    // Remove collapsed class from content
    content.classList.remove('collapsed');
    
    // Remove collapsed class from toggle button
    toggle.classList.remove('collapsed');
    
    // Change arrow to down-pointing immediately
    const arrow = toggle.querySelector('.toggle-arrow');
    if (arrow) {
        arrow.textContent = '▼';
    }
    
    // Remove the collapsed state from localStorage
    const sectionId = toggle.getAttribute('data-section');
    localStorage.removeItem(`section-${sectionId}-collapsed`);
}

// Function to restore collapsed states on page load
function restoreCollapsedStates() {
    const sectionToggles = document.querySelectorAll('.section-toggle');
    
    sectionToggles.forEach(toggle => {
        const sectionId = toggle.getAttribute('data-section');
        const sectionContent = document.getElementById(sectionId + '-content');
        
        if (sectionContent) {
            const isCollapsed = localStorage.getItem(`section-${sectionId}-collapsed`) === 'true';
            
            if (isCollapsed) {
                sectionContent.classList.add('collapsed');
                toggle.classList.add('collapsed');
                // Set arrow to right-pointing
                const arrow = toggle.querySelector('.toggle-arrow');
                if (arrow) {
                    arrow.textContent = '▶';
                }
            } else {
                // Set arrow to down-pointing for expanded sections
                const arrow = toggle.querySelector('.toggle-arrow');
                if (arrow) {
                    arrow.textContent = '▼';
                }
            }
        }
    });
}

// Add keyboard accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.classList.contains('section-toggle')) {
            e.preventDefault();
            focusedElement.click();
        }
    }
});

// Add smooth scroll to section when expanding
function scrollToSection(sectionContent) {
    const rect = sectionContent.getBoundingClientRect();
    const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
    
    if (!isInViewport) {
        sectionContent.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Enhanced expand function with scroll
function expandSectionWithScroll(content, toggle) {
    expandSection(content, toggle);
    
    // Scroll to section after a small delay to allow animation to start
    setTimeout(() => {
        scrollToSection(content);
    }, 100);
} 