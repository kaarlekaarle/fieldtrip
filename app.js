/**
 * FieldTrip - Complete Animation & Interaction Logic
 * Implements all animation sequences, navigation, and overlay functionality
 */

// Simplified viewport height handling for consistent behavior
function setVHVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVHVar();

// Update on resize and orientation change
window.addEventListener('resize', setVHVar);
window.addEventListener('orientationchange', setVHVar);

// Optional verification snippet
console.log('Viewport test', {
  innerHeight: window.innerHeight,
  visualViewport: window.visualViewport?.height,
  vhVar: getComputedStyle(document.documentElement).getPropertyValue('--vh'),
});

// Layout diagnostic function
function diagnoseLayout() {
    const section = document.querySelector('.section.section--active');
    const row3 = document.querySelector('.row-3');
    const row4 = document.querySelector('.row-4');
    const row5 = document.querySelector('.row-5');
    
    if (!section || !row3 || !row4 || !row5) {
        console.log('Layout diagnostic: Missing elements');
        return;
    }
    
    const sectionRect = section.getBoundingClientRect();
    const row3Rect = row3.getBoundingClientRect();
    const row4Rect = row4.getBoundingClientRect();
    const row5Rect = row5.getBoundingClientRect();
    
    console.log('Layout Diagnostic:', {
        section: {
            height: Math.round(sectionRect.height),
            display: getComputedStyle(section).display,
            flexDirection: getComputedStyle(section).flexDirection,
            justifyContent: getComputedStyle(section).justifyContent
        },
        row3: {
            height: Math.round(row3Rect.height),
            flex: getComputedStyle(row3).flex,
            padding: getComputedStyle(row3).padding
        },
        row4: {
            height: Math.round(row4Rect.height),
            marginTop: getComputedStyle(row4).marginTop,
            padding: getComputedStyle(row4).padding
        },
        row5: {
            height: Math.round(row5Rect.height),
            padding: getComputedStyle(row5).padding,
            minHeight: getComputedStyle(row5).minHeight
        },
        totalHeight: Math.round(row3Rect.height + row4Rect.height + row5Rect.height),
        availableSpace: Math.round(sectionRect.height - row3Rect.height - row4Rect.height - row5Rect.height)
    });
}

// Run diagnostic after page load
setTimeout(diagnoseLayout, 1000);

class FieldTripApp {
    constructor() {
        this.currentSection = 1;
        this.sections = document.querySelectorAll('.section');
        this.isTransitioning = false;
        this.copytexts = null;
        this.lastSelectedIllustration = null; // Track last selected animation
        this.currentAnimationIndex = -1; // Track current position in animation sequence
        
        // Available illustrations
        this.illustrations = [
            'images/bath.gif',
            'images/bird.gif', 
            'images/hill.gif',
            'images/snow.gif',
            'images/wind.gif'
        ];
        
        // DOM elements - with null checks
        this.randomIllustration = document.getElementById('random-illustration');
        this.arrowDown = document.getElementById('arrow-down');
        this.arrowUp = document.getElementById('arrow-up');
        this.contactOverlay = document.getElementById('contact-overlay');
        this.overlayClose = document.getElementById('overlay-close');
        this.requestReferencesBtn = document.getElementById('request-references');
        this.contactUsBtn = document.getElementById('contact-us');
        
        // Verify critical elements exist
        if (!this.randomIllustration || !this.arrowDown || !this.arrowUp || !this.contactOverlay) {
            throw new Error('Critical DOM elements not found');
        }
        
        
        // Reset any content scaling to ensure clean state
        this.resetContentScaling();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        await this.loadCopytexts();
        this.populateContent();
        this.setupInitialState();
        this.bindEvents();
        this.startInitialLoadSequence();
        
        // Force content refresh after initial load to ensure mobile detection works
        setTimeout(() => {
            this.populateContent();
        }, 500);
    }

    /**
     * Load copytexts from JSON file
     */
    async loadCopytexts() {
        try {
            const response = await fetch('copytexts.json');
            this.copytexts = await response.json();
        } catch (error) {
            console.error('Failed to load copytexts:', error);
            // Fallback content
            this.copytexts = {
                section1: {
                    description: "Curated experiences to remember.",
                    ctaButton: "Request references"
                },
                section2: {
                    text: [
                        "Field Trip is not a travel agency in the traditional sense.",
                        "We work only with selected clients, designing warm, deeply personal journeys shaped by authenticity, atmosphere, and an obsession with detail.",
                        "Every journey is handcrafted. Nothing is packaged.",
                        "Everything is shaped from one human to another."
                    ],
                    ctaButton: "Contact us"
                },
                contact: {
                    intro: "Contact us for more information:",
                    email: "jussi@fieldtrip.fi",
                    phone: "+358 40 843 6023"
                }
            };
        }
    }

    /**
     * Detect if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Get current copytexts (mobile or desktop)
     */
    getCurrentCopytexts() {
        return this.isMobile() ? this.copytexts.mobile : this.copytexts.desktop;
    }

    /**
     * Populate content from copytexts
     */
    populateContent() {
        const currentCopytexts = this.getCurrentCopytexts();
        const isMobile = this.isMobile();
        
        // Content populated for mobile/desktop
        
        // Section 1 content
        const section1Description = document.getElementById('section1-description');
        if (section1Description) {
            section1Description.innerHTML = currentCopytexts.section1.description.replace(/\n/g, '<br>');
        } else {
            console.error('section1-description element not found!');
        }
        if (this.requestReferencesBtn) {
            this.requestReferencesBtn.textContent = currentCopytexts.section1.ctaButton;
        } else {
            console.error('request-references button not found!');
        }

        // Section 2 content
        const section2Text = document.getElementById('section2-text');
        if (section2Text) {
            section2Text.innerHTML = ''; // Clear existing content
            currentCopytexts.section2.text.forEach(text => {
                const p = document.createElement('p');
                p.innerHTML = text.replace(/\n/g, '<br>'); // Convert line breaks to HTML
                section2Text.appendChild(p);
            });
        }
        if (this.contactUsBtn) {
            this.contactUsBtn.textContent = currentCopytexts.section2.ctaButton;
        }

        // Contact overlay content - only populate when overlay is opened
        // This is handled in openContactOverlay() to ensure correct mobile/desktop detection
    }

    /**
     * Setup initial state - hide all content except illustration and down arrow
     */
    setupInitialState() {
        // Set up initial state without showing content (animation will handle visibility)
        // Keep down arrow always visible and ensure it's protected
        this.arrowDown.classList.add('nav-arrow--visible');
        this.ensureBottomArrowVisibility();
        
        // Hide up arrow initially
        this.arrowUp.classList.remove('nav-arrow--visible');
        
        // Hide contact overlay
        this.contactOverlay.classList.remove('contact-overlay--visible');
        
        // CTA button will be shown by animation sequence
    }

    /**
     * Start the initial load animation sequence
     */
    startInitialLoadSequence() {
        // First, hide all content except illustration
        this.hideAllContentForAnimation();
        
        // Step 1: Select and display random illustration first
        this.selectRandomIllustration();
        
        // Step 2-5: Fade in other rows in sequence after illustration is ready
        this.fadeInContentSequence();
    }

    /**
     * Hide all content for animation sequence (Section 1 only)
     */
    hideAllContentForAnimation() {
        // Hide Section 1 rows including row-3 (illustration)
        document.querySelectorAll('#section-1 .row-1, #section-1 .row-2, #section-1 .row-3, #section-1 .row-4, #section-1 .row-5').forEach(row => {
            row.classList.add('fade-out');
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
        });
        
        // Hide illustration specifically
        if (this.randomIllustration) {
            this.randomIllustration.style.opacity = '0';
            this.randomIllustration.style.transform = 'translateY(20px)';
        }
        
        // Hide CTA button
        if (this.requestReferencesBtn) {
            this.requestReferencesBtn.style.opacity = '0';
            this.requestReferencesBtn.style.transform = 'translateY(20px)';
        }
        
        // Hide down arrow
        if (this.arrowDown) {
            this.arrowDown.style.opacity = '0';
            this.arrowDown.style.transform = 'translateY(10px)';
        }
    }

    /**
     * Immediately hide all content to prevent flash (no transitions)
     */
    hideAllContentImmediately() {
        // Hide all Section 1 rows immediately with no transition
        document.querySelectorAll('#section-1 .row-1, #section-1 .row-2, #section-1 .row-3, #section-1 .row-4, #section-1 .row-5').forEach(row => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            row.style.transition = 'none';
        });
        
        // Hide illustration immediately
        if (this.randomIllustration) {
            this.randomIllustration.style.opacity = '0';
            this.randomIllustration.style.transform = 'translateY(20px)';
            this.randomIllustration.style.transition = 'none';
        }
        
        // Hide CTA button immediately
        if (this.requestReferencesBtn) {
            this.requestReferencesBtn.style.opacity = '0';
            this.requestReferencesBtn.style.transform = 'translateY(20px)';
            this.requestReferencesBtn.style.transition = 'none';
        }
        
        // Hide arrow immediately
        if (this.arrowDown) {
            this.arrowDown.style.opacity = '0';
            this.arrowDown.style.transform = 'translateY(10px)';
            this.arrowDown.style.transition = 'none';
        }
    }

    /**
     * Initialize Section 1 exactly like a fresh page load
     */
    initializeSection1LikeFreshLoad() {
        // Ensure illustration container is visible
        const illustrationContainer = document.querySelector('.illustration-container');
        if (illustrationContainer) {
            illustrationContainer.style.display = 'flex';
        }
        
        // Use the same animation sequence as initial load
        this.selectRandomIllustration();
        this.fadeInContentSequence();
    }

    /**
     * Reset Section 1 content to clean state
     */
    resetSection1Content() {
        // Remove all animation classes and inline styles
        document.querySelectorAll('#section-1 .row-1, #section-1 .row-2, #section-1 .row-3, #section-1 .row-4, #section-1 .row-5').forEach(row => {
            row.classList.remove('fade-in', 'fade-out');
            row.style.opacity = '';
            row.style.transform = '';
            row.style.transition = '';
        });
        
        // Reset illustration
        if (this.randomIllustration) {
            this.randomIllustration.classList.remove('fade-in', 'fade-out');
            this.randomIllustration.style.opacity = '';
            this.randomIllustration.style.transform = '';
            this.randomIllustration.style.transition = '';
        }
        
        // Reset CTA button
        if (this.requestReferencesBtn) {
            this.requestReferencesBtn.classList.remove('fade-in', 'fade-out', 'cta-button--visible');
            this.requestReferencesBtn.style.opacity = '';
            this.requestReferencesBtn.style.transform = '';
            this.requestReferencesBtn.style.transition = '';
        }
        
        // Reset arrow
        if (this.arrowDown) {
            this.arrowDown.classList.remove('fade-in', 'fade-out', 'nav-arrow--visible');
            this.arrowDown.style.opacity = '';
            this.arrowDown.style.transform = '';
            this.arrowDown.style.transition = '';
        }
    }

    /**
     * Fade in content in the correct sequence (Section 1 only)
     */
    fadeInContentSequence() {
        const fadeIn = (selector, delay) => {
            setTimeout(() => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.remove('fade-out');
                    element.classList.add('fade-in');
                }
            }, delay);
        };

        // Step 1: Illustration fades in first
        fadeIn('#section-1 .row-3', 0);
        setTimeout(() => {
            if (this.randomIllustration) {
                this.randomIllustration.classList.add('fade-in');
            }
        }, 0);
        
        // Step 2: Logo (row-1) fades in after illustration
        fadeIn('#section-1 .row-1', 800);
        
        // Step 3: Text (row-2) fades in
        fadeIn('#section-1 .row-2', 1000);
        
        // Step 4: CTA button (row-4) fades in
        fadeIn('#section-1 .row-4', 1600);
        
        // Step 5: Arrow (row-5) fades in last
        fadeIn('#section-1 .row-5', 2000);
        
        // Also fade in CTA button and arrow with their respective rows
        setTimeout(() => {
            if (this.requestReferencesBtn) {
                this.requestReferencesBtn.classList.add('fade-in');
                this.requestReferencesBtn.classList.add('cta-button--visible');
            }
        }, 1600);
        
        setTimeout(() => {
            if (this.arrowDown) {
                this.arrowDown.classList.add('fade-in');
                this.arrowDown.classList.add('nav-arrow--visible');
            }
        }, 2000);
    }

    /**
     * Get the next illustration in sequence without loading it
     */
    getNextIllustration() {
        // Move to next animation in sequence
        this.currentAnimationIndex = (this.currentAnimationIndex + 1) % this.illustrations.length;
        const selectedIllustration = this.illustrations[this.currentAnimationIndex];
        
        // Update the last selected illustration
        this.lastSelectedIllustration = selectedIllustration;
        
        return selectedIllustration;
    }

    /**
     * Select and display the next illustration in sequence
     * Cycles through animations 1,2,3,4,5 with random starting point
     * Ensures no consecutive duplicates across page refreshes
     */
    selectRandomIllustration() {
        // Prevent multiple rapid calls
        if (this.isSelectingIllustration) {
            return;
        }
        
        this.isSelectingIllustration = true;
        
        // If this is the first selection, pick a random starting point
        if (this.currentAnimationIndex === -1) {
            this.currentAnimationIndex = Math.floor(Math.random() * this.illustrations.length);
        } else {
            // Move to next animation in sequence
            this.currentAnimationIndex = (this.currentAnimationIndex + 1) % this.illustrations.length;
        }
        
        const selectedIllustration = this.illustrations[this.currentAnimationIndex];
        
        // Update the last selected illustration
        this.lastSelectedIllustration = selectedIllustration;
        
        // Ensure image is completely hidden and cleared first
        this.randomIllustration.src = '';
        this.randomIllustration.alt = '';
        this.randomIllustration.style.opacity = '0';
        
        // Small delay to ensure clearing is processed
        setTimeout(() => {
            // Load the new illustration with cache busting
            const cacheBuster = Date.now();
            this.randomIllustration.src = `${selectedIllustration}?v=${cacheBuster}`;
            this.randomIllustration.alt = `FieldTrip Illustration - ${selectedIllustration.split('/').pop().split('.')[0]}`;
            
            // Fade in image after it's loaded
            this.randomIllustration.onload = () => {
                setTimeout(() => {
                    this.randomIllustration.classList.add('fade-in');
                }, 50);
            };
        }, 50);
        
        // Reset the flag after a short delay
        setTimeout(() => {
            this.isSelectingIllustration = false;
        }, 100);
    }

    /**
     * Fade in content after illustration is shown
     */
    fadeInContent() {
        // Fade in rows 1, 2, 4 for section 1 (row-3 animation and row-5 arrow already visible)
        if (this.currentSection === 1) {
            const rows = document.querySelectorAll('.row-1, .row-2, .row-4');
            rows.forEach((row, index) => {
                setTimeout(() => {
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                    row.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                }, index * 200); // Stagger the animations
            });
            
            // Make sure CTA button is visible after row-4 fades in
            setTimeout(() => {
                this.requestReferencesBtn.classList.add('cta-button--visible');
            }, 600);
        }
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Navigation arrows - simple approach like down arrow
        this.arrowDown.addEventListener('click', () => this.navigateToSection(2));
        this.arrowUp.addEventListener('click', () => this.navigateToSection(1));
        
        // Contact buttons
        this.requestReferencesBtn.addEventListener('click', () => this.openContactOverlay());
        this.contactUsBtn.addEventListener('click', () => this.openContactOverlay());
        
        // Overlay close
        this.overlayClose.addEventListener('click', () => this.closeContactOverlay());
        this.contactOverlay.addEventListener('click', (e) => {
            if (e.target === this.contactOverlay) {
                this.closeContactOverlay();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Prevent scroll
        // Completely disable scroll behavior
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        document.addEventListener('scroll', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Consolidated viewport handling - --vh is handled by global setVHVar()
        const handleViewportChange = () => {
            setTimeout(() => {
                this.populateContent();
                this.adjustMobileViewport();
            }, 100);
        };
        
        // Window resize - update content for mobile/desktop
        window.addEventListener('resize', handleViewportChange);
        
        // Handle mobile viewport changes (address bar show/hide)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustMobileViewport();
            }, 500);
        });
        
        // Handle scroll events that might trigger browser UI changes
        window.addEventListener('scroll', () => {
            if (this.isMobile()) {
                setTimeout(() => {
                    this.adjustMobileViewport();
                }, 100);
            }
        });
        
        // Handle focus events that might trigger browser UI changes
        window.addEventListener('focus', () => {
            if (this.isMobile()) {
                setTimeout(() => {
                    this.adjustMobileViewport();
                }, 100);
            }
        });
        
        // Handle visibility change events (tab switching, etc.)
        document.addEventListener('visibilitychange', () => {
            if (this.isMobile() && !document.hidden) {
                setTimeout(() => {
                    this.adjustMobileViewport();
                }, 200);
            }
        });
        
        // Initial mobile viewport adjustment
        this.adjustMobileViewport();
    }

    /**
     * Adjust mobile viewport to account for browser UI and scale content if needed
     */
    adjustMobileViewport() {
        if (this.isMobile()) {
            // --vh is now handled by global setVHVar() function
            // Calculate if content needs scaling
            //this.scaleContentToFitViewport();
        }
    }
    
    /**
     * Scale content to fit within viewport height, ensuring down arrow is always visible
     */
    scaleContentToFitViewport() {
        const viewportHeight = window.innerHeight;
        const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0');
        const availableHeight = viewportHeight - safeAreaBottom;
        
        // Get actual content height by measuring the current section
        const currentSection = document.querySelector('.section--active');
        if (!currentSection) return;
        
        // Skip scaling for Section 2 - it's designed to be static and fit naturally
        if (currentSection.id === 'section-2') {
            console.log('Skipping scaling for Section 2 - designed to be static');
            this.resetContentScaling();
            return;
        }
        
        console.log('Scaling check for section:', currentSection.id, {
            viewportHeight,
            availableHeight,
            safeAreaBottom
        });
        
        // Temporarily make content visible to measure it
        const originalDisplay = currentSection.style.display;
        currentSection.style.display = 'block';
        currentSection.style.visibility = 'visible';
        
        // Measure actual content height
        const contentHeight = currentSection.scrollHeight;
        
        console.log('Content measurement:', {
            contentHeight,
            originalDisplay,
            currentDisplay: currentSection.style.display
        });
        
        // Restore original display
        currentSection.style.display = originalDisplay;
        
        // Calculate scale factor needed to fit content
        const scaleFactor = Math.min(1, availableHeight / contentHeight);
        
        // Only scale if content is significantly too tall (scale factor < 0.9)
        // This prevents unnecessary scaling on minor height differences
        if (scaleFactor < 0.9) {
            console.log('Content scaling applied:', { scaleFactor, viewportHeight, contentHeight, availableHeight });
            this.applyContentScaling(scaleFactor);
        } else {
            console.log('Content scaling reset - no scaling needed:', { scaleFactor, viewportHeight, contentHeight, availableHeight });
            this.resetContentScaling();
        }
    }
    
    /**
     * Calculate minimum height needed for all content
     */
    calculateMinimumContentHeight() {
        // Base heights for each row (approximate)
        const row1Height = 100; // Logo
        const row2Height = 80;  // Description
        const row3MinHeight = 200; // Animation (minimum)
        const row4Height = 80;  // Button
        const row5Height = 120; // Arrow with protection
        
        return row1Height + row2Height + row3MinHeight + row4Height + row5Height;
    }
    
    /**
     * Apply content scaling to fit viewport
     */
    applyContentScaling(scaleFactor) {
        // Set minimum scale factor to prevent content from becoming too small
        const minScale = 0.8; // Increased from 0.6 to be less aggressive
        const finalScale = Math.max(scaleFactor, minScale);
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.style.transform = `scale(${finalScale})`;
            appContainer.style.transformOrigin = 'top center';
            appContainer.style.height = `${100 / finalScale}vh`;
            appContainer.style.overflow = 'hidden';
            
            // Add smooth transition for scaling
            appContainer.style.transition = 'transform 0.3s ease-out';
        }
        
        // Scale individual sections for better control
        document.querySelectorAll('.section').forEach(section => {
            section.style.transform = `scale(${finalScale})`;
            section.style.transformOrigin = 'top center';
            section.style.transition = 'transform 0.3s ease-out';
        });
        
        // Content scaled to fit viewport
    }
    
    /**
     * Reset content scaling
     */
    resetContentScaling() {
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.style.transform = 'scale(1)';
            appContainer.style.transformOrigin = 'top center';
            appContainer.style.height = '100vh';
            appContainer.style.overflow = 'hidden';
            appContainer.style.transition = 'transform 0.3s ease-out';
        }
        
        document.querySelectorAll('.section').forEach(section => {
            section.style.transform = 'scale(1)';
            section.style.transformOrigin = 'top center';
            section.style.transition = 'transform 0.3s ease-out';
        });
        
        // Content scaling reset to 100%
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (this.isTransitioning) return;
        
        switch(e.key) {
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                e.stopPropagation();
                this.navigateToSection(this.currentSection + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                this.navigateToSection(this.currentSection - 1);
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                if (this.contactOverlay.classList.contains('contact-overlay--visible')) {
                    this.closeContactOverlay();
                }
                break;
        }
    }

    /**
     * Navigate between sections with smooth transitions
     */
    navigateToSection(sectionNumber) {
        if (this.isTransitioning) return;
        if (sectionNumber < 1 || sectionNumber > this.sections.length) return;
        if (sectionNumber === this.currentSection) return;

        this.isTransitioning = true;
        
        // Reset any content scaling before transition
        this.resetContentScaling();
        
        const previousSection = this.currentSection;
        this.currentSection = sectionNumber;
        
        // CRITICAL: Hide entire illustration container when leaving section 1
        if (previousSection === 1) {
            const illustrationContainer = document.querySelector('.illustration-container');
            if (illustrationContainer) {
                illustrationContainer.style.display = 'none';
            }
        }
        
        // Hide current content and arrows
        this.hideCurrentContent(previousSection);
        
        // Update section visibility
        this.updateSections();
        
        // Show new content after transition
        setTimeout(() => {
            this.showNewContent();
            // Reset any problematic inline styles that might interfere with links
            this.resetSectionStyles();
            // Recalculate scaling for new section
            if (this.isMobile()) {
                setTimeout(() => {
                    //this.scaleContentToFitViewport(); <-- Disable for now. Try to fix with CSS.
                }, 100);
            }
            this.isTransitioning = false;
        }, 800);
    }

    /**
     * Hide current section content and arrows
     */
    hideCurrentContent(sectionNumber) {
        const currentContent = document.querySelector(`#section-${sectionNumber} .section__content`);
        const currentArrow = document.querySelector(`#section-${sectionNumber} .nav-arrow`);
        
        if (currentContent) {
            currentContent.classList.add('section__content--hidden');
            currentContent.classList.remove('section__content--visible');
        }
        
        if (currentArrow) {
            currentArrow.classList.remove('nav-arrow--visible');
        }
        
        // Hide CTA buttons
        document.querySelectorAll('.cta-button').forEach(btn => {
            btn.classList.remove('cta-button--visible');
        });
    }
    
    /**
     * Clear section 1 illustration to prevent flash when returning
     * REMOVED - This method is no longer used, container hiding approach is used instead
     */

    /**
     * Show new section content and arrows
     */
    showNewContent() {
        if (this.currentSection === 1) {
            // Treat this like a fresh page load - start completely clean
            this.initializeSection1LikeFreshLoad();
        } else if (this.currentSection === 2) {
            // Show logo and up arrow immediately
            const section2Logo = document.querySelector('#section-2 .section__logo--header');
            if (section2Logo) {
                section2Logo.style.opacity = '1';
                section2Logo.style.transform = 'translateY(0)';
            }
            
            this.arrowUp.classList.add('nav-arrow--visible');
            
            // Show text and button after a delay
            setTimeout(() => {
                this.contactUsBtn.classList.add('cta-button--visible');
                this.ensureBottomButtonVisibility();
            }, 400);
        }
    }
    
    /**
     * Ensure bottom arrow is always visible and protected
     */
    ensureBottomArrowVisibility() {
        if (this.isMobile()) {
            const row5 = document.querySelector('.row-5');
            if (row5) {
                // Force visibility and protection
                row5.style.display = 'flex';
                row5.style.alignItems = 'center';
                row5.style.justifyContent = 'center';
                row5.style.position = 'relative';
                row5.style.zIndex = '10';
                row5.style.minHeight = '120px';
                
                // Ensure arrow is visible
                if (this.arrowDown) {
                    this.arrowDown.style.visibility = 'visible';
                    this.arrowDown.style.opacity = '1';
                    this.arrowDown.style.position = 'relative';
                    this.arrowDown.style.zIndex = '11';
                }
            }
        }
    }

    /**
     * Reset z-index and positioning after section transitions
     */
    resetSectionStyles() {
        // Reset all inline z-index values that might interfere
        const elementsToReset = [
            '.row-5',
            '.nav-arrow',
            '.cta-button',
            '#section-1 .row-5',
            '#section-2 .row-4'
        ];
        
        elementsToReset.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Only reset if we're on the active section
                const section = el.closest('.section--active');
                if (section) {
                    // Remove problematic inline styles
                    el.style.removeProperty('z-index');
                    el.style.removeProperty('position');
                    // Ensure pointer events work
                    el.style.pointerEvents = 'auto';
                }
            });
        });
    }
    
    /**
     * Ensure bottom button is always visible and protected
     */
    ensureBottomButtonVisibility() {
        if (this.isMobile()) {
            const section2Button = document.querySelector('#section-2 .cta-button');
            const section2Row4 = document.querySelector('#section-2 .row-4');
            
            if (section2Button) {
                section2Button.style.visibility = 'visible';
                section2Button.style.opacity = '1';
                section2Button.style.position = 'relative';
                section2Button.style.zIndex = '11';
            }
            
            if (section2Row4) {
                section2Row4.style.display = 'flex';
                section2Row4.style.alignItems = 'center';
                section2Row4.style.justifyContent = 'center';
                section2Row4.style.position = 'relative';
                section2Row4.style.zIndex = '10';
                section2Row4.style.minHeight = '120px';
            }
        }
    }

    /**
     * Update section visibility
     */
    updateSections() {
        this.sections.forEach((section, index) => {
            const sectionNumber = index + 1;
            
            if (sectionNumber === this.currentSection) {
                section.classList.add('section--active');
            } else {
                section.classList.remove('section--active');
            }
        });
    }

    /**
     * Open contact overlay with animation
     */
    openContactOverlay() {
        // Button press animation
        const button = event.target;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
        
        // Get current copytexts
        const isMobile = this.isMobile();
        const currentCopytexts = this.getCurrentCopytexts();
        
        // Rebuilding contact overlay for current device
        
        // Completely rebuild the contact info content
        const contactInfo = document.querySelector('.contact-info');
        contactInfo.innerHTML = ''; // Clear everything
        
        // Create intro element
        const introElement = document.createElement('p');
        introElement.className = 'contact-intro';
        introElement.id = 'contact-intro';
        
        // Set content based on mobile/desktop
        if (isMobile) {
            // Mobile: Force line break
            introElement.innerHTML = 'Contact us for<br>more information:';
            // Mobile line breaks applied
        } else {
            // Desktop: Use JSON content
            introElement.innerHTML = currentCopytexts.contact.intro.replace(/\n/g, '<br>');
            // Desktop content applied
        }
        
        // Create contact details container
        const detailsElement = document.createElement('div');
        detailsElement.className = 'contact-details';
        
        // Create email link
        const emailLink = document.createElement('a');
        emailLink.className = 'contact-email';
        emailLink.id = 'contact-email';
        emailLink.href = `mailto:${currentCopytexts.contact.email}`;
        emailLink.textContent = currentCopytexts.contact.email;
        
        // Create phone span
        const phoneSpan = document.createElement('span');
        phoneSpan.className = 'contact-phone';
        phoneSpan.id = 'contact-phone';
        phoneSpan.textContent = currentCopytexts.contact.phone;
        
        // Assemble the structure - separate lines for mobile, same line for desktop
        detailsElement.appendChild(emailLink);
        if (isMobile) {
            detailsElement.appendChild(document.createElement('br')); // Line break between email and phone on mobile
        }
        detailsElement.appendChild(phoneSpan);
        
        contactInfo.appendChild(introElement);
        contactInfo.appendChild(detailsElement);
        
        // Contact overlay content ready
        
        // Show overlay
        this.contactOverlay.classList.add('contact-overlay--visible');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close contact overlay with animation
     */
    closeContactOverlay() {
        this.contactOverlay.classList.remove('contact-overlay--visible');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Ensure Section 1 links are clickable after overlay closes
        setTimeout(() => {
            this.resetSectionStyles();
        }, 100);
    }

    /**
     * Get current section number
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Get total number of sections
     */
    getTotalSections() {
        return this.sections.length;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.fieldTripApp = new FieldTripApp();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldTripApp;
}