// online.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const statusMessage = document.getElementById('status-message');
    const mainLobbyView = document.getElementById('main-lobby-view');
    const serverView = document.getElementById('server-view');
    const matchSearchBtn = document.getElementById('match-search-btn');
    const returnBtn = document.getElementById('return-btn');
    const leaveServerBtn = document.getElementById('leave-server-btn');
    const startMatchBtn = document.getElementById('start-match-btn');
    const serverBoxes = document.querySelectorAll('.server-box');
    const playerList = document.getElementById('player-list');

    let selectedServerId = null;

    // --- Socket.IO Event Listeners ---
    socket.on('connect', () => {
        statusMessage.textContent = 'Connected! Select an option.';
        console.log('Connected to the server with ID:', socket.id);
    });

    socket.on('disconnect', () => {
        statusMessage.textContent = 'Disconnected from server. Please refresh.';
    });

    socket.on('server-status', (status) => {
        console.log('Received server status:', status);
        serverBoxes.forEach(box => {
            const serverId = box.dataset.id;
            const playerCount = status[serverId] || 0;
            box.querySelector('.player-count').textContent = `(${playerCount}/8)`;

            if (serverId === selectedServerId) {
                playerList.textContent = `Players in server: ${playerCount}`;
                // Enable start button only if players are 2, 4, 6, or 8
                startMatchBtn.disabled = !(playerCount >= 2 && playerCount % 2 === 0);
            }
        });
    });

    socket.on('match-found', (data) => {
        console.log('Match found against:', data.opponentId);
        statusMessage.textContent = `Match found! Preparing battle...`;
        // Save opponent info and redirect to a new battle page
        localStorage.setItem('onlineOpponentId', data.opponentId);
        window.location.href = '/battle.html';
    });


    // --- UI Event Listeners ---
    matchSearchBtn.addEventListener('click', () => {
        mainLobbyView.classList.add('hidden');
        serverView.classList.remove('hidden');
    });

    returnBtn.addEventListener('click', () => {
        window.location.href = '/index.html';
    });

    leaveServerBtn.addEventListener('click', () => {
        if (selectedServerId) {
            socket.emit('leave-server', selectedServerId);
            selectedServerId = null;
        }
        serverView.classList.add('hidden');
        mainLobbyView.classList.remove('hidden');
        serverBoxes.forEach(box => box.classList.remove('selected'));
        startMatchBtn.disabled = true;
    });

    serverBoxes.forEach(box => {
        box.addEventListener('click', () => {
            selectedServerId = box.dataset.id;
            socket.emit('join-server', selectedServerId);

            serverBoxes.forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            statusMessage.textContent = `Joined ${box.textContent.split('(')[0].trim()}`;
        });
    });

    startMatchBtn.addEventListener('click', () => {
        if (selectedServerId) {
            statusMessage.textContent = 'Searching for a match...';
            socket.emit('start-matchmaking', selectedServerId);
            startMatchBtn.disabled = true; // Prevent spamming
        }
    });
});