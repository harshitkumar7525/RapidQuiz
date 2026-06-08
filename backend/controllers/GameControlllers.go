package controllers

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/database"
	"github.com/harshitkumar7525/RapidQuiz/backend/models"
	"github.com/harshitkumar7525/RapidQuiz/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func StartGame(c *gin.Context) {
	var request struct {
		QuizID string `json:"quiz_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(400, gin.H{
			"error": err.Error(),
		})
		return
	}

	userID := utils.GetPrimitiveUserID(c)

	quizObjID, err := primitive.ObjectIDFromHex(request.QuizID)
	if err != nil {
		c.JSON(400, gin.H{
			"error": "invalid quiz id",
		})
		return
	}

	var quiz models.Quiz

	err = database.Collection("quizzes").
		Find(context.Background(), bson.M{
			"_id": quizObjID,
		}).
		One(&quiz)

	if err != nil {
		c.JSON(404, gin.H{
			"error": "quiz not found",
		})
		return
	}

	if quiz.CreatedBy != userID {
		c.JSON(403, gin.H{
			"error": "you are not the creator of this quiz",
		})
		return
	}

	roomCode, err := utils.GenerateRoomCode()
	if err != nil {
		c.JSON(500, gin.H{
			"error": "failed to generate room code",
		})
		return
	}

	game := models.GameSession{
		ID:              primitive.NewObjectID(),
		QuizID:          quiz.ID,
		HostID:          userID,
		RoomCode:        roomCode,
		Status:          models.Waiting,
		CurrentQuestion: 0,
	}

	_, err = database.Collection("game_sessions").
		InsertOne(context.Background(), game)

	if err != nil {
		c.JSON(500, gin.H{
			"error": "failed to create game session",
		})
		return
	}

	c.JSON(201, gin.H{
		"message":         "game session created successfully",
		"room_code":       game.RoomCode,
		"game_id":         game.ID.Hex(),
		"status":          game.Status,
		"currentQuestion": game.CurrentQuestion,
	})
}

func JoinGame(c *gin.Context) {
	var request struct {
		RoomCode string `json:"room_code" binding:"required"`
		Name     string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(400, gin.H{
			"error": err.Error(),
		})
		return
	}

	var game models.GameSession

	err := database.Collection("game_sessions").
		Find(context.Background(), bson.M{
			"room_code": request.RoomCode,
			"status": bson.M{
				"$ne": models.Ended,
			},
		}).
		One(&game)

	if err != nil {
		c.JSON(404, gin.H{
			"error": "room not found",
		})
		return
	}

	var existingParticipant models.Participant

	err = database.Collection("participants").
		Find(context.Background(), bson.M{
			"game_id": game.ID,
			"name":    request.Name,
		}).
		One(&existingParticipant)

	if err == nil {
		c.JSON(409, gin.H{
			"error": "name already taken in this room",
		})
		return
	}

	participant := models.Participant{
		ID:       primitive.NewObjectID(),
		GameID:   game.ID,
		Name:     request.Name,
		JoinedAt: time.Now(),
	}

	_, err = database.Collection("participants").
		InsertOne(context.Background(), participant)

	if err != nil {
		c.JSON(500, gin.H{
			"error": "failed to join game",
		})
		return
	}

	c.JSON(200, gin.H{
		"message":        "joined successfully",
		"participant_id": participant.ID.Hex(),
		"game_id":        game.ID.Hex(),
	})
}
