package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Question struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Question      string             `bson:"question" json:"question"`
	Options       []string           `bson:"options" json:"options"`
	CorrectAnswer string             `bson:"correct_answer" json:"correct_option"`
	TimeLimit     int                `bson:"time_limit" json:"time_limit"`
}
