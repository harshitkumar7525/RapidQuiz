package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Option string

type Question struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Question      string             `bson:"question" json:"question"`
	Options       []Option           `bson:"options" json:"options"`
	CorrectAnswer int                `bson:"correct_answer" json:"-"`
	TimeLimit     int                `bson:"time_limit" json:"time_limit"`
}
