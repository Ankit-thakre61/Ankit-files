document.addEventListener("DOMContentLoaded", () => {
    // Navigational & Interactive Elements
    const sections = document.querySelectorAll(".page-section");
    const nextButtons = document.querySelectorAll(".btn-next");
    const startStoryBtn = document.getElementById("start-story-btn");
    const replayBtn = document.getElementById("replay-btn");
    const musicBtn = document.getElementById("music-btn");
    const bgMusic = document.getElementById("bg-music");

    // Particle Configuration Elements
    const particleContainer = document.getElementById("particle-container");
    const celebrationCanvas = document.getElementById("celebration-canvas");
    const celCtx = celebrationCanvas.getContext("2d");

    // Screen Dimensions Setup
    let width = celebrationCanvas.width = window.innerWidth;
    let height = celebrationCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = celebrationCanvas.width = window.innerWidth;
        height = celebrationCanvas.height = window.innerHeight;
    });

    // Audio Playback Controller
    musicBtn.addEventListener("click", () => {
        if (bgMusic.paused) {
            bgMusic.play().then(() => {
                musicBtn.classList.add("playing");
            }).catch(e => console.log("Audio load error blocked by browser security.", e));
        } else {
            bgMusic.pause();
            musicBtn.classList.remove("playing");
        }
    });

    // Navigation Mechanics (With State Cleansers)
    function showSection(id) {
        sections.forEach(sec => {
            sec.classList.remove("active");
            if (sec.id === id) {
                sec.classList.add("active");
                sec.scrollIntoView({ behavior: 'smooth' });
                handleSectionEntrance(id);
            }
        });
    }

    // Connect flow control buttons
    startStoryBtn.addEventListener("click", () => showSection("story"));
    nextButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const nextTarget = btn.getAttribute("data-next");
            showSection(nextTarget);
        });
    });

    replayBtn.addEventListener("click", () => {
        // Reset interactive structures
        resetScratchCards();
        resetQuiz();
        stopCelebrationLoop();
        showSection("home");
    });

    // Scroll Trigger Observer (Subtle parallax reveals)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".scroll-reveal").forEach(el => revealObserver.observe(el));

    // Specific Entrance Function for Complex Elements
    function handleSectionEntrance(sectionId) {
        if (sectionId === 'scratch') {
            initScratchCards();
        } else if (sectionId === 'countdown') {
            startLiveTimer();
        } else if (sectionId === 'final') {
            triggerFullCelebration();
        } else {
            stopCelebrationLoop();
        }
    }

    /* Ambient Floating Particle Systems */
    const particleEmojis = ['❤️', '😘', '😚', '🧸', '🌹', '🦋', '✨', '⭐', '💌', '🎈', '🎀'];
    function createAmbientParticles() {
        const pCount = 35;
        for (let i = 0; i < pCount; i++) {
            spawnParticle();
        }
    }

    function spawnParticle() {
        const particle = document.createElement("div");
        particle.className = "floating-particle";
        particle.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
        
        // Random properties
        const startX = Math.random() * 100;
        const scale = 0.5 + Math.random() * 1.2;
        const animDuration = 8 + Math.random() * 15;
        const animDelay = Math.random() * -20;

        particle.style.left = `${startX}vw`;
        particle.style.fontSize = `${scale}rem`;
        particle.style.animationDuration = `${animDuration}s`;
        particle.style.animationDelay = `${animDelay}s`;
        
        particleContainer.appendChild(particle);
        
        // Recycle system
        particle.addEventListener("animationiteration", () => {
            particle.style.left = `${Math.random() * 100}vw`;
        });
    }
    createAmbientParticles();

    /* Memory Card Interactions */
    const memCards = document.querySelectorAll(".memory-card");
    memCards.forEach(card => {
        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });
    });

    /* Interactive HTML5 Canvas Scratch Cards */
    let canvasesInitialized = false;
    function initScratchCards() {
        if (canvasesInitialized) return;
        canvasesInitialized = true;
        const scratchCanvases = document.querySelectorAll(".scratch-canvas");
        
        scratchCanvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const parent = canvas.parentElement;
            
            // Render scaling parameters correctly
            const width = parent.clientWidth;
            const height = parent.clientHeight;
            canvas.width = width;
            canvas.height = height;

            // Paint elegant cover gradient
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#fbc2eb');
            grad.addColorStop(1, '#a18cd1');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Print Call To Action Overlay
            ctx.font = "bold 16px Quicksand, sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Scratch Me 💖", width / 2, height / 2);

            // Handle Interaction Tracking
            let drawing = false;

            function scratch(e) {
                if (!drawing) return;
                const rect = canvas.getBoundingClientRect();
                
                // Unify coordinates for both Desktop and Mobile pointer events
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                const x = clientX - rect.left;
                const y = clientY - rect.top;

                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.fill();

                // Scratch Threshold Calculation to automatically vanish
                checkScratchPercent(canvas, ctx);
            }

            canvas.addEventListener("mousedown", () => drawing = true);
            canvas.addEventListener("touchstart", () => drawing = true);
            
            window.addEventListener("mouseup", () => drawing = false);
            window.addEventListener("touchend", () => drawing = false);
            
            canvas.addEventListener("mousemove", scratch);
            canvas.addEventListener("touchmove", scratch);
        });
    }

    function checkScratchPercent(canvas, ctx) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        let cleared = 0;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) cleared++;
        }

        const clearedPercent = (cleared / (pixels.length / 4)) * 100;
        if (clearedPercent > 45) {
            canvas.style.transition = "opacity 0.6s ease";
            canvas.style.opacity = 0;
            setTimeout(() => {
                canvas.style.pointerEvents = "none";
            }, 600);
        }
    }

    function resetScratchCards() {
        canvasesInitialized = false;
        const scratchCanvases = document.querySelectorAll(".scratch-canvas");
        scratchCanvases.forEach(canvas => {
            canvas.style.opacity = 1;
            canvas.style.pointerEvents = "auto";
        });
    }

    /* Cute Love Quiz Mechanics */
    const optButtons = document.querySelectorAll(".option-btn");
    const quizMsg = document.getElementById("quiz-msg");
    const quizNextBtn = document.getElementById("quiz-next-btn");

    optButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("correct-opt")) {
                const target = btn.getAttribute("data-target");
                btn.style.background = "#c8e6c9"; // Sweet green success indicator
                btn.style.color = "#256029";
                
                // Show celebration visual cues
                triggerQuizExplosion();
                
                if (target === "q1") {
                    quizMsg.textContent = "Yes, she is the cutest! 🥰 Let's go to the next question.";
                    quizMsg.style.color = "#e91e63";
                    setTimeout(() => {
                        document.getElementById("q1").classList.remove("active");
                        document.getElementById("q2").classList.add("active");
                        quizMsg.textContent = "";
                    }, 1500);
                } else if (target === "q2") {
                    quizMsg.textContent = "Infinitely and beyond! Happy Girlfriend's Day 💖";
                    quizMsg.style.color = "#d81b60";
                    quizNextBtn.classList.remove("hidden");
                }
            } else {
                btn.style.transform = "translateX(-10px)";
                setTimeout(() => btn.style.transform = "translateX(10px)", 100);
                setTimeout(() => btn.style.transform = "translateX(0)", 200);
                quizMsg.textContent = "Oops, try again honey! 🥺";
                quizMsg.style.color = "#d32f2f";
            }
        });
    });

    function resetQuiz() {
        document.getElementById("q1").classList.add("active");
        document.getElementById("q2").classList.remove("active");
        quizNextBtn.classList.add("hidden");
        quizMsg.textContent = "";
        optButtons.forEach(btn => {
            btn.style.background = "#ffffff";
            btn.style.color = "#5c3d75";
        });
    }

    /* Live-Ticking Calendar Day Counter */
    let timerInterval;
    function startLiveTimer() {
        const dateSpan = document.getElementById("current-date");
        const timerSpan = document.getElementById("timer-live");

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateSpan.textContent = new Date().toLocaleDateString('en-US', options);

        if (timerInterval) clearInterval(timerInterval);

        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            timerSpan.textContent = `Every second spent with you is pure magic: ${hours}h ${minutes}m ${seconds}s`;
        }
        updateClock();
        timerInterval = setInterval(updateClock, 1000);
    }

    /* Quiz Burst Visual Effect */
    function triggerQuizExplosion() {
        const count = 30;
        const colors = ["#ff527b", "#ff79b0", "#ffb6c1", "#e0b0ff"];
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 8 + 4;
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            const destX = x + (Math.random() - 0.5) * 400;
            const destY = y + (Math.random() - 0.5) * 400;
            
            const explosionEl = document.createElement("div");
            explosionEl.style.position = "fixed";
            explosionEl.style.left = `${x}px`;
            explosionEl.style.top = `${y}px`;
            explosionEl.style.width = `${size}px`;
            explosionEl.style.height = `${size}px`;
            explosionEl.style.background = colors[Math.floor(Math.random() * colors.length)];
            explosionEl.style.borderRadius = "50%";
            explosionEl.style.pointerEvents = "none";
            explosionEl.style.zIndex = "999";
            explosionEl.style.transition = "transform 1s cubic-bezier(0.1, 1, 0.1, 1), opacity 1s";
            
            document.body.appendChild(explosionEl);
            
            requestAnimationFrame(() => {
                explosionEl.style.transform = `translate(${destX - x}px, ${destY - y}px)`;
                explosionEl.style.opacity = 0;
            });
            
            setTimeout(() => {
                explosionEl.remove();
            }, 1000);
        }
    }

    /* High Performance Celebration Loop (Fireworks, Confetti, and Rose Petals) */
    let celAnimFrame;
    let fireworks = [];
    let confettiList = [];
    let petals = [];

    class Firework {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = height;
            this.targetY = Math.random() * (height * 0.4);
            this.speed = 3 + Math.random() * 4;
            this.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
            this.particles = [];
            this.exploded = false;
        }
        update() {
            if (!this.exploded) {
                this.y -= this.speed;
                if (this.y <= this.targetY) {
                    this.exploded = true;
                    this.explode();
                }
            } else {
                this.particles.forEach((p, idx) => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.04; // Gravity pull
                    p.alpha -= 0.015;
                    if (p.alpha <= 0) {
                        this.particles.splice(idx, 1);
                    }
                });
                if (this.particles.length === 0) {
                    this.reset();
                }
            }
        }
        explode() {
            const count = 40;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1
                });
            }
        }
        draw() {
            if (!this.exploded) {
                celCtx.beginPath();
                celCtx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                celCtx.fillStyle = this.color;
                celCtx.fill();
            } else {
                this.particles.forEach(p => {
                    celCtx.save();
                    celCtx.globalAlpha = p.alpha;
                    celCtx.beginPath();
                    celCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    celCtx.fillStyle = this.color;
                    celCtx.fill();
                    celCtx.restore();
                });
            }
        }
    }

    class Confetti {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 8 + 5;
            this.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
            this.speedY = 1.5 + Math.random() * 3;
            this.speedX = Math.random() * 2 - 1;
            this.rot = Math.random() * 360;
            this.rotSpeed = Math.random() * 4 - 2;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rot += this.rotSpeed;
            if (this.y > height) {
                this.y = -20;
                this.x = Math.random() * width;
            }
        }
        draw() {
            celCtx.save();
            celCtx.translate(this.x, this.y);
            celCtx.rotate(this.rot * Math.PI / 180);
            celCtx.fillStyle = this.color;
            celCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            celCtx.restore();
        }
    }

    class Petal {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 10 + 8;
            this.speedY = 1 + Math.random() * 2;
            this.speedX = Math.random() * 1.5 - 0.5;
            this.swivelAngle = Math.random() * Math.PI;
            this.swivelSpeed = 0.01 + Math.random() * 0.02;
        }
        update() {
            this.y += this.speedY;
            this.x += Math.sin(this.swivelAngle) * 0.8;
            this.swivelAngle += this.swivelSpeed;
            if (this.y > height) {
                this.y = -20;
                this.x = Math.random() * width;
            }
        }
        draw() {
            celCtx.save();
            celCtx.translate(this.x, this.y);
            celCtx.rotate(this.swivelAngle);
            celCtx.fillStyle = "#ff4d6d"; // Soft Rose Petal Red
            celCtx.beginPath();
            // Rose petal shape
            celCtx.moveTo(0, 0);
            celCtx.bezierCurveTo(-this.size/2, -this.size/2, -this.size, this.size/3, 0, this.size);
            celCtx.bezierCurveTo(this.size, this.size/3, this.size/2, -this.size/2, 0, 0);
            celCtx.fill();
            celCtx.restore();
        }
    }

    function runCelebrationLoop() {
        celCtx.clearRect(0, 0, width, height);

        fireworks.forEach(fw => { fw.update(); fw.draw(); });
        confettiList.forEach(cf => { cf.update(); cf.draw(); });
        petals.forEach(pt => { pt.update(); pt.draw(); });

        celAnimFrame = requestAnimationFrame(runCelebrationLoop);
    }

    function triggerFullCelebration() {
        fireworks = Array.from({ length: 4 }, () => new Firework());
        confettiList = Array.from({ length: 50 }, () => new Confetti());
        petals = Array.from({ length: 40 }, () => new Petal());
        runCelebrationLoop();
    }

    function stopCelebrationLoop() {
        if (celAnimFrame) {
            cancelAnimationFrame(celAnimFrame);
            celCtx.clearRect(0, 0, width, height);
        }
    }
});