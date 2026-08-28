package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGameResponse {

    private String message;
    private String roomCode;
    private String gameId;
    private GameSession.GameStatus status;
    private Integer currentQuestion;

    public static CreateGameResponse from(GameSession game) {
        return new CreateGameResponse(
                "game session created successfully",
                game.getRoomCode(),
                game.getId(),
                game.getStatus(),
                game.getCurrentQuestion()
        );
    }
}