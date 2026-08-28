package in.harshitkumar7525.RapidQuiz.websocket;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;

@Service
public class GameBroadcastService {

    private final RoomRegistry roomRegistry;
    private final ObjectMapper objectMapper;

    public GameBroadcastService(RoomRegistry roomRegistry, ObjectMapper objectMapper) {
        this.roomRegistry = roomRegistry;
        this.objectMapper = objectMapper;
    }

    public void broadcast(String roomCode, WSMessage message) {
        try {
            roomRegistry.broadcastToAll(roomCode, new TextMessage(objectMapper.writeValueAsString(message)));
        } catch (JacksonException e) {
            // message construction failure shouldn't take down the request that triggered it
        }
    }
}