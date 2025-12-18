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
}

const activeClicks = new Map<string, ClickData>();
const CLICK_TIMEOUT = 500;
const MATCH_THRESHOLD = 0.02; // 1% of screen size (0.01 = 1%)

// Track connected users
let connectedUsers = 0;

// Helper function to calculate distance between two clicks
function getDistance(click1: ClickData, click2: ClickData): number {
  const dx = click1.x - click2.x;
  const dy = click1.y - click2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper function to check if two clicks match
function clicksMatch(click1: ClickData, click2: ClickData): boolean {
  if (click1.userId === click2.userId) return false; // Don't match own clicks
  const distance = getDistance(click1, click2);
  return distance <= MATCH_THRESHOLD;
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
    const matches: ClickData[] = [];
    for (const [existingId, existingClick] of activeClicks.entries()) {
      if (clicksMatch(click, existingClick)) {
        matches.push(existingClick);
      }
    }

    // If matches found, emit high-five events
    if (matches.length > 0) {
      matches.forEach((match) => {
        const highFiveId = `highfive-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const highFiveData: HighFiveData = {
          id: highFiveId,
          x: click.x,
          y: click.y,
          timestamp: Date.now(),
        };
        io.emit("highFive", highFiveData);
      });
    }

    // Set timeout to remove click
    setTimeout(() => {
      removeClick(clickId);
    }, CLICK_TIMEOUT);
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
