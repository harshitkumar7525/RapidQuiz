package in.harshitkumar7525.RapidQuiz.service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import in.harshitkumar7525.RapidQuiz.document.GameSession;
import in.harshitkumar7525.RapidQuiz.document.Participant;
import in.harshitkumar7525.RapidQuiz.document.Question;
import in.harshitkumar7525.RapidQuiz.document.Quizzes;
import in.harshitkumar7525.RapidQuiz.dto.CreateGameRequest;
import in.harshitkumar7525.RapidQuiz.dto.GameDetailsResponse;
import in.harshitkumar7525.RapidQuiz.dto.JoinGameRequest;
import in.harshitkumar7525.RapidQuiz.dto.ParticipantSummary;
import in.harshitkumar7525.RapidQuiz.dto.QuestionBroadcastResponse;
import in.harshitkumar7525.RapidQuiz.exception.ConflictException;
import in.harshitkumar7525.RapidQuiz.exception.ForbiddenException;
import in.harshitkumar7525.RapidQuiz.exception.QuizValidationException;
import in.harshitkumar7525.RapidQuiz.exception.ResourceNotFoundException;
import in.harshitkumar7525.RapidQuiz.repository.GameSessionRepository;
import in.harshitkumar7525.RapidQuiz.repository.ParticipantRepository;
import in.harshitkumar7525.RapidQuiz.repository.QuizRepository;
import in.harshitkumar7525.RapidQuiz.websocket.GameBroadcastService;
import in.harshitkumar7525.RapidQuiz.websocket.WSMessage;

@Service
public class GameService {

    private static final Map<GameSession.GameStatus, Set<GameSession.GameStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(GameSession.GameStatus.class);
    static {
        ALLOWED_TRANSITIONS.put(GameSession.GameStatus.WAITING, EnumSet.of(GameSession.GameStatus.RUNNING));
        ALLOWED_TRANSITIONS.put(GameSession.GameStatus.RUNNING, EnumSet.of(GameSession.GameStatus.PAUSED, GameSession.GameStatus.ENDED));
        ALLOWED_TRANSITIONS.put(GameSession.GameStatus.PAUSED, EnumSet.of(GameSession.GameStatus.RUNNING, GameSession.GameStatus.ENDED));
        ALLOWED_TRANSITIONS.put(GameSession.GameStatus.ENDED, EnumSet.noneOf(GameSession.GameStatus.class));
    }

    private final GameSessionRepository gameSessionRepository;
    private final ParticipantRepository participantRepository;
    private final QuizRepository quizRepository;
    private final RoomCodeGenerator roomCodeGenerator;
    private final GameBroadcastService gameBroadcastService;

    public GameService(GameSessionRepository gameSessionRepository,
                       ParticipantRepository participantRepository,
                       QuizRepository quizRepository,
                       RoomCodeGenerator roomCodeGenerator,
                       GameBroadcastService gameBroadcastService) {
        this.gameSessionRepository = gameSessionRepository;
        this.participantRepository = participantRepository;
        this.quizRepository = quizRepository;
        this.roomCodeGenerator = roomCodeGenerator;
        this.gameBroadcastService = gameBroadcastService;
    }

        public GameSession create(String hostId, CreateGameRequest request) {
        Quizzes quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz does not exist"));

        if (!quiz.getCreatedBy().equals(hostId)) {
            throw new ForbiddenException("Only the quiz creator can start a game session for it");
        }

        GameSession game = new GameSession();
        game.setQuizId(quiz.getId());
        game.setHostId(hostId);
        game.setRoomCode(generateUniqueRoomCode());
        game.setStatus(GameSession.GameStatus.WAITING);
        game.setCurrentQuestion(0);
        return gameSessionRepository.save(game);
    }

    public Participant join(JoinGameRequest request) {
        GameSession game = gameSessionRepository.findByRoomCode(request.getRoomCode())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (game.getStatus() == GameSession.GameStatus.ENDED) {
            throw new ResourceNotFoundException("Room not found or game has ended");
        }

        participantRepository.findByGameIdAndName(game.getId(), request.getName())
                .ifPresent(p -> {
                    throw new ConflictException("Display name already taken in this room");
                });

        Participant participant = new Participant();
        participant.setGameId(game.getId());
        participant.setName(request.getName());
        participant.setJoinedAt(LocalDateTime.now());
        return participantRepository.save(participant);
    }

    public GameSession updateStatus(String gameId, String hostId, GameSession.GameStatus targetStatus) {
        GameSession game = gameSessionRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        if (!game.getHostId().equals(hostId)) {
            throw new ForbiddenException("Only the host can change the game status");
        }

        Set<GameSession.GameStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(game.getStatus(), EnumSet.noneOf(GameSession.GameStatus.class));
        if (!allowed.contains(targetStatus)) {
            throw new QuizValidationException(
                    "Cannot transition game from " + game.getStatus() + " to " + targetStatus);
        }

        game.setStatus(targetStatus);
        if (targetStatus == GameSession.GameStatus.RUNNING) {
            if (game.getStartedAt() == null) {
                game.setStartedAt(LocalDateTime.now());
            }
            game.setQuestionStartedAt(LocalDateTime.now());
        }
        if (targetStatus == GameSession.GameStatus.ENDED) {
            game.setEndedAt(LocalDateTime.now());
        }

        GameSession saved = gameSessionRepository.save(game);

        gameBroadcastService.broadcast(saved.getRoomCode(), new WSMessage("game_status", Map.of(
                "gameId", saved.getId(),
                "status", saved.getStatus(),
                "currentQuestion", saved.getCurrentQuestion()
        )));

        return saved;
    }

    public GameSession advanceQuestion(String gameId, String hostId, Integer explicitIndex) {
        GameSession game = gameSessionRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        if (!game.getHostId().equals(hostId)) {
            throw new ForbiddenException("Only the host can advance the question");
        }
        if (game.getStatus() != GameSession.GameStatus.RUNNING) {
            throw new QuizValidationException("Game must be running to advance the question");
        }

        Quizzes quiz = quizRepository.findById(game.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        int nextIndex = explicitIndex != null ? explicitIndex : game.getCurrentQuestion() + 1;
        if (nextIndex < 0 || nextIndex >= quiz.getQuestions().size()) {
            throw new QuizValidationException("No more questions left in this quiz");
        }

        game.setCurrentQuestion(nextIndex);
        game.setQuestionStartedAt(LocalDateTime.now());
        GameSession saved = gameSessionRepository.save(game);

        Question nextQuestion = quiz.getQuestions().get(nextIndex);
        gameBroadcastService.broadcast(saved.getRoomCode(), new WSMessage(
                "next_question",
                QuestionBroadcastResponse.from(nextIndex, nextQuestion)
        ));

        return saved;
    }

    public GameDetailsResponse getDetails(String gameId) {
        GameSession game = gameSessionRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        Quizzes quiz = quizRepository.findById(game.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        List<ParticipantSummary> participants = participantRepository.findByGameId(gameId).stream()
                .map(ParticipantSummary::from)
                .collect(Collectors.toList());

        QuestionBroadcastResponse currentQuestionData = null;
        boolean questionActive = game.getStatus() == GameSession.GameStatus.RUNNING
                || game.getStatus() == GameSession.GameStatus.PAUSED;
        if (questionActive) {
            int index = game.getCurrentQuestion();
            if (index >= 0 && index < quiz.getQuestions().size()) {
                currentQuestionData = QuestionBroadcastResponse.from(index, quiz.getQuestions().get(index));
            }
        }

        return new GameDetailsResponse(
                game.getId(),
                game.getQuizId(),
                game.getHostId(),
                game.getRoomCode(),
                game.getStatus(),
                game.getCurrentQuestion(),
                quiz.getQuestions().size(),
                currentQuestionData,
                participants,
                game.getStartedAt(),
                game.getEndedAt()
        );
    }

    private String generateUniqueRoomCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = roomCodeGenerator.generate();
            if (!gameSessionRepository.existsByRoomCode(code)) {
                return code;
            }
        }
        throw new QuizValidationException("Failed to generate a unique room code, please retry");
    }
}