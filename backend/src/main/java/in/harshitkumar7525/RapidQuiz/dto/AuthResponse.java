package in.harshitkumar7525.RapidQuiz.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String message;
    private String token;

    public static AuthResponse of(String message, String token) {
        return new AuthResponse(message, token);
    }
}