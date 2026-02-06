import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";
const highFiveSound = "/high-five.mp3";
const superHighFiveSound = "/super-high-five.mp3";
const wooshSound = "/high-five-miss.mp3";

const CLICK_TIMEOUT = 500;
const SUPER_MATCH_TIMEOUT = 9000;
const MATCH_THRESHOLD = 0.02;

function Clap({ superMatch, delay = 0 }) {
  return superMatch ? (
    <img
      src="/super-high-five.png"
      alt="Super High Five"
      className="super-clap"
      style={{ animationDelay: `${delay}s` }}
    />
  ) : (
    <div className="clap" style={{ animationDelay: `${delay}s` }}>
      👏
    </div>
  );
}

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
  const clicksRef = useRef([]);

  useEffect(() => {
    clicksRef.current = clicks;
  }, [clicks]);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Generate unique user ID
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(id);

    // Connect to backend - update this with your Render backend URL
    const socket = io(
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      },
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to serverrrrr");
    });

    socket.on("userCount", (count) => {
      setConnectedUsers(count);
    });

    socket.on("click", (clickData) => {
      setClicks((prev) => [...prev, clickData]);
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

      setTimeout(
        () => {
          setHighFives((prev) => prev.filter((h) => h.id !== matchData.id));
        },
        matchData.superMatch ? SUPER_MATCH_TIMEOUT : CLICK_TIMEOUT,
      );
    });

    socket.on("clickRemoved", (clickId) => {
      console.log("clickRemoved", clickId);

      const currentClicks = clicksRef.current;
      const hadClick = currentClicks.some((c) => c.id === clickId);
      if (!hadClick) {
        return;
      }

      setClicks((prev) => prev.filter((c) => c.id !== clickId));

      console.log("playing woosh sound");

      const audio = new Audio(wooshSound);
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.error("Error playing woosh sound:", err);
      });
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
        click.userId === userId && now - click.timestamp < CLICK_TIMEOUT * 10,
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
          {highFive.totalMatches && (
            <>
              {highFive.totalMatches === 2 ? (
                // For 2 matches, render a single clap without transform
                <div className="total-matches">
                  <Clap superMatch={highFive.superMatch} />
                </div>
              ) : (
                // For other cases, render claps in a circular pattern
                Array.from({ length: highFive.totalMatches }).map((_, i) => {
                  // Offset each match in a circular pattern
                  // Use (i + 0.5) to center the circle and avoid overlap at 0/2π
                  const angle =
                    ((i + 0.5) / highFive.totalMatches) * 2 * Math.PI;
                  // Calculate radius to prevent overlap: emoji is 4rem (~64px)
                  // Minimum radius = emojiSize / (2 * sin(π/n)) to ensure no overlap
                  const emojiSize = 64; // 4rem in pixels
                  const radius = Math.max(
                    emojiSize * 0.8,
                    emojiSize / (2 * Math.sin(Math.PI / highFive.totalMatches)),
                  );
                  const offsetX = Math.cos(angle) * radius;
                  const offsetY = Math.sin(angle) * radius;

                  const staggerDelay = i * 0.1; // 0.1s delay between each clap
                  return (
                    <div
                      key={i}
                      className="total-matches"
                      style={{
                        transform: `translate(${offsetX}px, ${offsetY}px)`,
                      }}
                    >
                      <Clap
                        superMatch={highFive.superMatch}
                        delay={staggerDelay}
                      />
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
