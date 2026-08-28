package in.harshitkumar7525.RapidQuiz.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {

    private String gameId;
    private List<Entry> leaderboard;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Entry {
        private int rank;
        private String participantId;
        private String name;
        private double score;
    }
}