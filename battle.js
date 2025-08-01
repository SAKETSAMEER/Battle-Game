
// battle.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // --- Global State for Online Battle ---
    let myPlayerData = null;
    let opponentPlayerData = null;
    let isMyTurn = false;

    // --- UI Elements ---
    const opponentNameEl = document.getElementById('battle_opponentName');
    const playerNameEl = document.getElementById('battle_playerName');
    const logEl = document.getElementById('battle_log');
    // ... (get all other necessary UI elements like health bars, buttons, etc.)

    // --- Initial Setup ---
    function initializeBattle() {
        // 1. Retrieve the player's saved data from localStorage
        const savedData = localStorage.getItem('onlinePlayerStats');
        if (!savedData) {
            alert('Could not find player data! Returning to lobby.');
            window.location.href = '/online.html';
            return;
        }
        myPlayerData = JSON.parse(savedData);
        myPlayerData.socketId = socket.id; // Add socket ID for server identification

        // 2. Send this player's data to the server to be shared with the opponent
        socket.emit('player-data-ready', myPlayerData);
        logMessage('Waiting for opponent...');
    }

    // --- Socket Event Handlers ---
    // In battle.js, REPLACE the existing 'battle-start' handler with this one

    socket.on('battle-start', (data) => {
        console.log("Battle Start event received!", data); // Good for debugging
        opponentPlayerData = data.opponent;
        isMyTurn = data.starts;

        // --- NEW INITIALIZATION LOGIC ---
        // Initialize HP, Stamina, etc. for both players based on their full stats
        myPlayerData.maxHp = (myPlayerData.stats.dur + myPlayerData.stats.end) * 100;
        myPlayerData.hp = myPlayerData.maxHp;
        myPlayerData.maxStamina = (myPlayerData.stats.spd + myPlayerData.stats.end) * 10;
        myPlayerData.stamina = myPlayerData.maxStamina;

        opponentPlayerData.maxHp = (opponentPlayerData.stats.dur + opponentPlayerData.stats.end) * 100;
        opponentPlayerData.hp = opponentPlayerData.maxHp;
        // We don't need to track opponent stamina on the client side

        // Setup the initial UI
        playerNameEl.textContent = myPlayerData.playerName;
        opponentNameEl.textContent = opponentPlayerData.playerName;

        // Set images
        document.getElementById('battle_playerImage').src = myPlayerData.playerBattleImage;
        document.getElementById('battle_opponentImage').src = opponentPlayerData.playerBattleImage;

        // Update the health and stamina bars for the first time
        battle_updateHealthBars();
        battle_updateStaminaBar();

        logMessage('Battle Start!');
        if (isMyTurn) {
            logMessage('It is your turn.');
            enableControls();
        } else {
            logMessage('Waiting for opponent to move...');
            disableControls();
        }
    });

    socket.on('opponent-action', (action) => {
        // Logic to process the opponent's move (e.g., they attacked)
        // Update your game state and UI based on action
        logMessage(`Opponent used ${action.type}!`);
        // ... (calculate damage, apply effects)

        // It's now your turn
        isMyTurn = true;
        // This new line updates the single-player turn variable after the opponent moves
        window.battle_isPlayerTurn = isMyTurn;

        logMessage('It is your turn.');
        enableControls();
    });

    socket.on('battle-end', (result) => {
        if (result.winner === socket.id) {
            logMessage('You are victorious!');
        } else {
            logMessage('You have been defeated.');
        }
        disableControls();
        // Add a button to return to the lobby
    });
    // In battle.js, add this new socket event listener

    socket.on('opponent-disconnected', () => {
        logMessage('Opponent has disconnected. You win!');
        disableControls();
        // Optionally add a button to return to the lobby
        const lobbyBtn = document.createElement('button');
        lobbyBtn.textContent = 'Return to Lobby';
        lobbyBtn.onclick = () => window.location.href = '/online.html';
        document.querySelector('.action-panel .buttons').innerHTML = '';
        document.querySelector('.action-panel .buttons').appendChild(lobbyBtn);
    });


    // --- Game Logic Functions ---
    function logMessage(msg) {
        logEl.innerHTML += `${msg}<br>`;
        logEl.scrollTop = logEl.scrollHeight;
    }

    // In battle.js, REPLACE the empty functions with these

    function enableControls() {
        document.getElementById('online-attack-btn').disabled = false;
        document.getElementById('online-defence-btn').disabled = false;
        document.getElementById('online-attack-card-btn').disabled = false;
        document.getElementById('online-buff-card-btn').disabled = false;
        document.getElementById('online-debuff-card-btn').disabled = false;
    }

    function disableControls() {
        document.getElementById('online-attack-btn').disabled = true;
        document.getElementById('online-defence-btn').disabled = true;
        document.getElementById('online-attack-card-btn').disabled = true;
        document.getElementById('online-buff-card-btn').disabled = true;
        document.getElementById('online-debuff-card-btn').disabled = true;
        // Also hide the card container if it's open
        document.getElementById('battle_cardContainer').style.display = 'none';
    }

    // This function will be called by your buttons (attack, use card, etc.)
    window.battle_playerMove = function (moveType, cardData = null) {
        if (!isMyTurn) return;

        const action = {
            type: moveType,
            card: cardData,
            // ... any other relevant data
        };

        // 1. Process the action locally (update your own UI immediately for responsiveness)
        logMessage(`You used ${moveType}!`);
        // ... (calculate damage, etc.)

        // 2. Send the action to the server
        socket.emit('player-action', action);

        // 3. It's no longer your turn
        isMyTurn = false;
        disableControls();
        logMessage('Waiting for opponent...');
    }
    // --- UI Event Listeners for Online Battle ---
    document.getElementById('online-attack-btn').addEventListener('click', () => battle_playerMove('attack'));
    document.getElementById('online-defence-btn').addEventListener('click', () => battle_playerMove('defence'));
    document.getElementById('online-attack-card-btn').addEventListener('click', () => battle_toggleCardContainer('attack-card'));
    document.getElementById('online-buff-card-btn').addEventListener('click', () => battle_toggleCardContainer('buff-card'));
    document.getElementById('online-debuff-card-btn').addEventListener('click', () => battle_toggleCardContainer('debuff-card'));
    // Paste these functions into battle.js

    function battle_updateHealthBars() {
        // We'll use the global online battle data here
        const playerHealthPercent = Math.max(0, (myPlayerData.hp / myPlayerData.maxHp) * 100);
        const opponentHealthPercent = Math.max(0, (opponentPlayerData.hp / opponentPlayerData.maxHp) * 100);

        document.getElementById("battle_playerHealth").style.width = playerHealthPercent + "%";
        document.getElementById("battle_opponentHealth").style.width = opponentHealthPercent + "%";
    }

    function battle_updateStaminaBar() {
        // We'll use the global online battle data here
        const staminaPercent = Math.max(0, (myPlayerData.stamina / myPlayerData.maxStamina) * 100);
        document.getElementById("battle_playerStamina").style.width = staminaPercent + "%";
        document.getElementById("battle_playerStaminaText").textContent = `${Math.floor(myPlayerData.stamina)}/${myPlayerData.maxStamina}`;
    }

    function battle_toggleCardContainer(type) {
        // This function can remain largely the same, but we need to ensure it's called correctly.
        // For online play, we'll need a more robust implementation later, but this gets the UI working.
        const cardContainer = document.getElementById("battle_cardContainer");
        if (cardContainer.style.display === 'block' && window.battle_currentCardType === type) {
            cardContainer.style.display = 'none';
            return;
        }
        window.battle_currentCardType = type;
        battle_updateCardButtons();
        cardContainer.style.display = 'flex'; // Use flex as per your CSS
    }

    function battle_updateCardButtons() {
        const cardContainer = document.getElementById("battle_cardContainer");
        cardContainer.innerHTML = "";
        if (!myPlayerData || !myPlayerData.cards) return;

        const cardType = window.battle_currentCardType.replace('-card', '');
        const relevantCards = myPlayerData.cards.filter(card => card.type === cardType);

        relevantCards.forEach((card) => {
            const btn = document.createElement("button");
            let buttonText = card.name;
            // Simplified for online; cooldowns/uses will be managed by the main logic
            btn.textContent = buttonText;
            btn.onclick = () => {
                // This now calls the global move function for online play
                window.battle_playerMove('use-card', card);
                cardContainer.style.display = 'none'; // Hide after use
            };
            cardContainer.appendChild(btn);
        });
    }
    // --- Start the process ---
    initializeBattle();
});
