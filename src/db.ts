import mongoose from "mongoose";
import { Schema } from "mongoose";
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
    email:String,
    username:String,
    password:String
})

const ContentSchema = new Schema ({
    title:String,
    link:String,
    description:String,
    type:{type:String},
    tags:[{type:mongoose.Types.ObjectId, ref:"Tag"}],
    userId:{type:mongoose.Types.ObjectId,ref:'Users'}
})
const TagSchema = new Schema({
    title:{type:String,required:true}
})
const LinkSchema = new Schema({
    hash:String,
    userId:{type:mongoose.Types.ObjectId,ref:'Users'}
})

export const UserModel = mongoose.model("Users",UserSchema)
export const ContentModel = mongoose.model("Content",ContentSchema)
export const LinkModel = mongoose.model("Links",LinkSchema)
export const TogModel = mongoose.model("Tag",TagSchema)