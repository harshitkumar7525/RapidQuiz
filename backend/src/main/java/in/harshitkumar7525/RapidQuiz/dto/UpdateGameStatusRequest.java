package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGameStatusRequest {

    @NotNull(message = "status is required")
    private GameSession.GameStatus status;
}