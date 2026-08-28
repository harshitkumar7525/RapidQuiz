package in.harshitkumar7525.RapidQuiz.controllers;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import in.harshitkumar7525.RapidQuiz.document.Participant;
import in.harshitkumar7525.RapidQuiz.dto.AdvanceQuestionRequest;
import in.harshitkumar7525.RapidQuiz.dto.CreateGameRequest;
import in.harshitkumar7525.RapidQuiz.dto.CreateGameResponse;
import in.harshitkumar7525.RapidQuiz.dto.GameDetailsResponse;
import in.harshitkumar7525.RapidQuiz.dto.GameStatusResponse;
import in.harshitkumar7525.RapidQuiz.dto.JoinGameRequest;
import in.harshitkumar7525.RapidQuiz.dto.JoinGameResponse;
import in.harshitkumar7525.RapidQuiz.dto.UpdateGameStatusRequest;
import in.harshitkumar7525.RapidQuiz.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<GameDetailsResponse> getDetails(@PathVariable String gameId) {
        return ResponseEntity.ok(gameService.getDetails(gameId));
    }

    @PostMapping("/create")
    public ResponseEntity<CreateGameResponse> create(@RequestAttribute("userId") String userId,
                                                      @Valid @RequestBody CreateGameRequest request) {
        GameSession game = gameService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(CreateGameResponse.from(game));
    }

    @PostMapping("/join")
    public ResponseEntity<JoinGameResponse> join(@Valid @RequestBody JoinGameRequest request) {
        Participant participant = gameService.join(request);
        return ResponseEntity.ok(JoinGameResponse.from(participant));
    }

    @PatchMapping("/{gameId}/status")
    public ResponseEntity<GameStatusResponse> updateStatus(@PathVariable String gameId,
                                                           @RequestAttribute("userId") String userId,
                                                           @Valid @RequestBody UpdateGameStatusRequest request) {
        GameSession game = gameService.updateStatus(gameId, userId, request.getStatus());
        return ResponseEntity.ok(GameStatusResponse.from(game));
    }

    @PatchMapping("/{gameId}/next-question")
    public ResponseEntity<GameStatusResponse> nextQuestion(@PathVariable String gameId,
                                                           @RequestAttribute("userId") String userId,
                                                           @Valid @RequestBody AdvanceQuestionRequest request) {
        GameSession game = gameService.advanceQuestion(gameId, userId, request.getIndex());
        return ResponseEntity.ok(GameStatusResponse.from(game));
    }
}