package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/database"
	"github.com/harshitkumar7525/RapidQuiz/backend/models"
	"github.com/harshitkumar7525/RapidQuiz/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func RegisterHandler(context *gin.Context) {
	var userData struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := context.ShouldBindJSON(&userData); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if userData.Name == "" || userData.Email == "" || userData.Password == "" {
		context.JSON(http.StatusBadRequest, gin.H{
			"error": "all fields are required",
		})
		return
	}

	var existingUser models.User

	err := database.Collection("users").
		Find(context, bson.M{
			"email": userData.Email,
		}).
		One(&existingUser)

	if err == nil {
		context.JSON(http.StatusConflict, gin.H{
			"error": "email already registered",
		})
		return
	}

	hashedPassword := utils.HashPassword(userData.Password)

	user := models.User{
		ID:        primitive.NewObjectID(),
		Name:      userData.Name,
		Email:     userData.Email,
		Password:  hashedPassword,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = database.Collection("users").
		InsertOne(context, user)

	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to register user",
		})
		return
	}

	jwtTToken, err := utils.GenerateJWT(user.ID.Hex())

	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	context.JSON(http.StatusCreated, gin.H{
		"message": "user registered successfully",
		"token":   jwtTToken,
	})
}

func LoginHandler(context *gin.Context) {
	var loginData struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := context.ShouldBindJSON(&loginData); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if loginData.Email == "" || loginData.Password == "" {
		context.JSON(http.StatusBadRequest, gin.H{
			"error": "email and password are required",
		})
		return
	}

	var user models.User

	err := database.Collection("users").
		Find(context, bson.M{
			"email": loginData.Email,
		}).
		One(&user)

	if err != nil {
		context.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid email or password",
		})
		return
	}

	if !utils.CheckPasswordHash(loginData.Password, user.Password) {
		context.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid email or password",
		})
		return
	}

	jwtTToken, err := utils.GenerateJWT(user.ID.Hex())

	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"message": "login successful",
		"token":   jwtTToken,
	})
}
