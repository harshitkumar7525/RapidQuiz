package in.harshitkumar7525.RapidQuiz.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {

    @NotBlank(message = "participantId is required")
    private String participantId;

    @NotNull(message = "questionIndex is required")
    @Min(value = 0, message = "questionIndex must be >= 0")
    private Integer questionIndex;

    @NotBlank(message = "answer is required")
    private String answer;
}