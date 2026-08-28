package in.harshitkumar7525.RapidQuiz.repository;

import in.harshitkumar7525.RapidQuiz.document.Quizzes;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface QuizRepository extends MongoRepository<Quizzes, String> {
    List<Quizzes> findByCreatedBy(String Id);
}
