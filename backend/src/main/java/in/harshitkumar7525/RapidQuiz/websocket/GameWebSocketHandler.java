package in.harshitkumar7525.RapidQuiz.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final String ROOM_CODE_ATTR = "roomCode";

    private final RoomRegistry roomRegistry;

    public GameWebSocketHandler(RoomRegistry roomRegistry) {
        this.roomRegistry = roomRegistry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomCode = (String) session.getAttributes().get(ROOM_CODE_ATTR);
        roomRegistry.join(roomCode, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String roomCode = (String) session.getAttributes().get(ROOM_CODE_ATTR);
        roomRegistry.broadcast(roomCode, message, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomCode = (String) session.getAttributes().get(ROOM_CODE_ATTR);
        if (roomCode != null) {
            roomRegistry.leave(roomCode, session);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws IOException {
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }
}