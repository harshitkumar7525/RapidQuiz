package in.harshitkumar7525.RapidQuiz.controllers;

import in.harshitkumar7525.RapidQuiz.document.Answer;
import in.harshitkumar7525.RapidQuiz.dto.SubmitAnswerRequest;
import in.harshitkumar7525.RapidQuiz.dto.SubmitAnswerResponse;
import in.harshitkumar7525.RapidQuiz.service.AnswerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/games")
public class AnswerController {

    private final AnswerService answerService;

    public AnswerController(AnswerService answerService) {
        this.answerService = answerService;
    }

    @PostMapping("/{gameId}/answer")
    public ResponseEntity<SubmitAnswerResponse> submit(@PathVariable String gameId,
                                                       @Valid @RequestBody SubmitAnswerRequest request) {
        Answer answer = answerService.submit(gameId, request);
        return ResponseEntity.ok(SubmitAnswerResponse.from(answer));
    }
}