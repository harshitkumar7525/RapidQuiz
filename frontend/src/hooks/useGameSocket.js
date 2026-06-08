import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../api/client.js';

export default function useGameSocket(roomCode, onMessage) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    if (!roomCode) return;
    const ws = new WebSocket(`${WS_URL}/ws/${roomCode}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      let parsed;
      try { parsed = JSON.parse(e.data); } catch { parsed = { type: 'raw', data: e.data }; }
      cbRef.current && cbRef.current(parsed);
    };
    return () => { ws.close(); };
  }, [roomCode]);

  const send = (type, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  };

  return { connected, send };
}
