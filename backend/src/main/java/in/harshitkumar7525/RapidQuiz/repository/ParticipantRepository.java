package in.harshitkumar7525.RapidQuiz.repository;

import in.harshitkumar7525.RapidQuiz.document.Participant;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends MongoRepository<Participant, String> {
    Optional<Participant> findByGameIdAndName(String gameId, String name);
    List<Participant> findByGameId(String gameId);
}