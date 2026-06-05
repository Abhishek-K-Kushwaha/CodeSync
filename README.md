# CodeSync

CodeSync is a collaborative real-time coding web application built with a React/Vite frontend and a Node.js/Express backend. It supports shared code editing, live user presence, room-based access with passcodes, and sandboxed code execution for C++ and Python using Docker.

## Architecture Overview

### 1. Frontend

- Location: `client/`
- Framework: React + TypeScript
- Build system: Vite
- Real-time communication: `socket.io-client`
- Editor: `@monaco-editor/react`

The frontend provides:
- A join/create room flow with room ID, passcode, and username.
- A collaborative code editor that syncs code changes across users in the same room.
- Language selection between C++ and Python.
- Input/output panels for running code.
- A sidebar showing room details and connected users.

Key client files:
- `client/src/App.tsx` — main app state, socket connection, event handlers, and entry point for room lifecycle.
- `client/src/JoinScreen.tsx` — UI for creating or joining rooms.
- `client/src/Workspace.tsx` — editor, language selector, execution button, input/output panels.
- `client/src/Sidebar.tsx` — room metadata and active user list.

### 2. Backend

- Location: `server/`
- Runtime: Node.js with Express
- Real-time layer: `socket.io`
- Database: PostgreSQL via Prisma
- Sandbox execution: Docker containers

The backend handles:
- WebSocket connections and room event handling.
- Room creation, join authorization, and real-time broadcast of code/language updates.
- Persistence of room metadata and code state in Postgres.
- Queued sandboxed execution of submitted code in isolated Docker containers.

Key backend files:
- `server/src/index.ts` — Express app setup, `socket.io` server, and connection registration.
- `server/src/sockets/editorSocket.ts` — socket event handlers for room lifecycle, code sync, language updates, execution, and disconnect logic.
- `server/src/services/roomService.ts` — Prisma-based room CRUD operations.
- `server/src/lib/prisma.ts` — Prisma client initialization.
- `server/prisma/schema.prisma` — database model for rooms.

### 3. Database

- Database: PostgreSQL
- Schema model: `Room`
- Primary key: `roomCode`
- Stored room state:
  - `roomCode` (String)
  - `passcode` (String)
  - `language` (String)
  - `code` (String)
  - `createdAt` (DateTime)

This schema stores persistent room metadata and the latest code/language state for rooms.

### 4. Code Execution

The backend executes code inside Docker containers from the host environment.

- `server/src/utils/execution/dockerRunner.ts` — generic Docker runner that mounts a temporary workspace and executes commands inside an isolated container.
- `server/src/utils/execution/executePython.ts` — runs Python code in a `python:3.9-slim` container.
- `server/src/utils/execution/executeCpp.ts` — compiles and runs C++ code in a `gcc` container.
- `server/src/utils/execution/executionQueue.ts` — serializes execution requests to a single worker slot to avoid concurrent container overload and measures latency metrics.

### 5. Deployment

The repository includes a Docker Compose setup to launch the backend and database together.

- `docker-compose.yml` defines:
  - `postgres` service for the database.
  - `backend` service built from `server/`.

The backend container is granted access to the Docker socket and a host workspace volume at `/opt/codesync-workspaces` to run sandboxed code.

## Running the Project

### Option 1: Docker Compose

Create a `.env` file with the PostgreSQL credentials, then run:

```bash
docker-compose up --build
```

### Option 2: Local Development

#### Backend

```bash
cd server
npm install
npm run dev
```

#### Frontend

```bash
cd client
npm install
npm run dev
```

## Notes

- The backend uses in-memory room state for active realtime sessions with periodic persistence to the database.
- Rooms are cleaned up from memory when all users disconnect.
- Code execution is isolated to Docker containers with memory and network restrictions.

## Directory Structure

- `client/` — React frontend application
- `server/` — Express backend, Prisma service, and Docker-based execution utilities
- `docker-compose.yml` — local service orchestration with PostgreSQL and backend

## Useful Commands

- `docker-compose up --build` — build and run the backend and database
- `client/npm run dev` — start frontend development server
- `server/npm run dev` — start backend development server
- `server/npm run build` — compile backend TypeScript
- `server/npm start` — start compiled backend in production mode
