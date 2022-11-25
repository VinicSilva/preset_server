"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const SOCKET_PORT = 3003;
const API_PORT = 3004;
const io = new socket_io_1.Server({
    cors: {
        origin: ["http://localhost:3000"]
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const pubClient = (0, redis_1.createClient)({ url: 'rediss://default:7d2124cdb801440b8eeb360a3b7f3c2e@global-stable-bear-30339.upstash.io:30339' });
    yield pubClient.connect();
    const subClient = pubClient.duplicate();
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    io.listen(SOCKET_PORT);
}))();
console.log(`[SOCKET SERVER]: running at https://localhost:${SOCKET_PORT}`);
io.on("connection", (socket) => {
    socket.on("joinRoom", ({ username, room }) => {
        const welcomeMessage = `[SERVER TO CLIENT] Welcome ${username} at room ${room} !`;
        console.log(welcomeMessage);
        socket.join(room);
        socket.emit("roomUsers", { room });
        io.of("/").to(room).emit("roomUsers", { room });
    });
    socket.on("disconnect", () => {
        console.log("🚀  USER DISCONNECTED ", socket.id, socket.rooms);
    });
    // Listen for feedbackMessage
    socket.on("feedbackMessage", (msg) => {
        console.log("🚀 ~ Receiving message from client", msg, socket.id, socket.rooms);
    });
});
app.post('/send-to-client', (req, res) => {
    const { gasPump, user, cnpj } = req.body;
    console.log("🚀  SEND TO THE CLIENT ", { gasPump, user, cnpj });
    io.of("/").to(`preset-${cnpj}`).emit("message", { gasPump, user, cnpj, date: new Date().toString() });
    res.send('OK');
});
app.listen(API_PORT, () => console.log(`[SERVER API]: running at https://localhost:${API_PORT}`));
