

import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: "todo" | "in-progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  progress: number;
  dueDate?: Date;
  attachments?: {
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
  }[];
  isArchived: boolean;
  driveFolderId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "completed"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    dueDate: {
      type: Date,
    },
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    driveFolderId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);