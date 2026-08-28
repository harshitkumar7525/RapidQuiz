package in.harshitkumar7525.RapidQuiz.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class LeaderboardService {

    private static final Duration TTL = Duration.ofHours(24);
    private static final int TOP_N = 20;

    private final RedisTemplate<String, String> redisTemplate;

    public LeaderboardService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void recordScore(String gameId, String participantId, int score) {
        String key = leaderboardKey(gameId);
        redisTemplate.opsForZSet().incrementScore(key, participantId, score);
        redisTemplate.expire(key, TTL);
    }

    public Set<ZSetOperations.TypedTuple<String>> topN(String gameId) {
        Set<ZSetOperations.TypedTuple<String>> results =
                redisTemplate.opsForZSet().reverseRangeWithScores(leaderboardKey(gameId), 0, TOP_N - 1);
        return results != null ? results : new LinkedHashSet<>();
    }

    private String leaderboardKey(String gameId) {
        return "leaderboard:" + gameId;
    }
}