import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";
const highFiveSound = "/high-five.mp3";
const superHighFiveSound = "/super-high-five.mp3";

const CLICK_TIMEOUT = 500;
const SUPER_MATCH_TIMEOUT = 9000;
const MATCH_THRESHOLD = 0.02;

function App() {
  const [clicks, setClicks] = useState([]);
  const [highFives, setHighFives] = useState([]);
  const [userId, setUserId] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'light'
    return localStorage.getItem("theme") || "dark";
  });
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(highFiveSound);
    audioRef.current.volume = 0.5;

    // Generate unique user ID
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(id);

    // Connect to backend - update this with your Render backend URL
    const socket = io(
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("userCount", (count) => {
      setConnectedUsers(count);
    });

    socket.on("click", (clickData) => {
      setClicks((prev) => [...prev, clickData]);

      // Auto-remove click after timeout
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== clickData.id));
      }, CLICK_TIMEOUT);
    });

    socket.on("highFive", (matchData) => {
      const soundFile = matchData.superMatch
        ? superHighFiveSound
        : highFiveSound;
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.error("Error playing sound:", err);
      });

      // Remove clicks that are near the high-five position
      setClicks((prev) => {
        return prev.filter((click) => {
          const dx = click.x - matchData.x;
          const dy = click.y - matchData.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance > MATCH_THRESHOLD;
        });
      });

      // Add clap emoji
      setHighFives((prev) => [...prev, matchData]);

      // Remove clap emoji after timeout
      setTimeout(
        () => {
          setHighFives((prev) => prev.filter((h) => h.id !== matchData.id));
        },
        matchData.superMatch ? SUPER_MATCH_TIMEOUT : CLICK_TIMEOUT
      );
    });

    socket.on("clickRemoved", (clickId) => {
      setClicks((prev) => prev.filter((c) => c.id !== clickId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleClick = (e) => {
    if (!socketRef.current || !containerRef.current) return;

    // Check if previous click from this user hasn't expired
    const now = Date.now();
    // only allow clicks every 5 seconds
    const hasRecentClick = clicks.some(
      (click) =>
        click.userId === userId && now - click.timestamp < CLICK_TIMEOUT * 10
    );

    if (hasRecentClick) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickData = {
      userId,
      x,
      y,
      timestamp: Date.now(),
    };

    socketRef.current.emit("click", clickData);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div ref={containerRef} className="app-container" onClick={handleClick}>
      <div className="header">
        <div className="header-content">
          <h1>high five me</h1>
          {connectedUsers === 1 && <p>hear the sound of one hand </p>}
          {connectedUsers > 1 && (
            <p>{connectedUsers} people attempting to high five</p>
          )}
        </div>
        <button
          className="theme-toggle"
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      {clicks.map((click) => {
        const isOwnClick = click.userId === userId;
        return (
          <div
            key={click.id}
            className="click-indicator"
            style={{
              left: `${click.x * 100}%`,
              top: `${click.y * 100}%`,
            }}
          >
            <div className="hand">{isOwnClick ? "🤚" : "✋"}</div>
          </div>
        );
      })}

      {highFives.map((highFive) => (
        <div
          key={highFive.id}
          className="clap-indicator"
          style={{
            left: `${highFive.x * 100}%`,
            top: `${highFive.y * 100}%`,
          }}
        >
          {highFive.superMatch ? (
            <img
              src="/super-high-five.png"
              alt="Super High Five"
              className="super-clap"
            />
          ) : (
            <div className="clap">👏</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
