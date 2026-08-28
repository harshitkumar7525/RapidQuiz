package in.harshitkumar7525.RapidQuiz.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoomRegistry {

    private final ConcurrentHashMap<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    public void join(String roomCode, WebSocketSession session) {
        rooms.computeIfAbsent(roomCode, code -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void leave(String roomCode, WebSocketSession session) {
        Set<WebSocketSession> sessions = rooms.get(roomCode);
        if (sessions == null) return;
        sessions.remove(session);
        if (sessions.isEmpty()) {
            rooms.remove(roomCode, sessions);
        }
    }

    public Set<WebSocketSession> sessionsIn(String roomCode) {
        return rooms.getOrDefault(roomCode, Set.of());
    }

    public void broadcast(String roomCode, TextMessage message, WebSocketSession exclude) {
        for (WebSocketSession peer : sessionsIn(roomCode)) {
            if (peer.equals(exclude) || !peer.isOpen()) continue;
            try {
                peer.sendMessage(message);
            } catch (IOException e) {
                // best-effort: one bad peer shouldn't break the fan-out to the rest of the room
            }
        }
    }

    public void broadcastToAll(String roomCode, TextMessage message) {
        broadcast(roomCode, message, null);
    }
}