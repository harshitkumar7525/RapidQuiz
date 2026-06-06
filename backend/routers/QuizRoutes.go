package routers

import (
	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/controllers"
)

func RegisterQuizRoutes(server *gin.Engine) {
	server.POST("/quizzes", controllers.CreateQuiz)
	server.GET("/quizzes/:id", controllers.GetQuizzes)
	server.PATCH("/quizzes/:quizId/:userId", controllers.UpdateQuiz)
	server.DELETE("/quizzes/:quizId/:userId", controllers.DeleteQuiz)
}
