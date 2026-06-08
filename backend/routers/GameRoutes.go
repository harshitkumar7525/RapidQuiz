package routers

import (
	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/controllers"
	"github.com/harshitkumar7525/RapidQuiz/backend/middlewares"
)

func RegisterGameRoutes(server *gin.Engine) {
	server.POST("/games/create", middlewares.AuthMiddleware, controllers.StartGame)
}
