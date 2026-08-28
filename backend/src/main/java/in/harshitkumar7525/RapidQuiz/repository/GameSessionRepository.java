package in.harshitkumar7525.RapidQuiz.repository;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GameSessionRepository extends MongoRepository<GameSession, String> {
    Optional<GameSession> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
}