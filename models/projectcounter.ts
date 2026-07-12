import mongoose, { Schema, models, Document } from "mongoose";

export interface IProjectCounter extends Document {
  nextNumber: number;
  updatedAt: Date;
}

const ProjectCounterSchema = new Schema(
  {
    nextNumber: {
      type: Number,
      default: 164,
      required: true,
    },
  },
  { timestamps: true }
);

export default models.ProjectCounter || mongoose.model<IProjectCounter>("ProjectCounter", ProjectCounterSchema);
