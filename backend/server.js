const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = new Map(); // Map to store user email to socket ID

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('room:join', ({ email, room }) => {
    users.set(email, socket.id);
    socket.join(room);
    socket.to(room).emit('user:joined', { email, id: socket.id });
    io.to(socket.id).emit('room:join', { email, room });
  });

  socket.on('user:call', ({ to, offer }) => {
    io.to(to).emit('incoming:call', { from: socket.id, offer });
  });

  socket.on('call:accepted', ({ to, answer }) => {
    io.to(to).emit('call:accepted', { from: socket.id, answer });
  });

  socket.on('peer:nego:needed', ({ to, offer }) => {
    io.to(to).emit('peer:nego:needed', { from: socket.id, offer });
  });

  socket.on('peer:nego:done', ({ to, answer }) => {
    io.to(to).emit('peer:nego:done', { from: socket.id, answer });
  });

  socket.on('message', ({ room, message }) => {
    socket.to(room).emit('message', { id: socket.id, message });
  });

  socket.on('file', ({ room, file }) => {
    socket.to(room).emit('file', { id: socket.id, file });
  });

  socket.on('disconnect', () => {
    users.forEach((id, email) => {
      if (id === socket.id) {
        users.delete(email);
        socket.broadcast.emit('user:left', { email, id: socket.id });
      }
    });
    console.log('Client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
