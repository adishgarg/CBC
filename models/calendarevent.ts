import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: "Danger" | "Success" | "Primary" | "Warning";
  type: "event" | "project" | "task";
  user: mongoose.Types.ObjectId;
  relatedProject?: mongoose.Types.ObjectId;
  relatedTask?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema: Schema<ICalendarEvent> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
      index: true,
    },
    end: {
      type: Date,
      required: true,
      index: true,
    },
    allDay: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      enum: ["Danger", "Success", "Primary", "Warning"],
      default: "Primary",
    },
    type: {
      type: String,
      enum: ["event", "project", "task"],
      default: "event",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    relatedProject: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    relatedTask: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
CalendarEventSchema.index({ user: 1, start: 1 });
CalendarEventSchema.index({ user: 1, type: 1 });

const CalendarEvent =
  mongoose.models.CalendarEvent ||
  mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);

export default CalendarEvent;
