# High Five Me - Backend

Node.js/Express backend with Socket.io for real-time communication.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
```

3. Run development server:

```bash
npm run dev
```

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add environment variables:
   - `PORT`: (Render will set this automatically, but you can override)
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
5. Deploy

## Environment Variables

- `PORT`: Server port (default: 5000, Render sets this automatically)
- `FRONTEND_URL`: The URL of your frontend application for CORS configuration

## API

The server uses Socket.io for real-time communication:

- **Connection**: Clients connect via WebSocket
- **Events**:
  - `click`: Client sends click data `{ userId, x, y, timestamp }`
  - `click`: Server broadcasts new clicks to all clients
  - `highFive`: Server emits when a match is found
  - `clickRemoved`: Server emits when a click expires
  - `userCount`: Server broadcasts current user count
