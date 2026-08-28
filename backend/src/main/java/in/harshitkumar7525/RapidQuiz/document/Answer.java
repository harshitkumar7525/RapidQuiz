package in.harshitkumar7525.RapidQuiz.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "answers")
public class Answer {

    @Id
    private String id;

    private String gameId;

    private String participantId;

    private Integer questionIndex;

    private String answer;

    private boolean isCorrect;

    private Integer score;

    private LocalDateTime answeredAt;
}