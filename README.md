# Quorum

**Live Demo:** https://quorum-client.onrender.com  
**Backend Repo:** https://github.com/eljw25/quorum

> Stop arguing about what to watch. Quorum lets a group of friends vote on movie genres in real time and surfaces films everyone can actually agree on.

---

## What It Does

1. A user registers, creates a room, and shares a 6-character code with friends
2. Everyone joins the room and selects genres they'd be happy watching
3. Votes sync live across all clients — no refreshing, no waiting
4. A weighted consensus algorithm finds the top genres the group overlaps on
5. The app queries TMDB and returns the top 5 movies matching those genres, with streaming availability (Netflix, Hulu, HBO Max, etc.)

---

## Tech Stack

| Layer | Technology | Why I chose it |
|---|---|---|
| Frontend | React | Component-based UI made the real-time vote tracker and genre grid easy to manage as state |
| Backend | Node.js + Express | Non-blocking I/O fits a real-time app well; fast to build REST routes |
| Real-time | Socket.io | WebSockets over HTTP polling — persistent connection means instant sync without hammering the server with requests every second |
| Database | MongoDB + Mongoose | Votes are a flexible nested structure (user → array of genres). MongoDB's document model fits this better than a rigid SQL schema |
| Auth | JWT (jsonwebtoken + bcrypt) | Stateless auth — no session store needed. The token carries the user identity and is verified on every protected route |
| Movie Data | TMDB API | Free, comprehensive, and has both movie discovery and watch provider endpoints |
| Deployment | Render | Separate Web Service (backend) + Static Site (frontend) — free tier, auto-deploys on git push |

---

## Architecture

```
Browser (React)
    │
    ├── HTTP (axios) ──────────────► Express REST API
    │       /api/auth/register          │
    │       /api/auth/login             ├── MongoDB Atlas
    │       /api/rooms/create           │     Users, Rooms, Votes
    │       /api/rooms/:code/vote       │
    │       /api/rooms/:code/results    └── TMDB API
    │                                         Movie discovery
    └── WebSocket (Socket.io) ──────► Socket.io Server
            join_room                    Broadcasts vote_update
            vote                         to all clients in room
```

---

## Key Engineering Decisions

### Why Socket.io over plain HTTP polling?

Polling means the client asks "anything new?" every N seconds. That's wasteful — most requests come back empty, and there's always a delay between the vote happening and others seeing it. Socket.io keeps a persistent WebSocket connection open. When a user votes, the server instantly pushes that update to every other client in the room. Zero unnecessary requests, zero perceptible delay.

### Why JWT over session-based auth?

Sessions require server-side storage — you need a session store (Redis, database) that every server instance can access. JWTs are self-contained: the token is signed with a secret, and any server can verify it without a database lookup. For a stateless REST API deployed on Render's single instance, JWT is simpler and scales better if I ever add more servers.

### Why MongoDB over PostgreSQL for this app?

Each room stores votes as an embedded array: `[{ userId, username, genres: ["Action", "Comedy"] }]`. In SQL, that's a Rooms table, a Votes table, and a join every time I need vote data. In MongoDB, the whole room document — including all votes — is one read. For a real-time app where I'm constantly fetching the room state, that's a meaningful difference.

### Why separate frontend and backend deploys?

I could have served the React build from Express (one service). But separating them means the backend can scale independently, the frontend is served from a CDN as static files (faster), and I can redeploy either without touching the other. It also mirrors how production systems actually work.

---

## The Matching Algorithm

This was the core problem: given N users who each voted for M genres, what do you show them?

```
1. Count how many users voted for each genre
   { "Action": 3, "Comedy": 2, "Horror": 1, "Sci-Fi": 3 }

2. Sort by count descending
   ["Action", "Sci-Fi", "Comedy", "Horror"]

3. Take the top 2
   ["Action", "Sci-Fi"]

4. Map to TMDB genre IDs and query discover/movie
   with_genres=28,878 (Action + Sci-Fi)

5. Sort by popularity, return top 5
```

The weighted count means genres with broader consensus rank higher — not just one person's strong preference. A genre that 3 out of 4 people picked beats a genre only 1 person picked, even if that 1 person picked it very strongly.

---

## Challenges I Ran Into

### The late-join problem

When a second user joined a room, they couldn't see votes the first user had already submitted. Socket.io only broadcasts *new* events — it has no memory of past events. My first instinct was to store votes in Socket.io's room state, but that's ephemeral (lost on server restart) and not the right layer for persistence.

**Fix:** On component mount, fetch the current room state from the database first. Then attach the Socket.io listener for *subsequent* updates. This way late joiners see the full history, and real-time updates layer on top.

```js
useEffect(() => {
  // 1. Get existing votes from DB (handles late joiners)
  fetchRoom();
  // 2. Join the socket room
  socket.emit('join_room', code);
  // 3. Listen for future votes
  socket.on('vote_update', (data) => { ... });
}, [code]);
```

### CORS in production

Locally everything worked fine. On Render, register calls failed immediately. The backend was only allowing `localhost:3000` — valid in dev, but the deployed frontend is at a different origin entirely.

**Fix:** Added the production frontend URL to the `allowedOrigins` array in both the Express CORS middleware and the Socket.io server config. Two separate CORS configs, both needed updating — a subtle bug.

### Environment variables not reaching the frontend build

The React app was connecting to `localhost:5000` in production because `REACT_APP_API_URL` wasn't set in Render's dashboard. Create React App bakes environment variables into the bundle at *build time*, not runtime — so the `.env` file on my machine never makes it to Render's build.

**Fix:** Set `REACT_APP_API_URL` explicitly in Render's environment variables for the static site, then triggered a manual redeploy. The variable is now injected during Render's build step.

---

## Running Locally

**Backend:**
```bash
cd server
npm install
# create .env with MONGO_URI, JWT_SECRET, TMDB_API_KEY, PORT=5000
node index.js
```

**Frontend:**
```bash
cd client
npm install
# REACT_APP_API_URL defaults to http://localhost:5000 if not set
npm start
```

---

## What I'd Add Next

- **Real-time presence** — show who's in the room and who has/hasn't voted yet
- **Swipe-style voting** — Tinder-style yes/no on individual movie posters instead of genre checkboxes
- **Host controls** — only the host triggers results; others see a "waiting for host" state
- **Room history** — users can see past rooms and what they watched

---

## Author

**Jongwook (Eric) Lee**  
CS @ University of Maryland  
[Portfolio](https://eljw25.github.io) · [GitHub](https://github.com/eljw25) · [LinkedIn](https://linkedin.com/in/ericljw)
