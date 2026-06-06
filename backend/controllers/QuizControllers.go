package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/database"
	"github.com/harshitkumar7525/RapidQuiz/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateQuiz(c *gin.Context) {
	var quiz models.Quiz

	if err := c.ShouldBindJSON(&quiz); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if quiz.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "title is required",
		})
		return
	}

	if len(quiz.Questions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "quiz must contain at least one question",
		})
		return
	}

	quiz.ID = primitive.NewObjectID()
	quiz.CreatedAt = time.Now()
	quiz.UpdatedAt = time.Now()

	_, err := database.Collection("quizzes").
		InsertOne(context.Background(), quiz)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create quiz",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "quiz created successfully",
		"quiz":    quiz,
	})
}

func GetQuizzes(c *gin.Context) {
	userID := c.Param("id")

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid user ID",
		})
		return
	}

	var quizzes []models.Quiz

	err = database.Collection("quizzes").
		Find(context.Background(), bson.M{
			"created_by": objID,
		}).
		All(&quizzes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, quizzes)
}
