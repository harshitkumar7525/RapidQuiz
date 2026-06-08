package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/database"
	"github.com/harshitkumar7525/RapidQuiz/backend/routers"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}
	database.Connect()
	defer database.Disconnect()
	database.ConnectRedis()
	server := gin.Default()
	routers.RegisterAuthRoutes(server)
	routers.RegisterQuizRoutes(server)
	routers.RegisterGameRoutes(server)
	routers.RegisterLeaderboardRoutes(server)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server.Run(":" + port)
}
