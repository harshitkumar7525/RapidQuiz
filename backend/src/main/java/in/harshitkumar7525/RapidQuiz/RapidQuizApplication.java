package in.harshitkumar7525.RapidQuiz;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class RapidQuizApplication {

	public static void main(String[] args) {
		SpringApplication.run(RapidQuizApplication.class, args);
	}

}