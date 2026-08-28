package in.harshitkumar7525.RapidQuiz.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "game_sessions")
public class GameSession {

    @Id
    private String id;

    private String quizId;

    private String hostId;

    @Indexed(unique = true)
    private String roomCode;

    private GameStatus status;

    private Integer currentQuestion;

    private LocalDateTime questionStartedAt;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    public enum GameStatus {
        WAITING, RUNNING, PAUSED, ENDED
    }
}