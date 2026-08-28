package in.harshitkumar7525.RapidQuiz.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriTemplate;

import java.util.Map;

@Component
public class RoomCodeHandshakeInterceptor implements HandshakeInterceptor {

    private static final UriTemplate TEMPLATE = new UriTemplate("/ws/{roomCode}");

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String path = request.getURI().getPath();
        if (TEMPLATE.matches(path)) {
            Map<String, String> vars = TEMPLATE.match(path);
            attributes.put("roomCode", vars.get("roomCode"));
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}