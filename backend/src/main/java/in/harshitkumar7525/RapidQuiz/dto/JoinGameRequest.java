package in.harshitkumar7525.RapidQuiz.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinGameRequest {

    @NotBlank(message = "roomCode is required")
    private String roomCode;

    @NotBlank(message = "name is required")
    private String name;
}