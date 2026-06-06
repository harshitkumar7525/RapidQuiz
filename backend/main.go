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
	server := gin.Default()
	routers.RegisterQuizRoutes(server)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server.Run(":" + port)
}
