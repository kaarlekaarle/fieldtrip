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
        
        // Hide up arrow initially
        this.arrowUp.classList.remove('nav-arrow--visible');
        
        // Hide contact overlay
        this.contactOverlay.classList.remove('contact-overlay--visible');
        
        // CTA button will be shown by animation sequence
        
        // Ensure proper section positioning
        this.updateSections();
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
     * Hide element with standard animation state
     */
    hideElement(element) {
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
        }
    }

    /**
     * Hide all content for animation sequence (Section 1 only)
     */
    hideAllContentForAnimation() {
        // Hide Section 1 rows including row-3 (illustration)
        document.querySelectorAll('#section-1 .row-1, #section-1 .row-2, #section-1 .row-3, #section-1 .row-4, #section-1 .row-5').forEach(row => {
            row.classList.add('fade-out');
            this.hideElement(row);
        });
        
        // Hide illustration specifically
        this.hideElement(this.randomIllustration);
        
        // Hide CTA button
        this.hideElement(this.requestReferencesBtn);
        
        // Hide down arrow (different transform for arrow)
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
            this.hideElement(row);
            row.style.transition = 'none';
        });
        
        // Hide illustration immediately
        if (this.randomIllustration) {
            this.hideElement(this.randomIllustration);
            this.randomIllustration.style.transition = 'none';
        }
        
        // Hide CTA button immediately
        if (this.requestReferencesBtn) {
            this.hideElement(this.requestReferencesBtn);
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
        // First, completely reset all content to clean state (same as initial load)
        this.resetSection1Content();
        
        // Then hide all content for animation sequence
        this.hideAllContentForAnimation();
        
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
     * Initialize Section 1 for return transition (simplified - no randomization, no fade-in)
     */
    initializeSection1ForReturn() {
        // Reset all content to clean state
        this.resetSection1Content();
        
        // Ensure illustration container is visible
        const illustrationContainer = document.querySelector('.illustration-container');
        if (illustrationContainer) {
            illustrationContainer.style.display = 'flex';
        }
        
        // Show all elements immediately (no fade-in animation)
        // Show all Section 1 rows immediately
        document.querySelectorAll('#section-1 .row-1, #section-1 .row-2, #section-1 .row-3, #section-1 .row-4').forEach(row => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
            row.style.transition = 'none';
        });
        
        // Show illustration immediately (keep current illustration, no randomization)
        if (this.randomIllustration) {
            this.randomIllustration.style.opacity = '1';
            this.randomIllustration.style.transform = 'translateY(0)';
            this.randomIllustration.style.transition = 'none';
        }
        
        // Show CTA button immediately
        if (this.requestReferencesBtn) {
            this.requestReferencesBtn.style.opacity = '1';
            this.requestReferencesBtn.style.transform = 'translateY(0)';
            this.requestReferencesBtn.style.transition = 'none';
            this.requestReferencesBtn.classList.add('cta-button--visible');
        }
        
        // Arrow will be shown by showNewContent() after transition completes
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
     * Improved animation: logo → text → button with consistent timing
     */
    fadeInContentSequence() {
        const animateElement = (selector, delay) => {
            setTimeout(() => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.remove('fade-out');
                    element.classList.add('fade-in');
                }
            }, delay);
        };

        // Step 1: Illustration fades in first (immediate)
        animateElement('#section-1 .row-3', 0);
        setTimeout(() => {
            if (this.randomIllustration) {
                this.randomIllustration.classList.add('fade-in');
            }
        }, 0);
        
        // Step 2: Logo animates first (after illustration is ready)
        animateElement('#section-1 .row-1', 600);
        
        // Step 3: Text animates second (300ms after logo)
        animateElement('#section-1 .row-2', 900);
        
        // Step 4: Button animates third (300ms after text)
        animateElement('#section-1 .row-4', 1200);
        setTimeout(() => {
            if (this.requestReferencesBtn) {
                this.requestReferencesBtn.classList.add('fade-in');
                this.requestReferencesBtn.classList.add('cta-button--visible');
            }
        }, 1200);
        
        // Step 5: Arrow animates last (300ms after button)
        animateElement('#section-1 .row-5', 1500);
        setTimeout(() => {
            if (this.arrowDown) {
                this.arrowDown.classList.add('fade-in');
                this.arrowDown.classList.add('nav-arrow--visible');
            }
        }, 1500);
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
            const rows = document.querySelectorAll('.row-1, .row-2, .row-4, .row-5');
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
            this.resetContentScaling();
            return;
        }
        
        // Scaling check for section
        
        // Temporarily make content visible to measure it
        const originalDisplay = currentSection.style.display;
        currentSection.style.display = 'block';
        currentSection.style.visibility = 'visible';
        
        // Measure actual content height
        const contentHeight = currentSection.scrollHeight;
        
        // Content measurement
        
        // Restore original display
        currentSection.style.display = originalDisplay;
        
        // Calculate scale factor needed to fit content
        const scaleFactor = Math.min(1, availableHeight / contentHeight);
        
        // Only scale if content is significantly too tall (scale factor < 0.9)
        // This prevents unnecessary scaling on minor height differences
        if (scaleFactor < 0.9) {
            this.applyContentScaling(scaleFactor);
        } else {
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
            // Preserve mobile arrow protection for section 1 row-5
            if (section.id === 'section-1') {
                const row5 = section.querySelector('.row-5');
                if (row5 && this.isMobile()) {
                    // Don't reset styles for mobile arrow protection
                    return;
                }
            }
            
            section.style.transform = '';
            section.style.transformOrigin = '';
            section.style.transition = '';
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
        
        // Hide arrows during transition so they don't move with content
        this.arrowDown.classList.remove('nav-arrow--visible');
        this.arrowUp.classList.remove('nav-arrow--visible');
        
        // Reset any content scaling before transition
        this.resetContentScaling();
        
        this.previousSection = this.currentSection;
        this.currentSection = sectionNumber;
        
        // Update section visibility with a small delay to allow CSS transition
        setTimeout(() => {
            // If transitioning to section 1, use simplified return logic
            if (this.currentSection === 1) {
                this.initializeSection1ForReturn();
            }
            
            this.updateSections();
        }, 10);
        
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
        }, 1000);
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
            // Hide up arrow, show down arrow
            this.arrowUp.classList.remove('nav-arrow--visible');
            this.arrowDown.classList.add('nav-arrow--visible');
            // Ensure mobile arrow protection is restored
            this.ensureBottomArrowVisibility();
            // Content already initialized by initializeSection1ForReturn() - no additional animation needed
        } else if (this.currentSection === 2) {
            // Hide down arrow, show up arrow
            this.arrowDown.classList.remove('nav-arrow--visible');
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
            }, 600);
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
                // Don't override position - let CSS handle absolute positioning
                section2Button.style.zIndex = '11';
            }
            
            if (section2Row4) {
                // Don't override CSS positioning - let absolute positioning work
                section2Row4.style.zIndex = '10';
                // Don't set position, display, or minHeight - let CSS handle it
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
                section.classList.remove('section--exiting-up', 'section--exiting-down');
            } else if (sectionNumber === this.previousSection) {
                // Determine direction based on section numbers
                const isGoingDown = this.currentSection > this.previousSection;
                
                if (isGoingDown) {
                    // Previous section slides up and out
                    section.classList.add('section--exiting-up');
                } else {
                    // Previous section slides down and out
                    section.classList.add('section--exiting-down');
                }
                section.classList.remove('section--active');
            } else {
                // Other sections stay hidden below
                section.classList.remove('section--active', 'section--exiting-up', 'section--exiting-down');
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
        
        // Build content BEFORE any transitions to avoid DOM manipulation during CSS animations
        this.buildContactOverlayContent(isMobile, currentCopytexts);
        
        // Use requestAnimationFrame to ensure DOM is ready, then start pure CSS transition
        requestAnimationFrame(() => {
            this.contactOverlay.classList.add('contact-overlay--visible');
            this.setThemeColor('#ffffff');
            document.body.style.overflow = 'hidden';
        });
    }

    /**
     * Build contact overlay content (separated for cleaner code)
     */
    buildContactOverlayContent(isMobile, currentCopytexts) {
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
    }

    /**
     * Close contact overlay with animation
     */
    closeContactOverlay() {
        this.contactOverlay.classList.remove('contact-overlay--visible');
        
        // Restore browser chrome color to site background
        this.setThemeColor('#d7d3c1');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Ensure Section 1 links are clickable after overlay closes
        setTimeout(() => {
            this.resetSectionStyles();
        }, 600); // Wait for CSS transition to complete (500ms + 100ms buffer)
    }

    /**
     * Set theme color for browser chrome (iOS Safari)
     */
    setThemeColor(color) {
        const themeColorMeta = document.getElementById('theme-color-meta');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', color);
        }
        
        // For iOS Safari 17+, also set CSS custom property
        document.documentElement.style.setProperty('--theme-color', color);
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