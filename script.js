        /* ========================================== */
        /* NAVIGATION & SCREEN LOGIC                 */
        /* ========================================== */
        function goToScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(screenId);
            if (target) target.classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        /* ========================================== */
        /* BACKGROUND MUSIC (WEB AUDIO API SYNTH)    */
        /* ========================================== */
        let audioCtx = null;
        let isPlaying = false;
        let noteInterval = null;

        function toggleAudio() {
            const btn = document.getElementById('musicToggleBtn');
            const disc = document.getElementById('discIcon');

            if (!isPlaying) {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                startMelody();
                isPlaying = true;
                btn.textContent = '❚❚';
                disc.style.animationPlayState = 'running';
            } else {
                stopMelody();
                isPlaying = false;
                btn.textContent = '▶';
                disc.style.animationPlayState = 'paused';
            }
        }

        function playNote(freq, duration, type = 'sine', gainVal = 0.08) {
            if (!audioCtx || audioCtx.state !== 'running') return;
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                
                gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            } catch(e) {}
        }

        function startMelody() {
            // Calm romantic chord progression notes (Cmaj7, Am7, Fmaj7, G7)
            const notes = [
                261.63, 329.63, 392.00, 493.88, // Cmaj7
                220.00, 261.63, 329.63, 392.00, // Am7
                174.61, 220.00, 261.63, 329.63, // Fmaj7
                196.00, 246.94, 293.66, 349.23  // G7
            ];
            let idx = 0;
            noteInterval = setInterval(() => {
                playNote(notes[idx], 1.2, 'sine', 0.06);
                if (idx % 2 === 0) {
                    playNote(notes[(idx + 2) % notes.length] * 0.5, 1.8, 'triangle', 0.03);
                }
                idx = (idx + 1) % notes.length;
            }, 400);
        }

        function stopMelody() {
            if (noteInterval) clearInterval(noteInterval);
        }

/* ========================================== */
/* GAME 1: CATCH GAME LOGIC                   */
/* ========================================== */
let catchScore = 0;
let gameAnimFrame = null;
let basket = { x: 130, y: 340, w: 80, h: 22 };
let items = [];

// 1. Load Gambar Wajah
const faceImg = new Image();
// Ganti URL / path di bawah ini dengan file foto wajahmu (misal: 'face.png')
faceImg.src = 'caca.jpeg'; 

function initCatchGame() {
    catchScore = 0;
    document.getElementById('catchCount').textContent = catchScore;
    items = [];

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Drag Controls
    let isDragging = false;

    function updateBasketPos(clientX) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        basket.x = (clientX - rect.left) * scaleX - basket.w / 2;
        if (basket.x < 0) basket.x = 0;
        if (basket.x + basket.w > canvas.width) basket.x = canvas.width - basket.w;
    }

    canvas.onmousedown = (e) => { isDragging = true; updateBasketPos(e.clientX); };
    window.onmousemove = (e) => { if (isDragging) updateBasketPos(e.clientX); };
    window.onmouseup = () => { isDragging = false; };

    canvas.ontouchstart = (e) => { isDragging = true; updateBasketPos(e.touches[0].clientX); };
    canvas.ontouchmove = (e) => { if (isDragging) updateBasketPos(e.touches[0].clientX); };
    canvas.ontouchend = () => { isDragging = false; };

    // Game Loop
    let frameCount = 0;
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Spawn falling face items
        frameCount++;
        if (frameCount % 45 === 0 && catchScore < 15) {
            items.push({
                x: Math.random() * (canvas.width - 60) + 30,
                y: -40,
                r: 18, // Jari-jari lingkaran wajah
                speed: 2 + Math.random() * 1.5
            });
        }

        // Draw Basket
        ctx.fillStyle = '#7ba4b5';
        ctx.beginPath();
        ctx.roundRect(basket.x, basket.y, basket.w, basket.h, 10);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BASKET', basket.x + basket.w / 2, basket.y + 14);

        // Update & Draw Falling Items
        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += item.speed;

            // --- DRAW FACE PHOTO (Circular Clipping) ---
            ctx.save();
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
            ctx.clip();
            if (faceImg.complete) {
                ctx.drawImage(faceImg, item.x - item.r, item.y - item.r, item.r * 2, item.r * 2);
            }
            ctx.restore();

            // Outline Wajah
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW BUBBLE TEXT "catch me" ---
            const bubbleX = item.x + item.r + 6;
            const bubbleY = item.y - 6;
            const bubbleW = 52;
            const bubbleH = 18;

            // Background Bubble
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
            ctx.fill();

            // Teks "catch me"
            ctx.fillStyle = '#617b84';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('catch me', bubbleX + bubbleW / 2, bubbleY + 12);

            // --- COLLISION DETECTION WITH BASKET ---
            if (item.y + item.r >= basket.y && 
                item.x >= basket.x && 
                item.x <= basket.x + basket.w) {
                
                items.splice(i, 1);
                catchScore++;
                document.getElementById('catchCount').textContent = catchScore;

                if (catchScore >= 15) {
                    cancelAnimationFrame(gameAnimFrame);
                    document.getElementById('modal1').classList.add('active');
                    return;
                }
                continue;
            }

            // Remove off-screen items
            if (item.y - item.r > canvas.height) {
                items.splice(i, 1);
            }
        }

        if (catchScore < 15) {
            gameAnimFrame = requestAnimationFrame(loop);
        }
    }

    if (gameAnimFrame) cancelAnimationFrame(gameAnimFrame);
    loop();
}
        /* ========================================== */
        /* GAME 2: WORD SEARCH LOGIC                  */
        /* ========================================== */
        const gridData = [
            ['C','O','M','P','L','E','T','E','W','Q'], 
            ['O','S','A','Z','V','X','D','G','Y','K'],
            ['M','U','P','H','J','K','L','M','R','G'],
            ['F','Y','I','E','N','B','V','C','E','R'],
            ['S','P','E','C','I','A','L','M','A','A'], 
            ['R','H','D','S','P','I','Y','U','S','T'],
            ['C','O','M','F','O','R','T','W','O','E'], 
            ['Z','X','S','A','I','N','T','L','N','F'], 
            ['B','E','S','T','M','N','B','V','C','U'], 
            ['K','E','E','P','Y','T','R','E','W','L']  
        ];

        const targetWords = ["SPECIAL", "KEEP", "COMFORT", "GRATEFUL", "COMPLETE"];
        let foundWords = new Set();
        let selectedBoxes = [];
        let isSelecting = false;

        function initWordSearch() {
            const gridContainer = document.getElementById('wordGrid');
            gridContainer.innerHTML = '';
            foundWords.clear();
            selectedBoxes = [];
            document.getElementById('word-count').textContent = '0';

            targetWords.forEach(w => {
                const el = document.getElementById(`target-${w}`);
                if (el) el.classList.remove('found');
            });

            gridData.forEach((row, r) => {
                row.forEach((char, c) => {
                    const box = document.createElement('div');
                    box.className = 'letter-box';
                    box.textContent = char;
                    box.dataset.row = r;
                    box.dataset.col = c;
                    box.dataset.char = char;

                    // Pointer / Touch Events
                    box.addEventListener('mousedown', () => startSelect(box));
                    box.addEventListener('mouseenter', () => enterSelect(box));
                    box.addEventListener('touchstart', (e) => { e.preventDefault(); startSelect(box); });

                    gridContainer.appendChild(box);
                });
            });
        }

        // Handle Touch Swipe on Grid
        document.getElementById('wordGrid').addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.classList.contains('letter-box')) {
                enterSelect(target);
            }
        });

        window.addEventListener('mouseup', endSelect);
        window.addEventListener('touchend', endSelect);

        function startSelect(box) {
            if (box.classList.contains('found')) return;
            isSelecting = true;
            selectedBoxes = [box];
            box.classList.add('selected');
        }

        function enterSelect(box) {
            if (!isSelecting || box.classList.contains('found')) return;
            if (!selectedBoxes.includes(box)) {
                selectedBoxes.push(box);
                box.classList.add('selected');
            }
        }

        function endSelect() {
            if (!isSelecting) return;
            isSelecting = false;

            const selectedWord = selectedBoxes.map(b => b.dataset.char).join('');
            const reversedWord = selectedWord.split('').reverse().join('');

            let matched = null;
            if (targetWords.includes(selectedWord)) matched = selectedWord;
            else if (targetWords.includes(reversedWord)) matched = reversedWord;

            if (matched && !foundWords.has(matched)) {
                foundWords.add(matched);
                selectedBoxes.forEach(b => {
                    b.classList.remove('selected');
                    b.classList.add('found');
                });

                const targetEl = document.getElementById(`target-${matched}`);
                if (targetEl) targetEl.classList.add('found');

                document.getElementById('word-count').textContent = foundWords.size;

                if (foundWords.size >= 8) {
                    setTimeout(() => {
                        document.getElementById('modal2').classList.add('active');
                    }, 400);
                }
            } else {
                selectedBoxes.forEach(b => b.classList.remove('selected'));
            }
            selectedBoxes = [];
        }

        /* ========================================== */
        /* SCREEN 4: PIN LOGIC                        */
        /* ========================================== */
        function checkPin() {
            const input = document.getElementById('pinInput').value.trim();
            const errorEl = document.getElementById('pinError');
            
            // Default valid PINs or any 6-digit input allowed for test
            if (input.length === 6) {
                errorEl.classList.add('hidden');
                goToScreen('screen5');
            } else {
                errorEl.classList.remove('hidden');
            }
        }
