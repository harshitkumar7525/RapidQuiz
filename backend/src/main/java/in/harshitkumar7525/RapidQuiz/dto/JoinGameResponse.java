package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.Participant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinGameResponse {

    private String message;
    private String participantId;
    private String gameId;

    public static JoinGameResponse from(Participant participant) {
        return new JoinGameResponse("joined successfully", participant.getId(), participant.getGameId());
    }
}