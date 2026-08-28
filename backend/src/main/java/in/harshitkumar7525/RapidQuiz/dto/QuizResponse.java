package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.Question;
import in.harshitkumar7525.RapidQuiz.document.Quizzes;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {

    private String id;
    private String title;
    private String description;
    private String createdBy;
    private List<Question> questions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static QuizResponse from(Quizzes quiz) {
        return new QuizResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getCreatedBy(),
                quiz.getQuestions(),
                quiz.getCreatedAt(),
                quiz.getUpdatedAt()
        );
    }
}