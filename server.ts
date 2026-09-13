import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mock database for demo
  let marketplaceItems = [
    { id: '1', name: 'Organic Wheat', price: 40, unit: 'kg', farmer: 'Rajesh Kumar', location: 'Punjab', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400' },
    { id: '2', name: 'Fresh Tomatoes', price: 25, unit: 'kg', farmer: 'Suresh Singh', location: 'Maharashtra', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400' },
    { id: '3', name: 'Basmati Rice', price: 80, unit: 'kg', farmer: 'Amit Patel', location: 'Gujarat', image: 'https://images.unsplash.com/photo-1586201327693-866199f1417f?auto=format&fit=crop&q=80&w=400' },
  ];

  // API Routes
  app.get("/api/products", (req, res) => {
    res.json(marketplaceItems);
  });

  app.post("/api/products", (req, res) => {
    const newProduct = {
      id: Date.now().toString(),
      ...req.body
    };
    marketplaceItems = [newProduct, ...marketplaceItems];
    res.status(201).json(newProduct);
  });

  // Socket.io for real-time chat
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("send_message", (data) => {
      // data: { room, sender, text, timestamp }
      io.to(data.room).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
