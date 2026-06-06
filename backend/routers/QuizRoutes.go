package routers

import (
	"github.com/gin-gonic/gin"
	"github.com/harshitkumar7525/RapidQuiz/backend/controllers"
)

func RegisterQuizRoutes(server *gin.Engine) {
	quizGrp := server.Group("/quizzes")
	quizGrp.POST("/", controllers.CreateQuiz)
	quizGrp.GET("/:id", controllers.GetQuizzes)
	quizGrp.PATCH("/:quizId/:userId", controllers.UpdateQuiz)
	quizGrp.DELETE("/:quizId/:userId", controllers.DeleteQuiz)
}
