package models

type Question struct {
	Question      string   `bson:"question" json:"question"`
	Options       []string `bson:"options" json:"options"`
	CorrectAnswer string   `bson:"correct_answer" json:"correct_answer"`
	TimeLimit     int      `bson:"time_limit" json:"time_limit"`
}
