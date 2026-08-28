package in.harshitkumar7525.RapidQuiz.dto;

import in.harshitkumar7525.RapidQuiz.document.Participant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantSummary {

    private String id;
    private String name;

    public static ParticipantSummary from(Participant participant) {
        return new ParticipantSummary(participant.getId(), participant.getName());
    }
}