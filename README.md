# Quorum

A real-time group movie picker. Everyone votes on genres, a consensus algorithm finds the overlap, and parallel TMDB API calls surface movies the whole group is actually into.

**Live:** https://quorum-client.onrender.com

---

## Stack

- **Frontend:** React → Render
- **Backend:** Node.js + Express → Render
- **Real-time:** Socket.io (WebSockets)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT
- **Movie Data:** TMDB API

## Running Locally

**Backend**
```bash
cd server
npm install
# create .env with MONGO_URI, JWT_SECRET, TMDB_API_KEY, PORT=5000
node index.js
```

**Frontend**
```bash
cd client
npm install
# create .env with REACT_APP_API_URL=http://localhost:5000
npm start

More about this project: [Portfolio](https://jwericlee.vercel.app)
```
