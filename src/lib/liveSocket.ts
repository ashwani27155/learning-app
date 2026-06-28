import { io, Socket } from "socket.io-client";

const BASE_URL = (import.meta.env.VITE_API_URL as string ?? "http://localhost:5000/api/v1")
  .replace("/api/v1", "");

let socket: Socket | null = null;

export interface LeaderboardEntry {
  rank:      number;
  name:      string;
  email?:    string; // only present in the initial REST snapshot, not the live socket broadcast
  score:     number;
  timeSpent: number;
}

export interface TimeSync {
  serverTime: number;
  endsAt:     number;
}

export function connectToLiveTest(testId: string, token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(BASE_URL, {
    auth:       { token: token ?? "" },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
  });

  if (import.meta.env.DEV) {
    socket.on("connect",    () => console.log("[live] socket connected"));
    socket.on("disconnect", () => console.log("[live] socket disconnected"));
  }
  socket.on("connect_error", (e) => console.warn("[live] connection error:", e.message));

  socket.emit("join_live_test", testId);
  return socket;
}

export function disconnectLiveTest(testId: string): void {
  if (!socket) return;
  socket.emit("leave_live_test", testId);
  socket.disconnect();
  socket = null;
}

export function onLeaderboardUpdate(cb: (entries: LeaderboardEntry[]) => void): () => void {
  socket?.on("leaderboard_update", cb);
  return () => socket?.off("leaderboard_update", cb);
}

export function onTimeSync(cb: (data: TimeSync) => void): () => void {
  socket?.on("time_sync", cb);
  return () => socket?.off("time_sync", cb);
}

export function onTestEnded(cb: () => void): () => void {
  socket?.on("test_ended", cb);
  return () => socket?.off("test_ended", cb);
}

export function onForceSubmit(cb: (data: { reason: string }) => void): () => void {
  socket?.on("force_submit", cb);
  return () => socket?.off("force_submit", cb);
}

export function onTestStarted(cb: () => void): () => void {
  socket?.on("test_started", cb);
  return () => socket?.off("test_started", cb);
}

export function onTimeWarning(cb: (data: { minutesLeft: number }) => void): () => void {
  socket?.on("time_warning", cb);
  return () => socket?.off("time_warning", cb);
}

export function onActiveCount(cb: (count: number) => void): () => void {
  socket?.on("active_count", cb);
  return () => socket?.off("active_count", cb);
}
