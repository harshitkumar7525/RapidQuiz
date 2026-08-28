package in.harshitkumar7525.RapidQuiz.config;

import in.harshitkumar7525.RapidQuiz.websocket.GameWebSocketHandler;
import in.harshitkumar7525.RapidQuiz.websocket.RoomCodeHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final GameWebSocketHandler gameWebSocketHandler;
    private final RoomCodeHandshakeInterceptor roomCodeHandshakeInterceptor;

    public WebSocketConfig(GameWebSocketHandler gameWebSocketHandler,
                           RoomCodeHandshakeInterceptor roomCodeHandshakeInterceptor) {
        this.gameWebSocketHandler = gameWebSocketHandler;
        this.roomCodeHandshakeInterceptor = roomCodeHandshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gameWebSocketHandler, "/ws/{roomCode}")
                .addInterceptors(roomCodeHandshakeInterceptor)
                .setAllowedOrigins("*");
    }
}