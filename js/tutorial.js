import { gsap } from "gsap";
import { appState } from './state/appState.js';
import { indexAtTop } from './core/math.js';
import { ActionController } from './core/ActionController.js';

/**
 * Speaks text and returns a Promise that resolves when done.
 */
function speak(text) {
    return new Promise((resolve, reject) => {
        console.log('Speech function called with text:', text);
        window.speechSynthesis.cancel();
        const tempElem = document.createElement('div');
        tempElem.innerHTML = text;
        const cleanText = tempElem.textContent || tempElem.innerText || "";
        console.log('Clean text for speech:', cleanText);
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => {
            console.log('Speech utterance ended');
            resolve();
        };
        utterance.onerror = (error) => {
            console.error('Speech utterance error:', error);
            reject(error);
        };
        
        console.log('Starting speech after 50ms delay');
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
            console.log('Speech synthesis.speak() called');
        }, 50);
    });
}


function showSpotlight(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const padding = 10;
    const top = (rect.top - padding) / window.innerHeight * 100;
    const left = (rect.left - padding) / window.innerWidth * 100;
    const right = (rect.right + padding) / window.innerWidth * 100;
    const bottom = (rect.bottom + padding) / window.innerHeight * 100;
    const clipPathValue = `polygon(0% 0%, 0% 100%, ${left}% 100%, ${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%, ${left}% 100%, 100% 100%, 100% 0%, 0% 0%)`;
    gsap.to("#tutorial-mask", { clipPath: clipPathValue, duration: 0.4, ease: "power2.inOut" });
}


function hideSpotlight() {
    gsap.to("#tutorial-mask", { 
        clipPath: "polygon(0% 0%, 0% 100%, 50% 100%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 100%, 100% 100%, 100% 0%, 0% 0%)",
        duration: 0.4, 
        ease: "power2.inOut"
    });
}

/**
 * Elevates an element above the mask and applies a glowing highlight.
 */
function addHighlight(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    gsap.to(target, {
        position: 'relative',
        zIndex: 2001,
        boxShadow: "0 0 20px 8px #33c6dc",
        duration: 0.4
    });
}

/**
 * Removes the highlight and returns the element to its original state.
 */
function removeHighlight(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    gsap.to(target, {
        boxShadow: "0 0 0px 0px rgba(51,198,220,0)",
        duration: 0.3,
        onComplete: () => gsap.set(target, { clearProps: "all" })
    });
}

/**
 * Waits for a user to start moving a belt, then waits for the drag and snap animation to complete.
 */
function awaitInteractionAndAnimation(ringKey) {
    return new Promise(resolve => {
        const initialValue = appState.rings[ringKey];
        let hasMoved = false;

        const check = () => {
            if (!hasMoved) {
                if (appState.rings[ringKey] !== initialValue) {
                    hasMoved = true;
                }
            } else {
                if (!appState.drag.active && !appState.animation) {
                    cancelAnimationFrame(reqId);
                    resolve();
                    return;
                }
            }
            reqId = requestAnimationFrame(check);
        };
        let reqId = requestAnimationFrame(check);
    });
}


export function startTutorial() {
    console.log('=== TUTORIAL START ===');
    ActionController.toggleSidebar(false);
    
    // Ensure tutorial elements are accessible
    const tutorialBubble = document.getElementById('tutorial-bubble');
    const tutorialMask = document.getElementById('tutorial-mask');
    const tutorialText = document.getElementById('tutorial-text');
    
    console.log('Tutorial elements check:', {
        tutorialBubble: !!tutorialBubble,
        tutorialMask: !!tutorialMask,
        tutorialText: !!tutorialText,
        bubbleStyles: tutorialBubble ? {
            opacity: tutorialBubble.style.opacity,
            visibility: tutorialBubble.style.visibility,
            display: getComputedStyle(tutorialBubble).display
        } : null,
        textStyles: tutorialText ? {
            opacity: tutorialText.style.opacity,
            visibility: tutorialText.style.visibility,
            display: getComputedStyle(tutorialText).display,
            innerHTML: tutorialText.innerHTML
        } : null
    });
    
    if (tutorialBubble && tutorialMask && tutorialText) {
      console.log('All tutorial elements found successfully');
    } else {
      console.error('Tutorial elements missing!', { tutorialBubble: !!tutorialBubble, tutorialMask: !!tutorialMask, tutorialText: !!tutorialText });
      return;
    }
    
    if (window.diatonicCompassTutorial) {
        console.log('Killing existing tutorial timeline');
        window.diatonicCompassTutorial.kill();
    }
    
    console.log('Creating new GSAP timeline');
    const tl = gsap.timeline({ 
        onComplete: () => {
            console.log('Tutorial timeline completed');
            window.diatonicCompassTutorial = null;
        }
    });
    window.diatonicCompassTutorial = tl;

    const doStep = (config) => {
        console.log('=== ADDING STEP TO TIMELINE ===', config.text);
        tl.call(async () => {
            console.log('=== EXECUTING STEP ===', config.text);
            tl.pause();
            
            // Set tutorial text with detailed logging
            const tutorialTextEl = document.getElementById('tutorial-text');
            const tutorialBubbleEl = document.getElementById('tutorial-bubble');
            
            console.log('Tutorial elements during step execution:', {
                textEl: !!tutorialTextEl,
                bubbleEl: !!tutorialBubbleEl,
                textElStyles: tutorialTextEl ? {
                    opacity: tutorialTextEl.style.opacity,
                    visibility: tutorialTextEl.style.visibility,
                    display: getComputedStyle(tutorialTextEl).display,
                    currentHTML: tutorialTextEl.innerHTML
                } : null,
                bubbleElStyles: tutorialBubbleEl ? {
                    opacity: tutorialBubbleEl.style.opacity,
                    visibility: tutorialBubbleEl.style.visibility,
                    display: getComputedStyle(tutorialBubbleEl).display
                } : null
            });
            
            if (tutorialTextEl) {
                console.log('BEFORE setting text - innerHTML:', tutorialTextEl.innerHTML);
                tutorialTextEl.innerHTML = config.text;
                tutorialTextEl.style.opacity = '1';
                tutorialTextEl.style.visibility = 'visible';
                console.log('AFTER setting text - innerHTML:', tutorialTextEl.innerHTML);
                console.log('Text element computed styles after update:', {
                    opacity: getComputedStyle(tutorialTextEl).opacity,
                    visibility: getComputedStyle(tutorialTextEl).visibility,
                    display: getComputedStyle(tutorialTextEl).display,
                    fontSize: getComputedStyle(tutorialTextEl).fontSize,
                    color: getComputedStyle(tutorialTextEl).color
                });
            } else {
                console.error('Tutorial text element not found during step execution!');
            }
            
            if (config.highlightTarget) {
                console.log('Adding highlight to:', config.highlightTarget);
                showSpotlight(config.highlightTarget);
                addHighlight(config.highlightTarget);
            }
            
            console.log('Starting speech synthesis for:', config.text);
            await speak(config.text);
            console.log('Speech synthesis completed');
            
            if (config.waitFor) {
                console.log('Waiting for user interaction...');
                await config.waitFor();
                console.log('User interaction completed');
            }
            
            if (config.highlightTarget) {
                console.log('Removing highlight from:', config.highlightTarget);
                removeHighlight(config.highlightTarget);
                hideSpotlight();
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Step completed, resuming timeline');
            tl.resume();
        });
    };

    // Show tutorial elements
    console.log('Adding tutorial mask animation to timeline');
    tl.to("#tutorial-mask", { autoAlpha: 1, duration: 0.3 });
    tl.call(() => {
      console.log('=== SHOWING TUTORIAL BUBBLE ===');
      // Show the dialog properly
      const bubble = document.getElementById('tutorial-bubble');
      const textEl = document.getElementById('tutorial-text');
      
      console.log('Bubble show elements check:', {
        bubble: !!bubble,
        textEl: !!textEl,
        bubbleCurrentStyles: bubble ? {
          opacity: bubble.style.opacity,
          visibility: bubble.style.visibility,
          display: getComputedStyle(bubble).display
        } : null,
        textCurrentStyles: textEl ? {
          opacity: textEl.style.opacity,
          visibility: textEl.style.visibility,
          innerHTML: textEl.innerHTML
        } : null
      });
      
      if (bubble) {
        console.log('Setting bubble visibility styles');
        bubble.style.display = 'block';
        bubble.style.opacity = '1';
        bubble.style.visibility = 'visible';
        bubble.setAttribute('aria-hidden', 'false');
        
        console.log('Bubble styles after setting:', {
          opacity: bubble.style.opacity,
          visibility: bubble.style.visibility,
          computedOpacity: getComputedStyle(bubble).opacity,
          computedVisibility: getComputedStyle(bubble).visibility,
          computedDisplay: getComputedStyle(bubble).display
        });
        
        console.log('Tutorial bubble shown successfully');
      } else {
        console.error('Tutorial bubble element not found during show!');
      }
    });

    doStep({ text: "Welcome to the <strong>Diatonic Compass!</strong>" });
    doStep({ text: "Rotate the <strong>Pitch</strong> belt so we leave <strong>C Major.</strong>", highlightTarget: ".pitch-belt", waitFor: () => awaitInteractionAndAnimation('pitchClass') });
    doStep({ text: "Nice! <br>Change the <strong>mode</strong> by spinning the <strong>Degree belt.</strong>", highlightTarget: ".degree-belt", waitFor: () => awaitInteractionAndAnimation('degree') });
    doStep({ text: "Wonderful!<br>Now shift the perspective by spinning the <strong>Chromatic belt</strong>.", highlightTarget: ".chromatic-belt", waitFor: () => awaitInteractionAndAnimation('chromatic') });

    // **THE FIX**: Animate the bubble up BEFORE the step starts.
    tl.to("#tutorial-bubble", { bottom: '110px', duration: 0.3, ease: 'power2.out' });

    doStep({
        text: "Almost there!<br> Tap the <strong>result bar</strong> to <strong>hear your scale.</strong>",
        highlightTarget: "#result-container",
        waitFor: async () => {
            await new Promise(resolve => {
                const check = () => appState.playback.isPlaying ? resolve() : requestAnimationFrame(check);
                check();
            });
            await new Promise(resolve => {
                const check = () => !appState.playback.isPlaying ? resolve() : requestAnimationFrame(check);
                check();
            });
        }
    });

    // **THE FIX**: Animate the bubble back down AFTER the step is complete.
    tl.to("#tutorial-bubble", { bottom: '20px', duration: 0.3, ease: 'power2.in' });

    doStep({ text: "You did it!<br><strong>Enjoy exploring.</strong>" });

    tl.to(["#tutorial-mask", "#tutorial-bubble"], { autoAlpha: 0, duration: 0.4, delay: 1 });
    tl.call(() => {
        const bubble = document.getElementById('tutorial-bubble');
        if (bubble) {
            bubble.style.display = 'none';
            console.log('Tutorial bubble hidden');
        }
    });
}