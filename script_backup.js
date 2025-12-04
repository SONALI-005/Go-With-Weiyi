// Sound effects using Web Audio API
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        
        this.initAudioContext();
        this.createSounds();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        this.sounds.stonePlace = () => this.createStoneSound();
        this.sounds.capture = () => this.createCaptureSound();
        this.sounds.gameStart = () => this.createGameStartSound();
        this.sounds.gameEnd = () => this.createGameEndSound();
        this.sounds.voiceStart = () => this.createVoiceStartSound();
        this.sounds.voiceEnd = () => this.createVoiceEndSound();
        this.sounds.error = () => this.createErrorSound();
        this.sounds.confetti = () => this.createConfettiSound();
    }
    
    createStoneSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    createGameStartSound() {
        if (!this.audioContext) return;
        
        const frequencies = [261.63, 329.63, 392.00];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5 + index * 0.1);
            
            oscillator.start(this.audioContext.currentTime + index * 0.1);
            oscillator.stop(this.audioContext.currentTime + 0.5 + index * 0.1);
        });
    }
    
    createErrorSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(180, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.sounds[soundName]();
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// Game constants
const BOARD_SIZE = 5;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// Game logic functions
const createEmptyBoard = () => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
};

const isValidMove = (board, row, col) => {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return false;
    }
    return board[row][col] === EMPTY;
};

const placeStone = (board, row, col, player) => {
    if (!isValidMove(board, row, col)) {
        return null;
    }
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = player;
    return newBoard;
};

const getAdjacent = (row, col) => {
    return [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ].filter(([r, c]) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE);
};

const hasLiberties = (board, row, col, player, visited = new Set()) => {
    const key = `${row},${col}`;
    if (visited.has(key)) return false;
    visited.add(key);
    
    const adjacent = getAdjacent(row, col);
    
    for (const [adjRow, adjCol] of adjacent) {
        if (board[adjRow][adjCol] === EMPTY) {
            return true;
        }
        if (board[adjRow][adjCol] === player && hasLiberties(board, adjRow, adjCol, player, visited)) {
            return true;
        }
    }
    return false;
};

const removeCapturedStones = (board, player) => {
    const newBoard = board.map(row => [...row]);
    const opponent = player === BLACK ? WHITE : BLACK;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (newBoard[row][col] === opponent && !hasLiberties(newBoard, row, col, opponent)) {
                const toRemove = [];
                const visited = new Set();
                
                const findGroup = (r, c) => {
                    const key = `${r},${c}`;
                    if (visited.has(key) || newBoard[r][c] !== opponent) return;
                    visited.add(key);
                    toRemove.push([r, c]);
                    
                    getAdjacent(r, c).forEach(([adjR, adjC]) => {
                        if (newBoard[adjR][adjC] === opponent) {
                            findGroup(adjR, adjC);
                        }
                    });
                };
                
                findGroup(row, col);
                toRemove.forEach(([r, c]) => {
                    newBoard[r][c] = EMPTY;
                });
            }
        }
    }
    return newBoard;
};

const getAIMove = (board) => {
    const availableMoves = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMove(board, row, col)) {
                availableMoves.push([row, col]);
            }
        }
    }
    
    if (availableMoves.length === 0) return null;
    
    const scoredMoves = availableMoves.map(([row, col]) => {
        let score = Math.random() * 10;
        
        const centerDistance = Math.abs(row - 2) + Math.abs(col - 2);
        score += (4 - centerDistance) * 2;
        
        const adjacent = getAdjacent(row, col);
        const nearbyStones = adjacent.filter(([r, c]) => board[r][c] !== EMPTY).length;
        score += nearbyStones * 3;
        
        return { move: [row, col], score };
    });
    
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
};

const isGameOver = (board) => {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === EMPTY) {
                return false;
            }
        }
    }
    return true;
};

const calculateScore = (board) => {
    let blackScore = 0;
    let whiteScore = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === BLACK) blackScore++;
            if (board[row][col] === WHITE) whiteScore++;
        }
    }
    
    return { black: blackScore, white: whiteScore };
};

const parseVoiceCommand = (command) => {
    if (!command || typeof command !== 'string') return null;
    
    const cleanCommand = command.toLowerCase().trim();
    console.log('Parsing voice command:', cleanCommand);
    
    const normalized = cleanCommand
        .replace(/\b(um|uh|the|a|an|please|go|to|at|on|in)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const patterns = [
        /^([a-e])\s*([1-5])$/,
        /^([a-e])\s*(\d)$/,
        /^([1-5])\s*([1-5])$/,
        /^(\d)\s*(\d)$/,
        /^row\s*([1-5])\s*col(?:umn)?\s*([1-5])$/,
        /^r\s*([1-5])\s*c\s*([1-5])$/,
        /^(?:place|move|put)\s*(?:at|to)?\s*([1-5])\s*([1-5])$/,
        /^(?:place|move|put)\s*(?:at|to)?\s*([a-e])\s*([1-5])$/,
        /^([a-e][1-5])$/,
    ];
    
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = normalized.match(pattern);
        
        if (match) {
            let row, col;
            
            if (match[1] && match[1].match(/[a-e]/)) {
                col = match[1].charCodeAt(0) - 'a'.charCodeAt(0);
                row = parseInt(match[2]) - 1;
            } else {
                row = parseInt(match[1]) - 1;
                col = parseInt(match[2]) - 1;
            }
            
            if (row >= 0 && row < 5 && col >= 0 && col < 5) {
                return { row, col };
            }
        }
    }
    
    return null;
};

class GoWithWeiyi {
    constructor() {
        this.board = createEmptyBoard();
        this.currentPlayer = BLACK;
        this.gameActive = true;
        this.lastMove = null;
        this.scores = { black: 0, white: 0 };
        this.isThinking = false;
        this.playerName = '';
        this.recognition = null;
        this.permissionGranted = false;
        this.isListening = false;
        this.soundEffects = new SoundEffects();
        
        this.initSpeechRecognition();
        this.initGame();
        this.bindEvents();
    }

    initGame() {
        // Start welcome message immediately without delay
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        const messages = [
            "Go with Weiyi!",
            "When black and white stones fall, life and death begins.",
            "Click the F button or Start button to start the game!"
        ];

        // Start speaking immediately
        let delay = 500;
        messages.forEach((message, index) => {
            setTimeout(() => {
                this.speak(message, { volume: 0.8, rate: 0.9 });
            }, delay);
            delay += message.length * 60 + 1500;
        });
    }

    speak(text, options = {}) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = options.volume || 0.8;
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.0;
            
            if (options.lang) {
                utterance.lang = options.lang;
            }
            
            speechSynthesis.speak(utterance);
        }
    }

    bindEvents() {
        // Welcome screen events
        document.getElementById('play-button').onclick = () => {
            this.enableAudio();
            this.showSetup();
        };
        
        // Setup screen events
        document.getElementById('start-game-btn').onclick = () => this.startGameWithName();
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGameWithName();
        });
        
        // Game screen events
        document.getElementById('new-game-btn').onclick = () => this.newGame();
        document.getElementById('back-to-menu-btn').onclick = () => this.backToMenu();
        document.getElementById('start-voice-btn').onclick = () => this.startListening();
        document.getElementById('stop-voice-btn').onclick = () => this.stopListening();

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Enable audio on any user interaction
        document.addEventListener('click', () => this.enableAudio(), { once: true });
    }

    enableAudio() {
        if (this.soundEffects.audioContext && this.soundEffects.audioContext.state === 'suspended') {
            this.soundEffects.audioContext.resume();
        }
    }

    handleKeyPress(event) {
        const welcomeScreen = document.getElementById('welcome-screen');
        const setupScreen = document.getElementById('setup-screen');
        const gameScreen = document.getElementById('game-screen');
        
        if (!welcomeScreen.classList.contains('hidden')) {
            if (event.key === 'f' || event.key === 'F') {
                this.enableAudio();
                const fKey = document.getElementById('f-key');
                fKey.classList.add('pressed');
                this.soundEffects.play('gameStart');
                setTimeout(() => {
                    fKey.classList.remove('pressed');
                    this.showSetup();
                }, 300);
            }
        } else if (!gameScreen.classList.contains('hidden')) {
            if (event.code === 'Space' && this.currentPlayer === BLACK && !this.isListening && !this.isThinking) {
                event.preventDefault();
                this.startListening();
            } else if (event.key === 'Escape' && this.isListening) {
                event.preventDefault();
                this.stopListening();
            } else if (event.key === 'h' || event.key === 'H') {
                this.showHelp();
            }
        }
    }

    showSetup() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('player-name').focus();
        this.speak("What's your name, challenger?", { volume: 0.8, rate: 0.9 });
    }

    startGameWithName() {
        const nameInput = document.getElementById('player-name');
        this.playerName = nameInput.value.trim() || 'Player';
        
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        this.speak(`Welcome ${this.playerName}! Let the battle begin!`, { volume: 0.8, rate: 0.9 });
        
        setTimeout(() => {
            this.createBoard();
            this.updateDisplay();
            this.addAIMessage(`So you're ${this.playerName}? Let's see if you can live up to that name! Make your first move!`);
            
            // Add help instruction
            setTimeout(() => {
                this.speak('Say "help" for instructions', { volume: 0.8, rate: 0.9 });
            }, 2000);
        }, 1000);
    }

    backToMenu() {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
        this.resetGame();
        this.playerName = '';
        document.getElementById('player-name').value = '';
    }

    newGame() {
        this.resetGame();
        this.createBoard();
        this.updateDisplay();
        this.addAIMessage("Fresh battlefield! Let's see if you've learned anything from our last encounter.");
        this.speak("New game started! Show me what you've got!", { volume: 0.8, rate: 0.9 });
    }

    resetGame() {
        this.board = createEmptyBoard();
        this.currentPlayer = BLACK;
        this.lastMove = null;
        this.scores = { black: 0, white: 0 };
        this.gameActive = true;
        this.isThinking = false;
        this.hideThinking();
    }

    createBoard() {
        const boardElement = document.getElementById('go-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.onclick = () => this.makeMove(row, col);
                cell.setAttribute('aria-label', 
                    `Board position ${String.fromCharCode(65 + col)}${row + 1} - empty`);
                boardElement.appendChild(cell);
            }
        }
    }

    makeMove(row, col) {
        if (!this.gameActive || !isValidMove(this.board, row, col) || this.currentPlayer !== BLACK || this.isThinking) {
            if (!isValidMove(this.board, row, col)) {
                this.addAIMessage("That spot is taken! Choose an empty intersection, rookie!");
                this.speak("That position is occupied! Try another spot.", { volume: 0.8, rate: 1.0 });
                this.soundEffects.play('error');
            }
            return;
        }

        // Place stone and handle captures
        let newBoard = placeStone(this.board, row, col, BLACK);
        if (!newBoard) return;
        
        newBoard = removeCapturedStones(newBoard, BLACK);
        
        this.board = newBoard;
        this.lastMove = { row, col, player: BLACK };
        this.updateBoard();
        this.updateScores();
        this.currentPlayer = WHITE;
        this.updateDisplay();

        this.soundEffects.play('stonePlace');

        const colLetter = String.fromCharCode(65 + col);
        this.addAIMessage(`${colLetter}${row + 1}? Interesting choice... Let me show you how it's really done!`);

        this.showThinking();
        setTimeout(() => this.aiMove(), 1500);
    }

    aiMove() {
        if (isGameOver(this.board)) {
            this.endGame();
            return;
        }

        const aiMoveCoords = getAIMove(this.board);
        if (!aiMoveCoords) {
            this.endGame();
            return;
        }

        const [row, col] = aiMoveCoords;
        
        // Place AI stone and handle captures
        let newBoard = placeStone(this.board, row, col, WHITE);
        if (!newBoard) return;
        
        newBoard = removeCapturedStones(newBoard, WHITE);
        
        this.board = newBoard;
        this.lastMove = { row, col, player: WHITE };
        this.updateBoard();
        this.updateScores();
        this.currentPlayer = BLACK;
        this.hideThinking();
        this.updateDisplay();

        this.soundEffects.play('stonePlace');
        this.addAIResponse(row, col);
        
        // Check for game end
        if (isGameOver(this.board)) {
            setTimeout(() => this.endGame(), 1000);
        }
    }

    getValidMoves() {
        const moves = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.board[row][col] === 0) {
                    moves.push([row, col]);
                }
            }
        }
        return moves;
    }

    getStrategicMove(moves) {
        // Enhanced AI strategy
        const center = moves.find(([r, c]) => r === 2 && c === 2);
        if (center) return center;

        // Block player wins or create own winning opportunities
        const strategicMoves = this.findStrategicMoves(moves);
        if (strategicMoves.length > 0) {
            return strategicMoves[Math.floor(Math.random() * strategicMoves.length)];
        }

        // Prefer corners and edges
        const corners = moves.filter(([r, c]) => 
            (r === 0 || r === 4) && (c === 0 || c === 4));
        if (corners.length) return corners[0];

        return moves[Math.floor(Math.random() * moves.length)];
    }

    findStrategicMoves(moves) {
        // Simple strategic analysis - prefer moves near existing stones
        return moves.filter(([row, col]) => {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && this.board[nr][nc] !== 0) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    addAIResponse(row, col) {
        const colLetter = String.fromCharCode(65 + col);
        const responses = [
            `**Masterful!** ${colLetter}${row + 1} - calculated to perfection! Your move, challenger! 💪`,
            `**Strategic brilliance!** Placed at ${colLetter}${row + 1}. Can you match my intellect? 🧠`,
            `**Weiyi strikes!** ${colLetter}${row + 1} - feeling the pressure yet, human? 😎`,
            `**Flawless execution!** ${colLetter}${row + 1}. This is how a master plays! ⚡`,
            `**Devastating move!** ${colLetter}${row + 1} - your turn to try and counter! 🔥`,
            `**Precision incarnate!** ${colLetter}${row + 1}. Study this move well! 🎯`
        ];
        
        const message = responses[Math.floor(Math.random() * responses.length)];
        this.addAIMessage(message);
        this.speak(`Placed at ${colLetter}${row + 1}. Your turn!`, { volume: 0.8, rate: 0.9 });
    }

    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            const isLastMove = this.lastMove && this.lastMove.row === row && this.lastMove.col === col;
            
            cell.className = `cell ${isLastMove ? 'last-move' : ''} ${this.currentPlayer !== BLACK ? 'disabled' : ''}`;
            cell.innerHTML = '';
            
            const colLetter = String.fromCharCode(65 + col);
            let ariaLabel = `Board position ${colLetter}${row + 1}`;
            
            if (value !== EMPTY) {
                const stone = document.createElement('div');
                stone.className = `stone ${value === BLACK ? 'black' : 'white'} ${isLastMove ? 'placement' : ''}`;
                cell.appendChild(stone);
                ariaLabel += value === BLACK ? ' - black stone' : ' - white stone';
            } else {
                ariaLabel += ' - empty';
            }
            
            cell.setAttribute('aria-label', ariaLabel);
        });
    }

    updateScores() {
        this.scores = calculateScore(this.board);
    }

    updateDisplay() {
        document.getElementById('black-score').textContent = this.scores.black;
        document.getElementById('white-score').textContent = this.scores.white;
        
        const turnIndicator = document.getElementById('current-turn');
        if (this.currentPlayer === BLACK) {
            turnIndicator.innerHTML = `<div class="turn-stone black"></div><span>${this.playerName}'s Turn</span>`;
            turnIndicator.className = 'turn-indicator player';
            this.updateVoiceStatus(true);
        } else {
            turnIndicator.innerHTML = '<div class="turn-stone white"></div><span>Weiyi\'s Turn</span>';
            turnIndicator.className = 'turn-indicator ai';
            this.updateVoiceStatus(false);
        }
    }

    updateVoiceStatus(isPlayerTurn) {
        const voiceStatus = document.getElementById('voice-status');
        const startBtn = document.getElementById('start-voice-btn');
        
        if (isPlayerTurn && !this.isThinking) {
            voiceStatus.textContent = '🎤 Your turn - Voice commands active';
            voiceStatus.className = 'voice-status active';
            startBtn.disabled = false;
        } else {
            voiceStatus.textContent = '⏳ Waiting for your turn...';
            voiceStatus.className = 'voice-status inactive';
            startBtn.disabled = true;
        }
    }

    addAIMessage(message) {
        const messageDiv = document.getElementById('ai-message');
        messageDiv.innerHTML = message;
    }

    showThinking() {
        this.isThinking = true;
        document.getElementById('thinking-indicator').classList.remove('hidden');
    }

    hideThinking() {
        this.isThinking = false;
        document.getElementById('thinking-indicator').classList.add('hidden');
    }

    endGame() {
        this.gameActive = false;
        const winner = this.scores.black > this.scores.white ? 'You' : 
                     this.scores.white > this.scores.black ? 'Weiyi' : 'Draw';
        
        let message;
        if (winner === 'You') {
            message = "Impressive! You've bested me this time. But don't get cocky - I'll be back stronger!";
        } else if (winner === 'Weiyi') {
            message = "Victory is mine! As expected. Better luck next time, human!";
        } else {
            message = "A draw? Interesting... You're more skilled than I initially thought.";
        }
        
        this.addAIMessage(`**Game Over!** ${message}`);
        this.speak(`Game over! ${winner === 'Draw' ? "It's a draw!" : winner + " wins!"}`, 
                  { volume: 0.8, rate: 0.9 });
    }

    // Speech Recognition
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.permissionGranted = true;
                this.isListening = true;
                this.updateListeningUI();
                this.addAIMessage("**Listening...** Say your move like 'A2' or 'B3'! 👂");
            };

            this.recognition.onresult = (event) => {
                console.log('Speech recognition result:', event.results);
                const transcript = event.results[0][0].transcript.toLowerCase().trim();
                console.log('Transcript:', transcript);
                this.handleVoiceCommand(transcript);
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                this.isListening = false;
                this.updateListeningUI();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateListeningUI();
                
                if (event.error === 'not-allowed') {
                    this.addAIMessage("**Microphone access denied!** Please allow microphone access and refresh the page! 🎤");
                    this.permissionGranted = false;
                } else if (event.error === 'no-speech') {
                    this.addAIMessage("**No speech detected!** Try speaking louder! 🎤");
                } else {
                    this.addAIMessage("**Speech error!** Please try again! 🎤");
                }
            };

            // Request permission early
            this.requestMicrophonePermission();
        } else {
            console.warn('Speech recognition not supported');
            document.getElementById('start-voice-btn').disabled = true;
            document.getElementById('voice-status').textContent = '❌ Speech recognition not supported';
        }
    }

    async requestMicrophonePermission() {
        try {
            // Request microphone permission using getUserMedia
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
            this.permissionGranted = true;
            console.log('Microphone permission granted');
        } catch (error) {
            console.log('Microphone permission denied or not available:', error);
            this.permissionGranted = false;
        }
    }

    startListening() {
        console.log('Attempting to start listening...', {
            hasRecognition: !!this.recognition,
            currentPlayer: this.currentPlayer,
            isThinking: this.isThinking,
            isListening: this.isListening
        });
        
        if (this.recognition && this.currentPlayer === 1 && !this.isThinking && !this.isListening) {
            try {
                this.recognition.start();
                console.log('Recognition.start() called');
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.addAIMessage("**Error starting voice recognition!** Try again! 🎤");
            }
        } else {
            console.log('Cannot start listening:', {
                noRecognition: !this.recognition,
                notPlayerTurn: this.currentPlayer !== 1,
                isThinking: this.isThinking,
                alreadyListening: this.isListening
            });
        }
    }

    stopListening() {
        console.log('Stopping listening...');
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.speak("Cancelled", { volume: 0.6 });
        }
    }

    updateListeningUI() {
        const startBtn = document.getElementById('start-voice-btn');
        const stopBtn = document.getElementById('stop-voice-btn');
        const transcriptDiv = document.getElementById('transcript-display');
        
        console.log('Updating UI - isListening:', this.isListening);
        
        if (this.isListening) {
            startBtn.textContent = '🎤 Listening...';
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            startBtn.textContent = '🎤 Start Voice';
            startBtn.disabled = this.currentPlayer !== 1 || this.isThinking;
            stopBtn.disabled = true;
            setTimeout(() => {
                transcriptDiv.classList.add('hidden');
            }, 3000);
        }
    }

    handleVoiceCommand(transcript) {
        console.log('Handling voice command:', transcript);
        
        document.getElementById('transcript-text').textContent = `"${transcript}"`;
        document.getElementById('transcript-display').classList.remove('hidden');

        if (transcript.includes('help')) {
            this.showHelp();
            return;
        }

        const command = parseVoiceCommand(transcript);
        
        if (command) {
            const { row, col } = command;
            const colLetter = String.fromCharCode(65 + col);
            this.addAIMessage(`**Got it!** You said ${colLetter}${row + 1}. Making your move! 🎯`);
            this.makeMove(row, col);
        } else {
            this.addAIMessage(`**Couldn't understand "${transcript}"** Try saying 'A1', 'B2', or 'row 1 column 2'! 🤔`);
            this.speak("I didn't understand that. Try saying a position like A1 or B2.", { volume: 0.8, rate: 1.0 });
        }
    }

    showHelp() {
        const helpMessage = "Say a position like A1, B2, or C3 to place your stone. You can also say 'row 1 column 2'. Press space to start listening.";
        this.addAIMessage(`**Help:** ${helpMessage}`);
        this.speak(helpMessage, { volume: 0.8, rate: 0.9 });
    }

    // Text-to-Speech
    speak(text, options = {}) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = options.volume || 0.8;
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.0;
            
            if (options.lang) {
                utterance.lang = options.lang;
            }
            
            speechSynthesis.speak(utterance);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GoWithWeiyi();
});
