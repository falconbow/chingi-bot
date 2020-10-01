import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

const uri = `mongodb+srv://chingi:${process.env.DATABASE_PASSWORD}@chingicluster.a0pe2.mongodb.net/${process.env.DATABASE_NAME}retryWrites=true&w=majority`;
try {
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch (error) {
}

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  userCounter: Number,
});

userSchema.statics.addNew = async function ({
  firstName,
  username,
  userCounter,
}) {
  await this.create({ firstName, username, userCounter });
};

userSchema.statics.getUsers = async function () {
  return await this.find();
}

userSchema.statics.update = async function (query, update) {
  return this.findOneAndUpdate(query, update)
}
userSchema.statics.findUser = async function (data) {
  return this.findOne(data, (err, user) => {
    if (!err) {
      return user
    } else {
      console.log(err);
    }
  });
};

const UserModel = mongoose.model('User', userSchema)

export default userSchema