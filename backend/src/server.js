import http from 'node:http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { getEnv } from './config/env.js';
import { createApp } from './app.js';

const env = getEnv();
await mongoose.connect(env.mongoUri);
const server = http.createServer();
const io = new Server(server, { cors: { origin: env.clientOrigin } });
server.on('request', createApp(env, io));
server.listen(env.port, () => console.log(`StreamWeaver API listening on :${env.port}`));
