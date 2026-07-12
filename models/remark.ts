import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRemark extends Document {
  comment: string;
  project: Types.ObjectId;
  fileName: string;
  createdBy?: Types.ObjectId; // Optional for client comments
  clientName?: string; // Name provided by unauthenticated clients
  createdAt: Date;
  updatedAt: Date;
}

const RemarkSchema: Schema<IRemark> = new Schema(
  {
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for client comments
    },
    clientName: {
      type: String,
      trim: true,
      // Name used when comment is from unauthenticated client
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries by project and file
RemarkSchema.index({ project: 1, fileName: 1 });

export default mongoose.models.Remark || mongoose.model("Remark", RemarkSchema);
