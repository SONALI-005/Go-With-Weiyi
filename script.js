// Simple working version with fixed welcome message and microphone permission

class GoWithWeiyi {
    constructor() {
        this.board = Array(5).fill().map(() => Array(5).fill(0));
        this.currentPlayer = 1; // 1 = black (player), 2 = white (AI)
        this.gameActive = true;
        this.lastMove = null;
        this.scores = { black: 0, white: 0 };
        this.isThinking = false;
        this.playerName = '';
        this.recognition = null;
        this.permissionGranted = false;
        this.isListening = false;
        
        this.initSpeechRecognition();
        this.initGame();
        this.bindEvents();
    }

    initGame() {
        // Start welcome message immediately
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        const messages = [
            "Go with Weiyi!",
            "When black and white stones fall, life and death begins.",
            "Click the F button or Start button to start the game!"
        ];

        // Start immediately with shorter delays
        let delay = 100;
        messages.forEach((message, index) => {
            setTimeout(() => {
                this.speak(message);
            }, delay);
            delay += message.length * 40 + 1000;
        });
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 0.8;
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    // Simple sound effects
    playSound(type) {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (AudioContext || webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'stone') {
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        }
    }

    bindEvents() {
        document.getElementById('play-button').onclick = () => this.showSetup();
        document.getElementById('start-game-btn').onclick = () => this.startGameWithName();
        document.getElementById('about-weiyi-btn').onclick = () => this.showAbout();
        document.getElementById('back-to-setup-btn').onclick = () => this.backToSetup();
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGameWithName();
        });
        document.getElementById('new-game-btn').onclick = () => this.newGame();
        document.getElementById('back-to-menu-btn').onclick = () => this.backToMenu();
        document.getElementById('start-voice-btn').onclick = () => this.startListening();
        document.getElementById('stop-voice-btn').onclick = () => this.stopListening();
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(event) {
        const welcomeScreen = document.getElementById('welcome-screen');
        const aboutScreen = document.getElementById('about-screen');
        const gameScreen = document.getElementById('game-screen');
        
        if (!welcomeScreen.classList.contains('hidden')) {
            if (event.key === 'f' || event.key === 'F') {
                const fKey = document.getElementById('f-key');
                fKey.classList.add('pressed');
                setTimeout(() => {
                    fKey.classList.remove('pressed');
                    this.showSetup();
                }, 300);
            }
        } else if (!aboutScreen.classList.contains('hidden')) {
            if (event.key === 'f' || event.key === 'F') {
                const fKey = document.getElementById('f-key-about');
                fKey.classList.add('pressed');
                setTimeout(() => {
                    fKey.classList.remove('pressed');
                    this.backToSetup();
                }, 300);
            }
        } else if (!gameScreen.classList.contains('hidden')) {
            if (event.code === 'Space' && this.currentPlayer === 1 && !this.isListening && !this.isThinking) {
                event.preventDefault();
                this.startListening();
            } else if (event.key === 'Escape' && this.isListening) {
                event.preventDefault();
                this.stopListening();
            }
        }
    }

    showSetup() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('player-name').focus();
        
        setTimeout(() => {
            this.speak("What's your name, challenger?");
        }, 500);
    }

    showAbout() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('about-screen').classList.remove('hidden');
    }

    backToSetup() {
        document.getElementById('about-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('player-name').focus();
    }

    startGameWithName() {
        const nameInput = document.getElementById('player-name');
        this.playerName = nameInput.value.trim() || 'Player';
        
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        this.speak(`Go with Weiyi! Click F button or start button to start playing the game. Welcome ${this.playerName}! Let the battle begin!`);
        
        setTimeout(() => {
            this.createBoard();
            this.updateDisplay();
            this.addAIMessage(`So you're ${this.playerName}? Let's see if you can live up to that name! Make your first move!`);
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
    }

    resetGame() {
        this.board = Array(5).fill().map(() => Array(5).fill(0));
        this.currentPlayer = 1;
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
                boardElement.appendChild(cell);
            }
        }
    }

    makeMove(row, col) {
        if (!this.gameActive || this.board[row][col] !== 0 || this.currentPlayer !== 1 || this.isThinking) {
            if (this.board[row][col] !== 0) {
                this.addAIMessage("That spot is taken! Choose an empty intersection, rookie!");
                this.speak("That position is occupied! Try another spot.");
            }
            return;
        }

        this.board[row][col] = 1;
        this.lastMove = { row, col, player: 1 };
        this.playSound('stone'); // Add sound effect
        this.updateBoard();
        this.updateScores();
        this.currentPlayer = 2;
        this.updateDisplay();

        const colLetter = String.fromCharCode(65 + col);
        this.addAIMessage(`${colLetter}${row + 1}? Interesting choice... Let me show you how it's really done!`);

        this.showThinking();
        setTimeout(() => this.aiMove(), 1500);
    }

    aiMove() {
        const moves = this.getValidMoves();
        if (moves.length === 0) {
            this.endGame();
            return;
        }

        const strategicMove = this.getStrategicMove(moves);
        const [row, col] = strategicMove;
        
        this.board[row][col] = 2;
        this.lastMove = { row, col, player: 2 };
        this.playSound('stone'); // Add sound effect
        this.updateBoard();
        this.updateScores();
        this.currentPlayer = 1;
        this.hideThinking();
        this.updateDisplay();

        this.addAIResponse(row, col);
        
        // Check for game end
        if (this.getValidMoves().length === 0) {
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
        const center = moves.find(([r, c]) => r === 2 && c === 2);
        if (center) return center;

        const corners = moves.filter(([r, c]) => 
            (r === 0 || r === 4) && (c === 0 || c === 4));
        if (corners.length) return corners[0];

        return moves[Math.floor(Math.random() * moves.length)];
    }

    addAIResponse(row, col) {
        const colLetter = String.fromCharCode(65 + col);
        const responses = [
            `**Masterful!** ${colLetter}${row + 1} - calculated to perfection! Your move, challenger! 💪`,
            `**Strategic brilliance!** Placed at ${colLetter}${row + 1}. Can you match my intellect? 🧠`,
            `**Weiyi strikes!** ${colLetter}${row + 1} - feeling the pressure yet, human? 😎`
        ];
        
        const message = responses[Math.floor(Math.random() * responses.length)];
        this.addAIMessage(message);
        this.speak(`Placed at ${colLetter}${row + 1}. Your turn!`);
    }

    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            const isLastMove = this.lastMove && this.lastMove.row === row && this.lastMove.col === col;
            
            cell.className = `cell ${isLastMove ? 'last-move' : ''} ${this.currentPlayer !== 1 ? 'disabled' : ''}`;
            cell.innerHTML = '';
            
            if (value !== 0) {
                const stone = document.createElement('div');
                stone.className = `stone ${value === 1 ? 'black' : 'white'} ${isLastMove ? 'placement' : ''}`;
                cell.appendChild(stone);
            }
        });
    }

    updateScores() {
        let blackCount = 0, whiteCount = 0;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.board[row][col] === 1) blackCount++;
                else if (this.board[row][col] === 2) whiteCount++;
            }
        }
        this.scores = { black: blackCount, white: whiteCount };
    }

    updateDisplay() {
        document.getElementById('black-score').textContent = this.scores.black;
        document.getElementById('white-score').textContent = this.scores.white;
        
        const turnIndicator = document.getElementById('current-turn');
        if (this.currentPlayer === 1) {
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
        this.speak(`Game over! ${winner === 'Draw' ? "It's a draw!" : winner + " wins!"}`);
    }

    // Speech Recognition - SIMPLIFIED
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.permissionGranted = true;
                this.isListening = true;
                this.updateListeningUI();
                this.addAIMessage("**Listening...** Say your move like 'A2' or 'B3'! 👂");
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase().trim();
                this.handleVoiceCommand(transcript);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateListeningUI();
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                this.updateListeningUI();
                
                if (event.error === 'not-allowed') {
                    this.addAIMessage("**Microphone access denied!** Please allow microphone access! 🎤");
                } else {
                    this.addAIMessage("**Speech error!** Please try again! 🎤");
                }
            };
        }
    }

    startListening() {
        if (this.recognition && this.currentPlayer === 1 && !this.isThinking && !this.isListening) {
            this.recognition.start();
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    updateListeningUI() {
        const startBtn = document.getElementById('start-voice-btn');
        const stopBtn = document.getElementById('stop-voice-btn');
        const transcriptDiv = document.getElementById('transcript-display');
        
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
        document.getElementById('transcript-text').textContent = `"${transcript}"`;
        document.getElementById('transcript-display').classList.remove('hidden');

        if (transcript.includes('help')) {
            this.showHelp();
            return;
        }

        // Parse move commands (A2, B3, etc.)
        const match = transcript.match(/([a-e])\s*(\d)/i);
        
        if (match) {
            const col = match[1].toUpperCase().charCodeAt(0) - 65;
            const row = parseInt(match[2]) - 1;
            
            if (row >= 0 && row < 5 && col >= 0 && col < 5) {
                const colLetter = String.fromCharCode(65 + col);
                this.addAIMessage(`**Got it!** You said ${colLetter}${row + 1}. Making your move! 🎯`);
                this.makeMove(row, col);
            } else {
                this.addAIMessage("**Invalid position!** Try 'A1' to 'E5'! 📍");
            }
        } else {
            this.addAIMessage(`**Couldn't understand "${transcript}"** Try saying 'A1', 'B2', or 'C3'! 🤔`);
        }
    }

    showHelp() {
        const helpMessage = "Say a position like A1, B2, or C3 to place your stone. Press space to start listening.";
        this.addAIMessage(`**Help:** ${helpMessage}`);
        this.speak(helpMessage);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GoWithWeiyi();
});
