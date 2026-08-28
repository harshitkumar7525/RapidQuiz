package in.harshitkumar7525.RapidQuiz.service;

import in.harshitkumar7525.RapidQuiz.document.Users;
import in.harshitkumar7525.RapidQuiz.dto.LoginRequest;
import in.harshitkumar7525.RapidQuiz.dto.RegisterRequest;
import in.harshitkumar7525.RapidQuiz.exception.ConflictException;
import in.harshitkumar7525.RapidQuiz.exception.UnauthorizedException;
import in.harshitkumar7525.RapidQuiz.repository.UserRepository;
import in.harshitkumar7525.RapidQuiz.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("email is already registered");
        }

        Users user = new Users();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // created_at is populated by @CreatedDate / @EnableMongoAuditing on save.
        Users saved = userRepository.save(user);

        return jwtUtil.generateToken(saved.getId());
    }

    public String login(LoginRequest request) {
        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("email not found or password does not match"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("email not found or password does not match");
        }

        return jwtUtil.generateToken(user.getId());
    }
}