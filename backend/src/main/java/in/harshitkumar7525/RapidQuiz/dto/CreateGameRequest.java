package in.harshitkumar7525.RapidQuiz.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGameRequest {

    @NotBlank(message = "quizId is required")
    private String quizId;
}