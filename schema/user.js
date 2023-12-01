import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

// Create a Mongoose schema and model
const userSchema = new mongoose.Schema({
    Name: {
      type: String,
      required: true,
    },
    username: String,
    password: String,
    profilepic: {type: String,default: null},
    linkedinurl: {type: String,default: null},
    twitterurl: {type: String,default: null},
    instaurl: {type: String,default: null},
    articles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Article'}],
  },
  {timestamps:true}
  );

  userSchema.plugin(passportLocalMongoose);
  const User = mongoose.model('User', userSchema);
  export default User;