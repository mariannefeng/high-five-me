import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

interface ClickData {
  id: string;
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

interface ClickPayload {
  userId: string;
  x: number;
  y: number;
  timestamp?: number;
}

interface HighFiveData {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  totalMatches: number;
  superMatch?: boolean;
}

const activeClicks = new Map<string, ClickData>();
const CLICK_TIMEOUT = 500;
const MATCH_THRESHOLD = 0.02; // 2% of screen size (0.01 = 1%)
const SUPER_MATCH_THRESHOLD = 0.005;

// Track connected users
let connectedUsers = 0;

// Helper function to calculate distance between two clicks
function getDistance(click1: ClickData, click2: ClickData): number {
  const dx = click1.x - click2.x;
  const dy = click1.y - click2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper function to calculate the distance difference between two clicks.
// If the value is negative, the clicks are too far apart.
function distance(click1: ClickData, click2: ClickData): number {
  if (click1.userId === click2.userId) return -1;
  const distance = getDistance(click1, click2);
  return MATCH_THRESHOLD - distance;
}

// Clean up expired clicks
function removeClick(clickId: string): void {
  if (activeClicks.has(clickId)) {
    activeClicks.delete(clickId);
    io.emit("clickRemoved", clickId);
  }
}

io.on("connection", (socket: Socket) => {
  connectedUsers++;
  io.emit("userCount", connectedUsers);
  console.log(`User connected. Total users: ${connectedUsers}`);

  socket.on("click", (clickData: ClickPayload) => {
    const clickId = `click-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const click: ClickData = {
      id: clickId,
      userId: clickData.userId,
      x: clickData.x,
      y: clickData.y,
      timestamp: clickData.timestamp || Date.now(),
    };

    // Store the click
    activeClicks.set(clickId, click);

    // Broadcast the click to all users
    io.emit("click", click);

    // Check for matches with existing clicks
    const matches: Array<{ click: ClickData; distance: number }> = [];
    for (const [existingId, existingClick] of activeClicks.entries()) {
      if (distance(click, existingClick) > 0) {
        const actualDistance = getDistance(click, existingClick);
        matches.push({ click: existingClick, distance: actualDistance });
      }
    }

    if (matches.length > 0) {
      // Emit a highFive event for each match, with superMatch determined per match
      matches.forEach(({ click: match, distance: matchDistance }) => {
        const highFiveId = `highfive-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const highFiveData: HighFiveData = {
          id: highFiveId,
          x: click.x,
          y: click.y,
          timestamp: Date.now(),
          superMatch: matchDistance < SUPER_MATCH_THRESHOLD,
          totalMatches: matches.length + 1,
        };
        io.emit("highFive", highFiveData);
      });
    }

    if (process.env.NO_TIMEOUT !== "true") {
      setTimeout(() => {
        removeClick(clickId);
      }, CLICK_TIMEOUT);
    }
  });

  socket.on("disconnect", () => {
    connectedUsers--;
    io.emit("userCount", connectedUsers);
    console.log(`User disconnected. Total users: ${connectedUsers}`);
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
