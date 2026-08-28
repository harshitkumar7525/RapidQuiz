package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBroadcastResponse {

    private Integer questionIndex;
    private String question;
    private List<String> options;
    private Integer timeLimit;

    public static QuestionBroadcastResponse from(Integer questionIndex, Question question) {
        return new QuestionBroadcastResponse(
                questionIndex,
                question.getQuestion(),
                question.getOptions(),
                question.getTimeLimit()
        );
    }
}