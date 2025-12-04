import AuthRoutes from './Routers/authRouter.js'
import UserRoutes from './Routers/userRouters.js'
import mongoose from "mongoose";
import express from "express"
import { Server } from "socket.io";
import cors from "cors"
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { createServer } from 'node:http';
import { verifyToken } from "./Middleware/verifyToken.js";
import socketConnection from './socket/socket.js';
import path from 'node:path';

 dotenv.config()

 console.log(process.env.MONGO_URI);
 
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB Error:", err));
mongoose.connection.on("error", err => {

  console.log("err", err)

})
mongoose.connection.on("connected", (err, res) => {

  console.log("mongoose is connected")

})
  const app = express();
  const port = process.env.PORT;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    credentials:true
  }
});

socketConnection(io)
  app.use(
  cors({
    origin: [
      "http://localhost:5173",          // for local development
      "https://swapy-three.vercel.app", // for deployed frontend
    ],
    credentials: true, // allow cookies, authorization headers
  })
);

  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    app.use(AuthRoutes);
    app.use(UserRoutes);
  app.use(verifyToken)

    server.listen(port, () => {
    console.log("Server running at http://localhost:3000");
  });
  