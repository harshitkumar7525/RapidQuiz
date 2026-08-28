package in.harshitkumar7525.RapidQuiz.repository;

import in.harshitkumar7525.RapidQuiz.document.Answer;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnswerRepository extends MongoRepository<Answer, String> {
    boolean existsByGameIdAndParticipantIdAndQuestionIndex(String gameId, String participantId, Integer questionIndex);
}