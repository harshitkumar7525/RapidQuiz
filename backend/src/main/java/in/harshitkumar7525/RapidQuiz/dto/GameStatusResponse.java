package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameStatusResponse {

    private String message;
    private String gameId;
    private GameSession.GameStatus status;
    private Integer currentQuestion;

    public static GameStatusResponse from(GameSession game) {
        return new GameStatusResponse(
                "game status updated successfully",
                game.getId(),
                game.getStatus(),
                game.getCurrentQuestion()
        );
    }
}