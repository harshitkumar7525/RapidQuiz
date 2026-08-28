package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameDetailsResponse {

    private String gameId;
    private String quizId;
    private String hostId;
    private String roomCode;
    private GameSession.GameStatus status;
    private Integer currentQuestion;
    private Integer totalQuestions;
    private QuestionBroadcastResponse currentQuestionData;
    private List<ParticipantSummary> participants;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}