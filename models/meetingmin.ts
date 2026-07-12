import mongoose, { Schema, models, Document, Types } from "mongoose";

export interface IMeetingMin extends Document {
    title: string;
    date: Date;
    time: string;
    minutes: string;
    status: "draft" | "published";
    createdBy: Types.ObjectId;
    project?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MeetingMinSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        minutes: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
        },
    },
    { timestamps: true }
);

const MeetingMin = models.MeetingMin || mongoose.model<IMeetingMin>("MeetingMin", MeetingMinSchema);

export default MeetingMin;