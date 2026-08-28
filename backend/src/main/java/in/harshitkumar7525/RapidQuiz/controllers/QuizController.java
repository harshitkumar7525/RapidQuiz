package in.harshitkumar7525.RapidQuiz.controllers;

import in.harshitkumar7525.RapidQuiz.document.Quizzes;
import in.harshitkumar7525.RapidQuiz.dto.CreateQuizRequest;
import in.harshitkumar7525.RapidQuiz.dto.QuizResponse;
import in.harshitkumar7525.RapidQuiz.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping
    public ResponseEntity<QuizResponse> create(@RequestAttribute("userId") String userId,
                                               @Valid @RequestBody CreateQuizRequest request) {
        Quizzes created = quizService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(QuizResponse.from(created));
    }

    @GetMapping
    public ResponseEntity<List<QuizResponse>> list(@RequestAttribute("userId") String userId) {
        List<QuizResponse> quizzes = quizService.findByCreatedBy(userId).stream()
                .map(QuizResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponse> getById(@PathVariable String quizId) {
        return ResponseEntity.ok(QuizResponse.from(quizService.findById(quizId)));
    }

    @PatchMapping("/{quizId}")
    public ResponseEntity<QuizResponse> update(@PathVariable String quizId,
                                               @RequestAttribute("userId") String userId,
                                               @RequestBody CreateQuizRequest request) {
        Quizzes updated = quizService.update(quizId, userId, request);
        return ResponseEntity.ok(QuizResponse.from(updated));
    }

    @DeleteMapping("/{quizId}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String quizId,
                                                      @RequestAttribute("userId") String userId) {
        quizService.delete(quizId, userId);
        return ResponseEntity.ok(Map.of("message", "quiz deleted successfully"));
    }
}