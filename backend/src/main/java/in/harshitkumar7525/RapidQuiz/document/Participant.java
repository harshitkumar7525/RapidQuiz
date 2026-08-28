package in.harshitkumar7525.RapidQuiz.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "participants")
public class Participant {

    @Id
    private String id;

    private String gameId;

    private String name;

    private LocalDateTime joinedAt;
}