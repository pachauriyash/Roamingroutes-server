import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
// Create a Mongoose schema and model
const articleSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        },
    types :{
        type: String,
        required: true,
    },
    title: {
      type: String,
      required: true,
    },
    coverphoto: {
        type: String,
        required: true,
    },
    heading1: {
        type: String,
        required: true,
      },
    content1: {
        type: String,
        required: true,
    },
    image1:{
        type: String,
        default: null,
    },
    content2: {
        type: String,
        default: null,
    },
    heading2: {
        type: String,
        default: null,
      },
    content3: {
        type: String,
        default: null,
    },
    tags: {
        type: [String],
        default: [],
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: null,
    },
  });
articleSchema.plugin(passportLocalMongoose);
const Article = mongoose.model('Article', articleSchema);
export default Article;
