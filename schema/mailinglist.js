import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";


const mailingListSchema = new mongoose.Schema({
    username: {
    type: String,
    default: "Yash",
    },
  email: {
    type: String,
    required: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

mailingListSchema.plugin(passportLocalMongoose);
  const MailingList = mongoose.model('MailingList', mailingListSchema);
  export default MailingList
