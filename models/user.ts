import mongoose, { Schema, models, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  phoneNumber?: string;
  role?: "admin" | "user";
  notificationLastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
    },
    notificationLastSeenAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

export default (models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);