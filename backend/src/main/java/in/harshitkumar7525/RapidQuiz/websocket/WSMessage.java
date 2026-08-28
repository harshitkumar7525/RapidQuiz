package in.harshitkumar7525.RapidQuiz.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WSMessage {
    private String type;
    private Object data;
}