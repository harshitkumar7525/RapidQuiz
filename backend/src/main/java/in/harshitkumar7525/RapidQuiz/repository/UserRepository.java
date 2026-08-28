package in.harshitkumar7525.RapidQuiz.repository;

import in.harshitkumar7525.RapidQuiz.document.Users;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<Users, String> {
    Optional<Users> findByEmail(String email);
    boolean existsByEmail(String email);
}