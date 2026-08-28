package in.harshitkumar7525.RapidQuiz.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import in.harshitkumar7525.RapidQuiz.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;


@Component
public class JwtUtil {

    private static final Duration TOKEN_TTL = Duration.ofHours(48);
    private static final String USER_ID_CLAIM = "userId";

    private final SecretKey signingKey;

    public JwtUtil(@Value("${app.jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + TOKEN_TTL.toMillis());
        return Jwts.builder()
                .claim(USER_ID_CLAIM, userId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String validateAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            String userId = claims.get(USER_ID_CLAIM, String.class);
            if (userId == null || userId.isBlank()) {
                throw new UnauthorizedException("invalid token");
            }
            return userId;
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("invalid token");
        }
    }
}