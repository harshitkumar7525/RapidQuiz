package in.harshitkumar7525.RapidQuiz.controllers;

import in.harshitkumar7525.RapidQuiz.document.Participant;
import in.harshitkumar7525.RapidQuiz.dto.LeaderboardResponse;
import in.harshitkumar7525.RapidQuiz.repository.ParticipantRepository;
import in.harshitkumar7525.RapidQuiz.service.LeaderboardService;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/games")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final ParticipantRepository participantRepository;

    public LeaderboardController(LeaderboardService leaderboardService,
                                 ParticipantRepository participantRepository) {
        this.leaderboardService = leaderboardService;
        this.participantRepository = participantRepository;
    }

    @GetMapping("/{gameId}/leaderboard")
    public ResponseEntity<LeaderboardResponse> get(@PathVariable String gameId) {
        Set<ZSetOperations.TypedTuple<String>> topScores = leaderboardService.topN(gameId);

        List<String> participantIds = topScores.stream()
                .map(ZSetOperations.TypedTuple::getValue)
                .toList();
        Map<String, String> namesById = new LinkedHashMap<>();
        for (Participant participant : participantRepository.findAllById(participantIds)) {
            namesById.put(participant.getId(), participant.getName());
        }

        List<LeaderboardResponse.Entry> entries = new ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> tuple : topScores) {
            String participantId = tuple.getValue();
            double score = tuple.getScore() != null ? tuple.getScore() : 0;
            entries.add(new LeaderboardResponse.Entry(
                    rank++,
                    participantId,
                    namesById.getOrDefault(participantId, "Unknown"),
                    score
            ));
        }

        return ResponseEntity.ok(new LeaderboardResponse(gameId, entries));
    }
}