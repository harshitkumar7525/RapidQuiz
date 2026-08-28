package in.harshitkumar7525.RapidQuiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {

    @NotBlank(message = "Question text is required")
    private String question;

    @NotEmpty(message = "At least 2 options are required")
    @Size(min = 2, message = "At least 2 options are required")
    private List<String> options;

    @NotBlank(message = "Correct answer is required")
    private String correctAnswer;

    private Integer timeLimit;
}