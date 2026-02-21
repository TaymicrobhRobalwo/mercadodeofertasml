const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let activeDevices = {};

function cleanInactiveDevices() {
    const now = Date.now();
    for (let id in activeDevices) {
        if (now - activeDevices[id].timestamp > 30000) {
            delete activeDevices[id];
        }
    }
}

function getStats() {
    cleanInactiveDevices();

    let stats = { 1: 0, 2: 0, 3: 0 };

    Object.values(activeDevices).forEach(device => {
        if (stats[device.step] !== undefined) {
            stats[device.step]++;
        }
    });

    return stats;
}

io.on("connection", (socket) => {

    socket.on("updateStep", (data) => {
        activeDevices[data.deviceId] = {
            step: data.step,
            timestamp: data.timestamp
        };
        io.emit("statsUpdate", getStats());
    });

    socket.on("disconnectDevice", (data) => {
        delete activeDevices[data.deviceId];
        io.emit("statsUpdate", getStats());
    });
});

server.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});