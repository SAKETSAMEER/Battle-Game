// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "https://game-war-trial.netlify.app", // Your Netlify front-end URL
        methods: ["GET", "POST"]
    }
});
// Serve the static files from your game directory
app.use(express.static(path.join(__dirname)));

const servers = {
    'server-1': [],
    'server-2': [],
    'server-3': [],
    'server-4': []
};

// --- NEW LOGIC START: Track active matches ---
const activeMatches = {};
// --- NEW LOGIC END ---

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send the initial server status to the newly connected client
    socket.emit('server-status', getServerStatus());

    socket.on('join-server', (serverId) => {
        if (servers[serverId] && servers[serverId].length < 8) {
            leaveCurrentServer(socket); // Ensure user is only in one server at a time

            socket.join(serverId);
            // Store socket ID only for lobby purposes
            servers[serverId].push(socket.id);
            socket.currentServer = serverId;

            console.log(`${socket.id} joined ${serverId}`);
            io.emit('server-status', getServerStatus());
        }
    });

    socket.on('start-matchmaking', (serverId) => {
        const room = servers[serverId];
        if (room && room.length >= 2) {
            // Find this player in the room and remove them from the queue
            const player1Id = socket.id;
            const player1Index = room.indexOf(player1Id);
            if (player1Index > -1) {
                room.splice(player1Index, 1);
            }

            // Find an opponent from the remaining players in the room
            const player2Id = room.splice(0, 1)[0];

            console.log(`Pairing ${player1Id} and ${player2Id}`);

            // --- NEW LOGIC START: Create a match object ---
            const matchId = player1Id + player2Id;
            activeMatches[matchId] = {
                player1: player1Id,
                player2: player2Id,
                player1Data: null,
                player2Data: null
            };
            // Assign matchId to sockets for easy lookup
            io.sockets.sockets.get(player1Id).matchId = matchId;
            io.sockets.sockets.get(player2Id).matchId = matchId;
            // --- NEW LOGIC END ---

            // Emit to the specific players that a match is found
            io.to(player1Id).emit('match-found', { opponentId: player2Id });
            io.to(player2Id).emit('match-found', { opponentId: player1Id });

            // Update server status after pairing
            io.emit('server-status', getServerStatus());
        }
    });

    // --- NEW LOGIC START: Handle battle data and turns ---
    socket.on('player-data-ready', (playerData) => {
        const matchId = socket.matchId;
        if (!activeMatches[matchId]) return;

        const match = activeMatches[matchId];
        if (socket.id === match.player1) {
            match.player1Data = playerData;
        } else {
            match.player2Data = playerData;
        }

        // Once both players have sent their data, start the battle
        if (match.player1Data && match.player2Data) {
            console.log(`Starting battle for match: ${matchId}`);
            // Randomly decide who starts
            const player1Starts = Math.random() < 0.5;

            io.to(match.player1).emit('battle-start', {
                opponent: match.player2Data,
                starts: player1Starts
            });
            io.to(match.player2).emit('battle-start', {
                opponent: match.player1Data,
                starts: !player1Starts
            });
        }
    });

    socket.on('player-action', (action) => {
        const matchId = socket.matchId;
        if (!activeMatches[matchId]) return;

        const match = activeMatches[matchId];
        const opponentId = (socket.id === match.player1) ? match.player2 : match.player1;

        // Forward the action to the opponent
        io.to(opponentId).emit('opponent-action', action);
    });
    // --- NEW LOGIC END ---

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // --- NEW LOGIC START: Handle disconnects during a match ---
        const matchId = socket.matchId;
        if (matchId && activeMatches[matchId]) {
            const match = activeMatches[matchId];
            const opponentId = (socket.id === match.player1) ? match.player2 : match.player1;
            io.to(opponentId).emit('opponent-disconnected');
            delete activeMatches[matchId]; // Clean up the match
        }
        // --- NEW LOGIC END ---

        leaveCurrentServer(socket);
        io.emit('server-status', getServerStatus());
    });

    function leaveCurrentServer(socket) {
        if (socket.currentServer && servers[socket.currentServer]) {
            servers[socket.currentServer] = servers[socket.currentServer].filter(id => id !== socket.id);
            socket.leave(socket.currentServer);
            console.log(`${socket.id} left ${socket.currentServer}`);
            delete socket.currentServer;
        }
    }

    function getServerStatus() {
        const status = {};
        for (const serverId in servers) {
            status[serverId] = servers[serverId].length;
        }
        return status;
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT}/online.html to see the lobby`);
});