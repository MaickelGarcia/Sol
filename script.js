// === SISTEMA DE MÚSICA DE FONDO PERSISTENTE MEJORADO ===

class BackgroundMusicManager {
    constructor() {
        this.audio = null;
        this.isInitialized = false;
        this.volume = 0.3;
        this.musicUrl = "https://www.dropbox.com/scl/fi/ny1t4esehd3we4rky0ma8/V-BTS-Winter-Bear-easy-lyrics.mp3?rlkey=hjbixgthd22002qj15v68mtqp&st=jhfhdn15&dl=1";
        this.syncInterval = null;
        
        // Bind methods
        this.initMusic = this.initMusic.bind(this);
        this.playMusic = this.playMusic.bind(this);
        this.pauseMusic = this.pauseMusic.bind(this);
        this.toggleMusic = this.toggleMusic.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.syncTime = this.syncTime.bind(this);
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.initMusic);
        } else {
            this.initMusic();
        }
    }

    initMusic() {
        try {
            // Crear el elemento de audio
            this.audio = document.createElement('audio');
            this.audio.id = 'globalBackgroundMusic';
            this.audio.loop = true;
            this.audio.preload = 'auto';
            this.audio.volume = this.volume;
            this.audio.src = this.musicUrl;
            this.audio.style.display = 'none';
            
            document.body.appendChild(this.audio);
            
            console.log('✅ Música de fondo inicializada');
            this.isInitialized = true;
            this.setupEventListeners();
            this.attemptAutoPlay();
            
        } catch (error) {
            console.error('❌ Error al inicializar música:', error);
        }
    }

    setupEventListeners() {
        if (!this.audio) return;

        this.audio.addEventListener('canplay', () => {
            console.log('🎵 Música lista para reproducir');
            // Sincronizar tiempo cuando la música esté lista
            this.syncFromStorage();
        });

        this.audio.addEventListener('play', () => {
            console.log('▶️ Música iniciada');
            localStorage.setItem('musicPlaying', 'true');
            this.startTimeSync();
        });

        this.audio.addEventListener('pause', () => {
            console.log('⏸️ Música pausada');
            localStorage.setItem('musicPlaying', 'false');
            this.stopTimeSync();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('❌ Error en la música:', e);
        });

        // Guardar tiempo actual antes de salir de la página
        window.addEventListener('beforeunload', () => {
            if (this.audio && !this.audio.paused) {
                localStorage.setItem('musicCurrentTime', this.audio.currentTime);
                localStorage.setItem('musicTimestamp', Date.now());
                console.log('💾 Tiempo guardado:', this.audio.currentTime);
            }
        });

        // Sincronizar cuando la página se vuelve visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.audio) {
                this.syncFromStorage();
            }
        });
    }

    // Sincronizar tiempo desde localStorage
    syncFromStorage() {
        const wasPlaying = localStorage.getItem('musicPlaying') === 'true';
        const savedTime = parseFloat(localStorage.getItem('musicCurrentTime')) || 0;
        const savedTimestamp = parseInt(localStorage.getItem('musicTimestamp')) || 0;
        
        if (wasPlaying && savedTime > 0) {
            // Calcular el tiempo que ha pasado desde que se guardó
            const elapsed = (Date.now() - savedTimestamp) / 1000;
            const newTime = savedTime + elapsed;
            
            // Ajustar por si la canción ya terminó (si es que no está en loop)
            const adjustedTime = this.audio.duration ? newTime % this.audio.duration : newTime;
            
            this.audio.currentTime = adjustedTime;
            console.log('🔄 Tiempo sincronizado a:', adjustedTime);
            
            // Reproducir automáticamente si estaba sonando
            this.playMusic();
        }
    }

    // Iniciar sincronización de tiempo
    startTimeSync() {
        this.stopTimeSync(); // Limpiar cualquier intervalo anterior
        
        this.syncInterval = setInterval(() => {
            if (this.audio && !this.audio.paused) {
                localStorage.setItem('musicCurrentTime', this.audio.currentTime);
                localStorage.setItem('musicTimestamp', Date.now());
            }
        }, 1000); // Guardar cada segundo
    }

    // Detener sincronización de tiempo
    stopTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async attemptAutoPlay() {
        if (!this.audio) return;

        try {
            // Verificar si debe estar reproduciéndose desde una página anterior
            const wasPlaying = localStorage.getItem('musicPlaying') === 'true';
            
            if (wasPlaying) {
                // Esperar un momento para que el audio se cargue
                await new Promise(resolve => setTimeout(resolve, 500));
                await this.audio.play();
                console.log('🎵 Reproducción automática exitosa (continuando)');
            }
        } catch (error) {
            console.log('⚠️ Autoplay bloqueado. Se necesita interacción del usuario.');
            this.setupUserInteractionHandler();
        }
    }

    setupUserInteractionHandler() {
        this.createMusicButton();

        const startMusicOnInteraction = async () => {
            try {
                await this.playMusic();
                document.removeEventListener('click', startMusicOnInteraction);
                document.removeEventListener('keydown', startMusicOnInteraction);
                document.removeEventListener('touchstart', startMusicOnInteraction);
                
                const musicBtn = document.getElementById('floatingMusicBtn');
                if (musicBtn) {
                    musicBtn.style.opacity = '0.7';
                }
            } catch (error) {
                console.log('No se pudo iniciar la música aún');
            }
        };

        document.addEventListener('click', startMusicOnInteraction, { passive: true });
        document.addEventListener('keydown', startMusicOnInteraction, { passive: true });
        document.addEventListener('touchstart', startMusicOnInteraction, { passive: true });
    }

    createMusicButton() {
        if (document.getElementById('floatingMusicBtn')) return;

        const button = document.createElement('button');
        button.id = 'floatingMusicBtn';
        button.innerHTML = '🎵';
        button.title = 'Controlar música de fondo';
        
        Object.assign(button.style, {
            position: 'fixed',
            top: '20px',
            left: '20px', // Cambiado a la izquierda para no interferir con otros elementos
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 107, 157, 0.9)',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: '10000',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.backgroundColor = 'rgba(255, 107, 157, 1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = 'rgba(255, 107, 157, 0.9)';
        });

        button.addEventListener('click', () => {
            this.toggleMusic();
            this.updateMusicButton();
        });

        document.body.appendChild(button);
        this.updateMusicButton(); // Actualizar el estado inicial
    }

    updateMusicButton() {
        const button = document.getElementById('floatingMusicBtn');
        if (!button || !this.audio) return;

        if (this.audio.paused) {
            button.innerHTML = '🔇';
            button.title = 'Música pausada - Click para reanudar';
            button.style.backgroundColor = 'rgba(150, 150, 150, 0.7)';
        } else {
            button.innerHTML = '🎵';
            button.title = 'Música reproduciéndose - Click para pausar';
            button.style.backgroundColor = 'rgba(255, 107, 157, 0.9)';
        }
    }

    async playMusic() {
        if (!this.audio) {
            console.log('❌ Audio no inicializado');
            return false;
        }

        try {
            await this.audio.play();
            return true;
        } catch (error) {
            console.error('❌ Error al reproducir música:', error);
            return false;
        }
    }

    pauseMusic() {
        if (!this.audio) return;
        this.audio.pause();
    }

    async toggleMusic() {
        if (!this.audio) return;

        if (this.audio.paused) {
            await this.playMusic();
        } else {
            this.pauseMusic();
        }
        this.updateMusicButton();
    }

    setVolume(volume) {
        if (!this.audio) return;
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        localStorage.setItem('musicVolume', this.volume.toString());
    }

    getVolume() {
        return this.volume;
    }

    isPlaying() {
        return this.audio && !this.audio.paused;
    }

    // Método para limpiar completamente el estado
    stop() {
        this.stopTimeSync();
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        localStorage.removeItem('musicPlaying');
        localStorage.removeItem('musicCurrentTime');
        localStorage.removeItem('musicTimestamp');
    }
}

// === INICIALIZACIÓN GLOBAL ===
let musicManager;

function initBackgroundMusic() {
    if (!musicManager) {
        musicManager = new BackgroundMusicManager();
        window.musicManager = musicManager;
    }
    return musicManager;
}

// Funciones públicas
function playBackgroundMusic() {
    if (musicManager) {
        return musicManager.playMusic();
    }
}

function pauseBackgroundMusic() {
    if (musicManager) {
        musicManager.pauseMusic();
    }
}

function toggleBackgroundMusic() {
    if (musicManager) {
        return musicManager.toggleMusic();
    }
}

function setBackgroundMusicVolume(volume) {
    if (musicManager) {
        musicManager.setVolume(volume);
    }
}

function isMusicAvailable() {
    return musicManager && musicManager.isInitialized;
}

function isMusicPlaying() {
    return musicManager ? musicManager.isPlaying() : false;
}

function getCurrentMusicVolume() {
    return musicManager ? musicManager.getVolume() : 0;
}

// === AUTO-INICIALIZACIÓN ===
(function() {
    console.log('🎵 Inicializando sistema de música persistente...');
    initBackgroundMusic();
})();