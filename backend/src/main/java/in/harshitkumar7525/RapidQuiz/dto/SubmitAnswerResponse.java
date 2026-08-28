package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.Answer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerResponse {

    private boolean isCorrect;
    private Integer score;
    private String message;

    public static SubmitAnswerResponse from(Answer answer) {
        String message = answer.isCorrect() ? "correct answer!" : "wrong answer";
        return new SubmitAnswerResponse(answer.isCorrect(), answer.getScore(), message);
    }
}