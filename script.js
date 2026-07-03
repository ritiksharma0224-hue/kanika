// Register GSAP TextPlugin
gsap.registerPlugin(TextPlugin);

// --- APP STATE VARIABLES ---
let audioCtx = null;
let bgMusic = null;
let isMuted = true;
let currentMusicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
let proceduralMusicNode = null; // Procedural music node if external loading fails
let evidenceOpenedCount = 0;
const openedExhibits = new Set();

// --- 1. AUDIO SYNTHESIS & SOUND SYSTEM ---

// Initialize Audio Context on user interaction
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Set up Background Music
    bgMusic = new Audio();
    bgMusic.src = currentMusicUrl;
    bgMusic.loop = true;
    bgMusic.volume = 0.35;
    
    // Attempt play
    bgMusic.play().then(() => {
        isMuted = false;
        updateAudioUI(true);
    }).catch(err => {
        console.warn("Autoplay blocked or URL failed. Ready to play on next click.", err);
        // Set up a procedural pad synthesizer as a fallback in case MP3 doesn't load
        setupProceduralMusicFallback();
    });
}

// Toggle mute state
function toggleMute() {
    initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    isMuted = !isMuted;
    
    if (isMuted) {
        if (bgMusic) bgMusic.pause();
        if (proceduralMusicNode) stopProceduralMusic();
        updateAudioUI(false);
    } else {
        if (bgMusic) {
            bgMusic.play().catch(() => {
                // If audio URL fails, start procedural fallback
                startProceduralMusic();
            });
        } else {
            startProceduralMusic();
        }
        updateAudioUI(true);
    }
}

function updateAudioUI(playing) {
    const btn = document.getElementById('audio-toggle-btn');
    const label = btn.querySelector('.audio-label');
    const icon = document.getElementById('audio-icon-svg');
    
    if (playing) {
        label.textContent = "Mute Music";
        btn.classList.add('playing');
        icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>';
    } else {
        label.textContent = "Play Music";
        btn.classList.remove('playing');
        icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>';
    }
}

// Procedural Ambient Synth Pad Fallback (Uses Web Audio nodes)
let chordsTimer = null;
function setupProceduralMusicFallback() {
    // Basic setup. Chords will be played in an interval if active
}

function startProceduralMusic() {
    if (!audioCtx) return;
    if (chordsTimer) return;
    
    let chordIndex = 0;
    const chords = [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
        [110.00, 146.83, 174.61, 220.00], // Fadd9 (A2, D3, F3, A3)
        [110.00, 130.81, 164.81, 196.00], // Am7 (A2, C3, E3, G3)
        [116.54, 146.83, 174.61, 220.00]  // G11 (G2, D3, F3, A3)
    ];

    function playChord(frequencies) {
        if (isMuted) return;
        const now = audioCtx.currentTime;
        const oscillators = [];
        
        // Master gain for the pad
        const padGain = audioCtx.createGain();
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.08, now + 2); // Soft attack
        padGain.gain.setValueAtTime(0.08, now + 6);
        padGain.gain.exponentialRampToValueAtTime(0.001, now + 9.8); // Smooth release
        padGain.connect(audioCtx.destination);
        
        frequencies.forEach(freq => {
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle'; // Smooth flute-like tone
            osc.frequency.setValueAtTime(freq, now);
            
            // Subtle vibrato
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.frequency.value = 0.5 + Math.random() * 0.5; // low frequency
            lfoGain.gain.value = 1.5; // pitch dev
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(padGain);
            lfo.start(now);
            osc.start(now);
            
            lfo.stop(now + 10);
            osc.stop(now + 10);
        });
    }
    
    // Play initial chord
    playChord(chords[chordIndex]);
    
    // Loop chords every 10 seconds
    chordsTimer = setInterval(() => {
        chordIndex = (chordIndex + 1) % chords.length;
        playChord(chords[chordIndex]);
    }, 10000);
}

function stopProceduralMusic() {
    if (chordsTimer) {
        clearInterval(chordsTimer);
        chordsTimer = null;
    }
}

// SYNTHESIZE: Realistic Courtroom Gavel Strike
function playGavelStrike() {
    initAudio();
    if (!audioCtx || isMuted) return;

    const now = audioCtx.currentTime;
    
    // 1. High-frequency crack (gavel contact)
    const crackGain = audioCtx.createGain();
    const crackFilter = audioCtx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1000, now);
    crackFilter.Q.setValueAtTime(3, now);
    
    // Noise buffer generation for the crack
    const bufferSize = audioCtx.sampleRate * 0.05; // 50ms crack
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    crackGain.gain.setValueAtTime(0.8, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    noise.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(audioCtx.destination);
    
    // 2. Mid-low wood body resonance (sound block impact)
    const bodyGain = audioCtx.createGain();
    const bodyOsc = audioCtx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(150, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(90, now + 0.15); // pitch drop
    
    bodyGain.gain.setValueAtTime(1.0, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25); // body decay
    
    bodyOsc.connect(bodyGain);
    bodyGain.connect(audioCtx.destination);
    
    // 3. Room Echo/Reverb simulation
    const echoGain = audioCtx.createGain();
    const delay = audioCtx.createDelay();
    const feedback = audioCtx.createGain();
    
    delay.delayTime.value = 0.08; // 80ms delay
    feedback.gain.value = 0.4;    // echo decay feedback
    echoGain.gain.value = 0.35;   // reverb mix volume
    
    bodyGain.connect(delay);
    crackGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(echoGain);
    echoGain.connect(audioCtx.destination);
    
    // Start nodes
    noise.start(now);
    bodyOsc.start(now);
    
    // Stop nodes
    bodyOsc.stop(now + 0.3);
}

// SYNTHESIZE: Realistic Paper Rustling / Flip
function playPaperFlip() {
    initAudio();
    if (!audioCtx || isMuted) return;

    const now = audioCtx.currentTime;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.25); // sweep frequency down
    filter.Q.setValueAtTime(1.5, now);
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.05); // quick attack
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // decay
    
    // Generate white noise buffer
    const bufferSize = audioCtx.sampleRate * 0.3; // 300ms paper flip
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noise.start(now);
}


// --- 2. DUST PARTICLES CANVAS SYSTEM ---

const dustCanvas = document.getElementById('dust-canvas');
const dustCtx = dustCanvas.getContext('2d');
let dustParticles = [];

function resizeDustCanvas() {
    dustCanvas.width = window.innerWidth;
    dustCanvas.height = window.innerHeight;
}

class DustMote {
    constructor() {
        this.reset();
        this.y = Math.random() * dustCanvas.height; // scatter initially
    }
    
    reset() {
        this.x = Math.random() * dustCanvas.width;
        this.y = dustCanvas.height + 10;
        this.size = Math.random() * 2 + 0.8;
        this.speedY = -(Math.random() * 0.4 + 0.1);
        this.speedX = Math.random() * 0.3 - 0.15;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.swaySpeed = Math.random() * 0.02 + 0.005;
        this.swayAmt = Math.random() * 1.5;
        this.angle = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.y += this.speedY;
        this.angle += this.swaySpeed;
        this.x += this.speedX + Math.sin(this.angle) * this.swayAmt * 0.1;
        
        // Fade out near top
        if (this.y < 100) {
            this.opacity -= 0.005;
        }
        
        if (this.y < 0 || this.opacity <= 0 || this.x < 0 || this.x > dustCanvas.width) {
            this.reset();
        }
    }
    
    draw() {
        // Draw outer glow circle
        dustCtx.beginPath();
        dustCtx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
        dustCtx.fillStyle = `rgba(212, 175, 55, ${this.opacity * 0.35})`;
        dustCtx.fill();
        
        // Draw inner core circle
        dustCtx.beginPath();
        dustCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        dustCtx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
        dustCtx.fill();
    }
}

function initDust() {
    resizeDustCanvas();
    dustParticles = [];
    const count = Math.min(60, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < count; i++) {
        dustParticles.push(new DustMote());
    }
}

function animateDust() {
    dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
    
    // Draw spotlight glow on landing page if active
    if (document.getElementById('landing-stage').classList.contains('active')) {
        const grad = dustCtx.createRadialGradient(
            dustCanvas.width / 2, 0, 50,
            dustCanvas.width / 2, 0, dustCanvas.height * 0.8
        );
        grad.addColorStop(0, 'rgba(243, 229, 171, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dustCtx.fillStyle = grad;
        dustCtx.fillRect(0, 0, dustCanvas.width, dustCanvas.height);
    }
    
    dustParticles.forEach(p => {
        p.update();
        p.draw();
    });
    
    requestAnimationFrame(animateDust);
}

// Spawn a temporary burst of dust particles at the bottom of the case file (on drop landing)
function triggerDustBurst(x, y) {
    const burstCount = 35;
    for (let i = 0; i < burstCount; i++) {
        const mote = new DustMote();
        mote.x = x + (Math.random() * 200 - 100);
        mote.y = y + (Math.random() * 20 - 10);
        mote.speedY = -(Math.random() * 2.5 + 0.5);
        mote.speedX = Math.random() * 4 - 2;
        mote.opacity = Math.random() * 0.8 + 0.2;
        mote.size = Math.random() * 3 + 1;
        dustParticles.push(mote);
        
        // Remove burst particles after they float away or fade
        setTimeout(() => {
            const index = dustParticles.indexOf(mote);
            if (index > -1) dustParticles.splice(index, 1);
        }, 3000);
    }
}


// --- 3. FIREWORKS CANVAS SYSTEM ---

const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx = fwCanvas.getContext('2d');
let fireworks = [];
let fwParticles = [];
let fireworksAnimationId = null;

function resizeFireworksCanvas() {
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
}

class FireworkRocket {
    constructor(targetX, targetY) {
        this.x = Math.random() * fwCanvas.width;
        this.y = fwCanvas.height + 10;
        this.targetX = targetX;
        this.targetY = targetY;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.duration = distance / (Math.random() * 3 + 7); // speed modifier
        
        this.vx = dx / this.duration;
        this.vy = dy / this.duration;
        this.trail = [];
        this.trailLength = 8;
        this.alpha = 1;
    }
    
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Close enough to target?
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < 12 || this.y <= this.targetY;
    }
    
    draw() {
        fwCtx.beginPath();
        if (this.trail.length > 1) {
            fwCtx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                fwCtx.lineTo(this.trail[i].x, this.trail[i].y);
            }
        } else {
            fwCtx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        }
        fwCtx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
        fwCtx.lineWidth = 2;
        fwCtx.stroke();
    }
}

class FireworkParticle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.12;
        this.friction = 0.96;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.hue = hue; // 0 = gold tones, 1 = red tones
    }
    
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        return this.alpha <= 0;
    }
    
    draw() {
        let colorString;
        let glowColorString;
        if (this.hue === 0) {
            // Gold Sparkler
            colorString = `rgba(${212 + Math.floor(Math.random() * 40)}, ${175 + Math.floor(Math.random() * 50)}, ${55}, ${this.alpha})`;
            glowColorString = `rgba(212, 175, 55, ${this.alpha * 0.3})`;
        } else {
            // Crimson Sparkler
            colorString = `rgba(${180 + Math.floor(Math.random() * 70)}, 10, 10, ${this.alpha})`;
            glowColorString = `rgba(180, 10, 10, ${this.alpha * 0.3})`;
        }
        
        // Draw outer glow circle
        fwCtx.beginPath();
        fwCtx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        fwCtx.fillStyle = glowColorString;
        fwCtx.fill();
        
        // Draw inner core circle
        fwCtx.beginPath();
        fwCtx.arc(this.x, this.y, Math.random() * 2 + 1, 0, Math.PI * 2);
        fwCtx.fillStyle = colorString;
        fwCtx.fill();
    }
}

function spawnExplosion(x, y) {
    const particleCount = Math.floor(Math.random() * 40) + 60;
    const isGold = Math.random() > 0.4;
    const hue = isGold ? 0 : 1;
    
    for (let i = 0; i < particleCount; i++) {
        fwParticles.push(new FireworkParticle(x, y, hue));
    }
}

function launchRandomFirework() {
    const targetX = Math.random() * fwCanvas.width * 0.8 + fwCanvas.width * 0.1;
    const targetY = Math.random() * fwCanvas.height * 0.5 + fwCanvas.height * 0.1;
    fireworks.push(new FireworkRocket(targetX, targetY));
}

let fwSpawnInterval = null;
function startFireworksLoop() {
    resizeFireworksCanvas();
    fireworks = [];
    fwParticles = [];
    
    // Periodically launch a rocket
    fwSpawnInterval = setInterval(launchRandomFirework, 1200);
    // Launch a few immediately
    launchRandomFirework();
    setTimeout(launchRandomFirework, 400);
    
    function updateFireworks() {
        // Draw trailing overlay for motion blur
        fwCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);
        
        // Update rockets
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const rocket = fireworks[i];
            rocket.draw();
            if (rocket.update()) {
                spawnExplosion(rocket.targetX, rocket.targetY);
                fireworks.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = fwParticles.length - 1; i >= 0; i--) {
            const p = fwParticles[i];
            p.draw();
            if (p.update()) {
                fwParticles.splice(i, 1);
            }
        }
        
        fireworksAnimationId = requestAnimationFrame(updateFireworks);
    }
    
    updateFireworks();
}

function stopFireworksLoop() {
    if (fwSpawnInterval) {
        clearInterval(fwSpawnInterval);
        fwSpawnInterval = null;
    }
    if (fireworksAnimationId) {
        cancelAnimationFrame(fireworksAnimationId);
        fireworksAnimationId = null;
    }
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
}

// Allow user to click to trigger a firework
fwCanvas.addEventListener('click', (e) => {
    fireworks.push(new FireworkRocket(e.clientX, e.clientY));
});


// --- 4. GSAP TIMELINES & WEBSITE FLOW ---

// Mouse Follow Glow Effect
document.addEventListener('mousemove', (e) => {
    const glow = document.getElementById('mouse-glow');
    gsap.to(glow, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.8,
        ease: "power2.out"
    });
});

// Interactive Parallax Background elements
document.addEventListener('mousemove', (e) => {
    const items = document.querySelectorAll('.floating-item');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    items.forEach(item => {
        const depth = parseFloat(item.getAttribute('data-depth'));
        const moveX = (mouseX - 0.5) * depth * 150;
        const moveY = (mouseY - 0.5) * depth * 150;
        
        gsap.to(item, {
            x: moveX,
            y: moveY,
            duration: 1.5,
            ease: "power1.out"
        });
    });
});

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
    initDust();
    animateDust();
    
    // Step 1: Animate Case File Drop from Top
    const caseFile = document.getElementById('case-file');
    
    // Set initial offscreen styles
    gsap.set(caseFile, {
        y: -1000,
        rotationX: 45,
        rotationY: -45,
        rotationZ: -10,
        scale: 0.8
    });
    
    // Drop animation
    gsap.to(caseFile, {
        y: 0,
        rotationX: 20,
        rotationY: -10,
        rotationZ: 0,
        scale: 1,
        duration: 1.6,
        ease: "bounce.out",
        delay: 0.5,
        onComplete: () => {
            triggerCaseFileArrivalEffects(caseFile);
        }
    });
});

// Sound + Shake + Dust on file land
function triggerCaseFileArrivalEffects(caseFile) {
    // Screen Shake effect
    const appContainer = document.querySelector('.app-container');
    const shakeTl = gsap.timeline();
    shakeTl.to(appContainer, { y: 15, duration: 0.08, ease: "power1.inOut" })
           .to(appContainer, { y: -10, duration: 0.08, ease: "power1.inOut" })
           .to(appContainer, { y: 6, duration: 0.08, ease: "power1.inOut" })
           .to(appContainer, { y: -3, duration: 0.08, ease: "power1.inOut" })
           .to(appContainer, { y: 0, duration: 0.1, ease: "power1.inOut" });
           
    // Trigger dust particle burst from file bottom
    const fileRect = caseFile.getBoundingClientRect();
    triggerDustBurst(fileRect.left + fileRect.width / 2, fileRect.bottom);
    
    // Audio trigger: Low thud synthesized
    playArrivalSound();
}

// Synthesize arrival thud (gavel style but lower pitched)
function playArrivalSound() {
    // Basic low frequency resonance
    if (!audioCtx || isMuted) return;
    const now = audioCtx.currentTime;
    const bodyGain = audioCtx.createGain();
    const bodyOsc = audioCtx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(80, now);
    bodyOsc.frequency.linearRampToValueAtTime(40, now + 0.3);
    
    bodyGain.gain.setValueAtTime(0.6, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    bodyOsc.connect(bodyGain);
    bodyGain.connect(audioCtx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.4);
}

// Action: Wax Seal Button Clicked (Break Wax Seal)
const waxSealBtn = document.getElementById('wax-seal-btn');
waxSealBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Stop opening logic redundancy
    openConfidentialFile();
});

// Alternatively, allow clicking the whole file
document.getElementById('case-file').addEventListener('click', () => {
    openConfidentialFile();
});

let fileOpened = false;
function openConfidentialFile() {
    if (fileOpened) return;
    fileOpened = true;
    
    // Play sounds
    initAudio();
    playPaperFlip();
    
    // Seal breaking sequence
    const waxSeal = document.getElementById('wax-seal');
    waxSeal.style.transition = 'none';
    
    // Split/break seal effect
    gsap.timeline()
        .to(waxSeal, {
            scale: 1.15,
            duration: 0.3,
            ease: "power2.out"
        })
        .to(waxSeal, {
            rotation: 180,
            opacity: 0,
            scale: 0.3,
            duration: 0.8,
            ease: "power2.in"
        });
        
    // Flip File Open in 3D
    gsap.to("#file-front", {
        rotationY: -130,
        duration: 1.5,
        transformOrigin: "left center",
        ease: "power2.inOut",
        onComplete: () => {
            // Trigger Golden Celebratory Confetti & Popup
            triggerCelebrationBurst();
            document.getElementById('surprise-modal').classList.add('active');
        }
    });
}

// Gold star/dot burst when seal breaks
function triggerCelebrationBurst() {
    const file = document.getElementById('case-file');
    const rect = file.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Inject stars into canvas
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const mote = new DustMote();
        mote.x = x;
        mote.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6 + 3;
        mote.speedX = Math.cos(angle) * spd;
        mote.speedY = Math.sin(angle) * spd;
        mote.opacity = 1.0;
        mote.size = Math.random() * 4 + 2;
        dustParticles.push(mote);
        
        setTimeout(() => {
            const idx = dustParticles.indexOf(mote);
            if (idx > -1) dustParticles.splice(idx, 1);
        }, 2000);
    }
}

// Action: Begin proceedings button click
document.getElementById('begin-proceedings-btn').addEventListener('click', () => {
    // Fade out Landing & Surprise modal
    document.getElementById('surprise-modal').classList.remove('active');
    
    gsap.timeline()
        .to("#landing-stage", {
            opacity: 0,
            scale: 0.9,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
                document.getElementById('landing-stage').classList.remove('active');
                enterCourtroom();
            }
        });
});

// Transition into courtroom stage
function enterCourtroom() {
    const courtStage = document.getElementById('courtroom-stage');
    courtStage.classList.add('active');
    
    gsap.set(courtStage, { opacity: 0 });
    gsap.to(courtStage, { opacity: 1, duration: 1.2 });
    
    // Entrance animations for courtroom pillars & elements
    gsap.from(".pillar", {
        y: -100,
        stagger: 0.15,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out"
    });
    
    gsap.from(".evidence-folder", {
        scale: 0.8,
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 1.0,
        ease: "back.out(1.5)",
        delay: 0.5
    });
    
    gsap.from(".testimony-section", {
        x: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.8
    });
    
    gsap.from(".gavel-verdict-area", {
        y: 50,
        opacity: 0,
        duration: 1.0,
        ease: "power2.out",
        delay: 1.0
    });
    
    // Typewriter message
    setTimeout(() => {
        typewriteTicker("Court is now in session. All rise for the Hon'ble Judge Kanika presiding...");
    }, 1500);
}

function typewriteTicker(msg) {
    const textNode = document.getElementById('court-ticker-text');
    gsap.to(textNode, {
        text: {
            value: msg,
            speed: 0.6
        },
        duration: msg.length * 0.04,
        ease: "none"
    });
}


// --- 5. EXHIBITS / EVIDENCE INTERACTION ---

const exhibitsData = {
    1: {
        label: "EXHIBIT A: HARD WORK",
        title: "Record of Unwavering Hard Work",
        content: `
            <p><strong>IN THE COURT OF DESTINY</strong></p>
            <p>Subject: <em>Kanika's Study Logs & Exam Preparation</em></p>
            <p><strong>EVIDENCE ANALYSIS:</strong></p>
            <p>The court admits the records showing countess sleepless nights, mountains of highlights, and comprehensive legal notes. The subject has demonstrated an extraordinary work ethic, dedicating her hours to understanding the complex intricacies of constitutional law, civil codes, and case precedents.</p>
            <p><strong>VERDICT ON EXHIBIT:</strong></p>
            <p class="text-red"><strong>GUILTY OF EXCESSIVE EFFORT & BRILLIANCE.</strong></p>
        `
    },
    2: {
        label: "EXHIBIT B: DISCIPLINE",
        title: "Decree of Ironclad Discipline",
        content: `
            <p><strong>MINUTES OF STUDY RECORDINGS</strong></p>
            <p>Subject: <em>Kanika's Daily Academic Routines</em></p>
            <p><strong>EVIDENCE ANALYSIS:</strong></p>
            <p>Witnesses report that Kanika maintains a rigorous standard of discipline. Despite distractions and challenges, she shows up for her goals day after day. Her schedule is structured around law journals, writing practices, and vocabulary refinement.</p>
            <p><strong>VERDICT ON EXHIBIT:</strong></p>
            <p class="text-red"><strong>DECLARED UNWAVERINGLY CONSISTENT.</strong></p>
        `
    },
    3: {
        label: "EXHIBIT C: DEDICATION",
        title: "Testament of Ultimate Dedication",
        content: `
            <p><strong>MEMORANDUM OF PASSION</strong></p>
            <p>Subject: <em>Kanika's Commitment to the Spirit of Justice</em></p>
            <p><strong>EVIDENCE ANALYSIS:</strong></p>
            <p>This exhibit documents Kanika's underlying motivation. She doesn't just study to pass exams; she studies because she believes in justice, equality, and the defense of truth. She treats every mock trial and essay with deep personal dedication.</p>
            <p><strong>VERDICT ON EXHIBIT:</strong></p>
            <p class="text-red"><strong>CERTIFIED AS INHERENTLY JUST.</strong></p>
        `
    },
    4: {
        label: "EXHIBIT D: THE DREAM (SEALED)",
        title: "The Sealed Aspiration: Judge Kanika",
        content: `
            <p><strong>THE ULTIMATE DECREE</strong></p>
            <p>Subject: <em>Hon'ble Judge Kanika's Judicial Appointment</em></p>
            <p><strong>EVIDENCE ANALYSIS:</strong></p>
            <p>This document, written by destiny, seals the dream. It represents the courtroom bench, the dark mahogany judge's chair, the golden gavel, and the respect of the entire courtroom. It records a vision of Kanika declaring fair judgements and standing as a pillar of integrity.</p>
            <p><strong>COURT NOTE:</strong></p>
            <p class="text-gold" style="font-size: 1.1rem; border: 1px solid var(--color-gold); padding: 10px; margin-top: 15px; text-align: center;">
                <strong>★ WISH GRANTED ★</strong><br>
                This dream is now officially UNSEALED. The universe stands ready to honor your path!
            </p>
        `
    }
};

// Bind clicks to evidence folders
const folders = document.querySelectorAll('.evidence-folder');
folders.forEach(folder => {
    folder.addEventListener('click', () => {
        const id = parseInt(folder.getAttribute('data-exhibit'));
        openEvidence(id, folder);
    });
});

function openEvidence(id, folderEl) {
    const data = exhibitsData[id];
    if (!data) return;
    
    playPaperFlip();
    
    // Mark folder as active/read
    if (id === 4) {
        const statusStamp = folderEl.querySelector('.folder-status');
        statusStamp.textContent = "UNSEALED";
        statusStamp.classList.remove('stamp-sealed');
        statusStamp.classList.add('stamp-approved');
    }
    
    // Track unique folder opens to unlock final verdict
    openedExhibits.add(id);
    
    // Inject content
    document.getElementById('exhibit-label').textContent = data.label;
    document.getElementById('exhibit-body-content').innerHTML = data.content;
    
    // Open Overlay
    const modal = document.getElementById('evidence-modal');
    modal.classList.add('active');
    
    // Ticker announcement
    typewriteTicker(`Reviewing evidence... ${data.label} admitted into the court record.`);
    
    // Check if all evidence is unsealed to activate verdict button
    if (openedExhibits.size >= 4) {
        document.getElementById('pronounce-verdict-btn').classList.add('active-ready');
        typewriteTicker("All evidence has been reviewed. The Court is now ready to pronounce the Final Verdict!");
    }
}

// Close evidence overlay
document.getElementById('close-evidence-btn').addEventListener('click', () => {
    document.getElementById('evidence-modal').classList.remove('active');
});

// Close modal if background clicked
document.getElementById('evidence-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('evidence-modal')) {
        document.getElementById('evidence-modal').classList.remove('active');
    }
});


// --- 6. TAB SWITCHING FOR LAWYER & WITNESS ---

const tabLawyer = document.getElementById('tab-lawyer-btn');
const tabWitness = document.getElementById('tab-witness-btn');
const panelLawyer = document.getElementById('panel-lawyer');
const panelWitness = document.getElementById('panel-witness');

tabLawyer.addEventListener('click', () => {
    tabWitness.classList.remove('active');
    tabLawyer.classList.add('active');
    panelWitness.classList.remove('active');
    panelLawyer.classList.add('active');
    playPaperFlip();
});

tabWitness.addEventListener('click', () => {
    tabLawyer.classList.remove('active');
    tabWitness.classList.add('active');
    panelLawyer.classList.remove('active');
    panelWitness.classList.add('active');
    playPaperFlip();
});


// --- 7. FINAL VERDICT & GAVEL STRIKE ---

const verdictBtn = document.getElementById('pronounce-verdict-btn');
const gavelContainer = document.getElementById('gavel-container');

verdictBtn.addEventListener('click', () => {
    if (openedExhibits.size < 4) {
        // Direct warning text to look at other folders first
        typewriteTicker("WARNING: Court cannot pronounce verdict. Review all Exhibits A, B, C, and D first!");
        
        // Shake the button to show blocked action
        gsap.timeline()
            .to(verdictBtn, { x: 10, duration: 0.05 })
            .to(verdictBtn, { x: -10, duration: 0.05 })
            .to(verdictBtn, { x: 8, duration: 0.05 })
            .to(verdictBtn, { x: -8, duration: 0.05 })
            .to(verdictBtn, { x: 0, duration: 0.05 });
        return;
    }
    
    executeGavelVerdictFlow();
});

// Also allow hitting the gavel soundblock to strike!
document.getElementById('gavel-soundblock').addEventListener('click', () => {
    if (openedExhibits.size >= 4) {
        executeGavelVerdictFlow();
    }
});

let verdictExecuted = false;
function executeGavelVerdictFlow() {
    if (verdictExecuted) return;
    verdictExecuted = true;
    
    typewriteTicker("Silence in the court! The Bench is ready to deliver the final ruling...");
    
    // Gavel Swing Timeline
    const strikeTimeline = gsap.timeline({
        onComplete: () => {
            // Show Final scroll modal after short delay
            setTimeout(() => {
                document.getElementById('verdict-modal').classList.add('active');
                startFireworksLoop();
                rollOpenVerdictScroll();
            }, 500);
        }
    });
    
    // Animate gavel strike down to soundblock
    strikeTimeline
        // Wind up
        .to("#gavel-pivot", {
            rotation: -55,
            duration: 0.25,
            ease: "power2.out"
        })
        // Rapid swing down to block
        .to("#gavel-pivot", {
            rotation: 12, // strike angle
            duration: 0.12,
            ease: "power1.in",
            onComplete: () => {
                triggerStrikeImpactEffects();
            }
        })
        // Slight recoil bounce
        .to("#gavel-pivot", {
            rotation: -5,
            duration: 0.15,
            ease: "power2.out"
        })
        // Rest position
        .to("#gavel-pivot", {
            rotation: -30,
            duration: 0.3,
            ease: "power2.out"
        });
}

function triggerStrikeImpactEffects() {
    // Sound FX Gavel strike
    playGavelStrike();
    
    // Screen shake
    const appContainer = document.querySelector('.app-container');
    gsap.timeline()
        .to(appContainer, { y: 20, x: -10, duration: 0.05 })
        .to(appContainer, { y: -15, x: 8, duration: 0.05 })
        .to(appContainer, { y: 10, x: -5, duration: 0.05 })
        .to(appContainer, { y: -5, x: 3, duration: 0.05 })
        .to(appContainer, { y: 0, x: 0, duration: 0.05 });
        
    // Spawn gold sparks from soundblock
    const block = document.getElementById('gavel-soundblock');
    const rect = block.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    const sparksCount = 50;
    for (let i = 0; i < sparksCount; i++) {
        const mote = new DustMote();
        mote.x = x;
        mote.y = y;
        const angle = Math.random() * Math.PI - Math.PI; // upward burst
        const spd = Math.random() * 8 + 4;
        mote.speedX = Math.cos(angle) * spd;
        mote.speedY = Math.sin(angle) * spd;
        mote.opacity = 1.0;
        mote.size = Math.random() * 3 + 1.5;
        dustParticles.push(mote);
        
        setTimeout(() => {
            const idx = dustParticles.indexOf(mote);
            if (idx > -1) dustParticles.splice(idx, 1);
        }, 1500);
    }
}

// Roll open verdict scroll animation
function rollOpenVerdictScroll() {
    const scroll = document.getElementById('verdict-scroll');
    const scrollBody = scroll.querySelector('.scroll-parchment-body');
    
    // Hide and set scale initially
    gsap.set(scroll, { scaleY: 0, opacity: 0 });
    
    gsap.to(scroll, {
        scaleY: 1,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        transformOrigin: "center top"
    });
    
    // Typewriter or fade content inside scroll
    gsap.from(".scroll-parchment-body > *", {
        opacity: 0,
        y: 20,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5
    });
}


// --- 8. ENDING SCENE FLOW ---

document.getElementById('close-case-btn').addEventListener('click', () => {
    // Fade out verdict modal
    document.getElementById('verdict-modal').classList.remove('active');
    stopFireworksLoop();
    
    // Open case closed popup
    document.getElementById('ending-modal').classList.add('active');
});

document.getElementById('exit-btn').addEventListener('click', () => {
    // Fade out case closed panel, show final emotional text screen
    const endingCard = document.getElementById('ending-card');
    const finalScreen = document.getElementById('final-screen');
    
    gsap.to(endingCard, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
            endingCard.style.display = 'none';
            finalScreen.classList.add('active');
            triggerFinalTypewriter();
        }
    });
});

function triggerFinalTypewriter() {
    const finalNode = document.getElementById('final-typewriter-text');
    const message = "Until the day Hon'ble Judge Kanika takes her seat in the courtroom... ❤️";
    
    gsap.to(finalNode, {
        text: {
            value: message,
            speed: 0.4
        },
        duration: message.length * 0.08,
        ease: "none"
    });
}

// Bind music mute toggle button click
document.getElementById('audio-toggle-btn').addEventListener('click', toggleMute);
// Start audio contexts on any general body click to bypass safari/chrome restrictions
document.body.addEventListener('click', () => {
    initAudio();
}, { once: true });
