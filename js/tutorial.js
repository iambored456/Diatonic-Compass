import { gsap } from "gsap";
import { appState } from './state/appState.js';
import { indexAtTop } from './core/math.js';
import { ActionController } from './core/ActionController.js';

/**
 * Speaks text and returns a Promise that resolves when done.
 */
function speak(text) {
    return new Promise((resolve, reject) => {
        window.speechSynthesis.cancel();
        const tempElem = document.createElement('div');
        tempElem.innerHTML = text;
        const cleanText = tempElem.textContent || tempElem.innerText || "";
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = resolve;
        utterance.onerror = reject;
        setTimeout(() => window.speechSynthesis.speak(utterance), 50);
    });
}

/**
 * Creates a "spotlight" hole in the mask for the target element.
 */
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

/**
 * Closes the spotlight hole.
 */
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
function waitForInteractionEnd(ringKey) {
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
    ActionController.toggleSidebar(false);
    if (window.diatonicCompassTutorial) window.diatonicCompassTutorial.kill();
    const tl = gsap.timeline({ onComplete: () => window.diatonicCompassTutorial = null });
    window.diatonicCompassTutorial = tl;

    const doStep = (config) => {
        tl.call(async () => {
            tl.pause();
            gsap.set("#tutorial-text", { autoAlpha: 0, innerHTML: config.text });
            gsap.to("#tutorial-text", { autoAlpha: 1, duration: 0.4 });
            if (config.highlightTarget) {
                showSpotlight(config.highlightTarget);
                addHighlight(config.highlightTarget);
            }
            await speak(config.text);
            if (config.waitFor) {
                await config.waitFor();
            }
            if (config.highlightTarget) {
                removeHighlight(config.highlightTarget);
                hideSpotlight();
            }
            await new Promise(resolve => setTimeout(resolve, 500)); 
            tl.resume();
        });
    };

    tl.to("#tutorial-mask", { autoAlpha: 1, duration: 0.3 });
    tl.set("#tutorial-bubble", { autoAlpha: 1 });

    doStep({ text: "Welcome to the <strong>Diatonic Compass!</strong>" });
    doStep({ text: "Rotate the <strong>Pitch</strong> belt so we leave <strong>C Major.</strong>", highlightTarget: ".pitch-belt", waitFor: () => waitForInteractionEnd('pitchClass') });
    doStep({ text: "Nice! <br>Change the <strong>mode</strong> by spinning the <strong>Degree belt.</strong>", highlightTarget: ".degree-belt", waitFor: () => waitForInteractionEnd('degree') });
    doStep({ text: "Wonderful!<br>Now shift the perspective by spinning the <strong>Chromatic belt</strong>.", highlightTarget: ".chromatic-belt", waitFor: () => waitForInteractionEnd('chromatic') });

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
}