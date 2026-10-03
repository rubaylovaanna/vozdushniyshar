class SquirrelGame {
    constructor() {
        this.state = {
            isPlaying: false,
            isMoving: false,
            currentLocation: 0,
            progress: 0,
            volcanoCalm: 0,
            isVolcanoActive: false,
            locations: [
                { 
                    bg: 'img/bg_peterburg.png',
                    landmark: 'img/isaakievsky.png',
                    name: 'Санкт-Петербург',
                    description: 'Белочка пролетает над красивым городом на Неве. Впереди виден величественный Исаакиевский собор с огромным золотым куполом!'
                },
                { 
                    bg: 'img/bg_dagestan.png',
                    landmark: 'img/dagestan.png',
                    name: 'Дагестан',
                    description: 'Воздушный шар поднимается к горным вершинам. Внизу — глубокие каньоны Дагестана с бирюзовой рекой Сулак!'
                },
                { 
                    bg: 'img/bg_sochi.png',
                    landmark: 'img/sochi_port.png',
                    name: 'Сочи',
                    description: 'Белочка летит над Чёрным морем! Внизу — красивый морской порт Сочи с яхтами и кораблями.'
                },
                { 
                    bg: 'img/bg_kaliningrad.png',
                    landmark: 'img/kaliningrad_mayak.png',
                    name: 'Калининград',
                    description: 'Впереди — берег Балтийского моря. На дюнах стоит старинный маяк в Калининградской области!'
                },
                { 
                    bg: 'img/bg_kamchatka.png',
                    landmark: 'img/vulkan.png',
                    name: 'Камчатка',
                    description: 'Впереди — далёкий остров Камчатка! Там дымятся вулканы, бьют гейзеры и ходят медведи. Настоящее приключение!'
                }
            ]
        };

        this.moveInterval = null;
        this.volcanoInterval = null;

        // === ЗВУКИ ===
        this.sounds = {
            levelup: new Audio('sounds/levelup.mp3'),
            vulkan: new Audio('sounds/vulkan.mp3'),
            gameWon: new Audio('sounds/game-won.mp3')
        };

        this.sounds.vulkan.loop = true;
        this.sounds.vulkan.volume = 0.6;
        this.sounds.levelup.volume = 0.8;
        this.sounds.gameWon.volume = 0.8;

        this.sounds.levelup.preload = 'auto';
        this.sounds.vulkan.preload = 'auto';
        this.sounds.gameWon.preload = 'auto';

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('Игра инициализирована');
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        this.els = {
            startBtn: document.getElementById('startBtn'),
            startZone: document.getElementById('startZone'),
            actionZone: document.getElementById('actionZone'),
            blowBtn: document.getElementById('blowBtn'),
            progressFill: document.getElementById('progressFill'),
            balloonWrapper: document.getElementById('balloonWrapper'),
            bgImg: document.getElementById('bgImg'),
            scene: document.getElementById('scene'),
            uiLayer: document.getElementById('uiLayer'),
            flightHint: document.getElementById('flightHint'),
            
            volcanoScreen: document.getElementById('volcanoScreen'),
            smokeContainer: document.getElementById('smokeContainer'),
            shushBtn: document.getElementById('shushBtn'),
            calmFill: document.getElementById('calmFill'),
            calmLabel: document.getElementById('calmLabel')
        };

        this.startPopup = {
            bg: document.getElementById('startPopupBg'),
            popup: document.getElementById('startPopup'),
            closeBtn: document.getElementById('closeStartPopup'),
            okBtn: document.getElementById('startPopupOk')
        };

        this.landmarkPopup = {
            bg: document.getElementById('landmarkPopupBg'),
            popup: document.getElementById('landmarkPopup'),
            closeBtn: document.getElementById('closeLandmarkPopup'),
            image: document.getElementById('landmarkImage'),
            title: document.getElementById('landmarkTitle'),
            description: document.getElementById('landmarkDescription'),
            okBtn: document.getElementById('landmarkOk')
        };

        this.finalPopup = {
            bg: document.getElementById('finalPopupBg'),
            popup: document.getElementById('finalPopup'),
            closeBtn: document.getElementById('closeFinalPopup'),
            okBtn: document.getElementById('finalOk')
        };

        if (!this.els.startBtn) {
            console.error('Кнопка startBtn не найдена!');
            return;
        }

        this.setupPopup(this.startPopup, () => this.startGame());
        this.setupPopup(this.landmarkPopup, () => this.nextLevel());
        this.setupPopup(this.finalPopup, () => location.reload());

        // Кнопка «Дуй» для полёта
        this.els.blowBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.startMoving();
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(event => {
            this.els.blowBtn.addEventListener(event, () => this.stopMoving());
        });

        // Кнопка «Ш-Ш-Ш» для вулкана
        this.els.shushBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.startShushing();
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(event => {
            this.els.shushBtn.addEventListener(event, () => this.stopShushing());
        });

        this.loadLevel();
        this.openPopup(this.startPopup);
    }

    setupPopup(popup, onConfirm) {
        popup.okBtn.addEventListener('click', () => {
            this.closePopup(popup);
            onConfirm();
        });
        popup.closeBtn.addEventListener('click', () => this.closePopup(popup));
        popup.bg.addEventListener('click', (e) => {
            if (e.target === popup.bg) {
                this.closePopup(popup);
                onConfirm();
            }
        });
    }

    openPopup(popup)  { popup.bg.classList.add('active'); }
    closePopup(popup) { popup.bg.classList.remove('active'); }

    // === УПРАВЛЕНИЕ ЗВУКАМИ ===
    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(err => {
                console.warn(`Не удалось воспроизвести звук ${soundName}:`, err);
            });
        }
    }

    stopSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    startGame() {
        this.els.startZone.style.display = 'none';
        this.els.actionZone.style.display = 'flex';
        this.state.isPlaying = true;
    }

    loadLevel() {
        const location = this.state.locations[this.state.currentLocation];
        this.els.bgImg.src = location.bg;
        this.els.bgImg.classList.add('active');
    }

    startMoving() {
        if (!this.state.isPlaying) return;
        this.state.isMoving = true;
        this.els.blowBtn.classList.add('active');
        this.moveInterval = setInterval(() => this.updateProgress(), 50);
    }

    stopMoving() {
        this.state.isMoving = false;
        this.els.blowBtn.classList.remove('active');
        clearInterval(this.moveInterval);
        this.els.flightHint.classList.remove('visible');
    }

    updateProgress() {
        if (this.state.progress >= 100) {
            this.stopMoving();
            this.showLandmark();
            return;
        }

        this.state.progress += 0.5;
        this.els.progressFill.style.width = `${this.state.progress}%`;

        const sceneWidth = this.els.scene.offsetWidth;
        const sceneHeight = this.els.scene.offsetHeight;
        const balloonWidth = this.els.balloonWrapper.offsetWidth;
        const balloonHeight = this.els.balloonWrapper.offsetHeight;
        
        const maxX = sceneWidth - balloonWidth - 20;
        const currentX = (this.state.progress / 100) * maxX;
        
        const centerY = (sceneHeight - balloonHeight) / 2;
        const amplitude = sceneHeight * 0.45;
        const frequency = 2;
        const angle = (this.state.progress / 100) * Math.PI * 2 * frequency;
        const currentY = centerY + amplitude * Math.sin(angle);
        
        this.els.balloonWrapper.style.left = `${currentX}px`;
        this.els.balloonWrapper.style.top  = `${currentY}px`;

        this.updateFlightHint(currentX, currentY, balloonWidth, balloonHeight, angle);
    }

    updateFlightHint(x, y, balloonWidth, balloonHeight, angle) {
        const hint = this.els.flightHint;
        const direction = Math.cos(angle);
        
        if (direction < 0) {
            hint.textContent = '↑ Вдох';
            hint.className = 'flight-hint visible inhale';
        } else {
            hint.textContent = '↓ Ш-Ш-Ш';
            hint.className = 'flight-hint visible exhale';
        }
        
        const hintX = x + balloonWidth / 2;
        const hintY = y - 50;
        
        hint.style.left = `${hintX}px`;
        hint.style.top  = `${hintY}px`;
        hint.style.transform = 'translateX(-50%)';
    }

    showLandmark() {
        const location = this.state.locations[this.state.currentLocation];
        this.landmarkPopup.image.src = location.landmark;
        this.landmarkPopup.image.alt = location.name;
        this.landmarkPopup.title.textContent = location.name;
        this.landmarkPopup.description.textContent = location.description;
        this.openPopup(this.landmarkPopup);
        
        // 🎵 Звук при попапе достопримечательности
        this.playSound('levelup');
    }

    nextLevel() {
        this.state.currentLocation++;

        if (this.state.currentLocation >= this.state.locations.length) {
            this.startVolcanoGame();
            return;
        }

        this.state.progress = 0;
        this.els.progressFill.style.width = '0%';
        this.els.balloonWrapper.style.left = '-120px';
        this.els.balloonWrapper.style.top  = '50%';

        this.loadLevel();
    }

    /* ============================================
       МИНИ-ИГРА «УСЫПИ ВУЛКАН»
       ============================================ */
    startVolcanoGame() {
        this.els.uiLayer.style.display = 'none';
        this.els.scene.style.display = 'none';
        this.els.volcanoScreen.style.display = 'flex';
        
        this.state.volcanoCalm = 0;
        this.state.isVolcanoActive = true;
        this.els.calmFill.style.width = '0%';
        this.els.calmLabel.textContent = 'Вулкан бушует!';
        this.els.volcanoScreen.classList.remove('calm');
        
        // 🎵 Запускаем зацикленный звук вулкана
        this.playSound('vulkan');
    }

    startShushing() {
        if (!this.state.isVolcanoActive) return;
        this.els.shushBtn.classList.add('active');
        this.volcanoInterval = setInterval(() => this.updateVolcano(), 50);
    }

    stopShushing() {
        this.els.shushBtn.classList.remove('active');
        clearInterval(this.volcanoInterval);
    }

    updateVolcano() {
        this.state.volcanoCalm += 0.3;
        
        if (this.state.volcanoCalm >= 100) {
            this.state.volcanoCalm = 100;
            this.volcanoCalmed();
            return;
        }

        this.els.calmFill.style.width = `${this.state.volcanoCalm}%`;

        const smokeOpacity = 1 - (this.state.volcanoCalm / 100);
        const smokeLayers = this.els.smokeContainer.querySelectorAll('.smoke-layer');
        smokeLayers.forEach((layer, index) => {
            const layerThreshold = (index / smokeLayers.length);
            const layerOpacity = Math.max(0, smokeOpacity - layerThreshold * 0.3);
            layer.style.opacity = layerOpacity;
        });

        if (this.state.volcanoCalm < 30) {
            this.els.calmLabel.textContent = 'Вулкан бушует!';
        } else if (this.state.volcanoCalm < 60) {
            this.els.calmLabel.textContent = 'Дым рассеивается...';
        } else if (this.state.volcanoCalm < 90) {
            this.els.calmLabel.textContent = 'Почти уснул!';
        } else {
            this.els.calmLabel.textContent = 'Ещё чуть-чуть!';
        }
    }

    volcanoCalmed() {
        this.stopShushing();
        this.state.isVolcanoActive = false;
        
        const smokeLayers = this.els.smokeContainer.querySelectorAll('.smoke-layer');
        smokeLayers.forEach(layer => {
            layer.style.opacity = '0';
        });
        
        this.els.calmFill.style.width = '100%';
        this.els.calmLabel.textContent = 'Вулкан уснул! 💤';
        
        // 🎵 Останавливаем звук вулкана
        this.stopSound('vulkan');
        
        setTimeout(() => {
            this.showFinal();
        }, 1500);
    }

    showFinal() {
        this.els.scene.style.display = 'block';
        this.els.volcanoScreen.style.display = 'none';
        
        this.openPopup(this.finalPopup);
        
        // 🎵 Финальная фанфара
        this.playSound('gameWon');
        
        this.createConfetti();
    }

    createConfetti() {
        const colors = ['#ff8c42', '#4ecdc4', '#ffe66d', '#ff6b9d', '#a29bfe', '#06d6a0'];
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
                this.els.scene.appendChild(confetti);
                setTimeout(() => confetti.remove(), 4000);
            }, i * 25);
        }
    }
}

new SquirrelGame();
