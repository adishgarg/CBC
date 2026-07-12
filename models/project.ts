import mongoose, { Schema, models, Document, Types } from "mongoose";

export interface IProject extends Document {
    projectId?: number;
    name: string;
    location?: string;
    description?: string;
    projectType: "architecture" | "interior" | "both";
    client?: {
        name: string;
        email?: string;
        phoneNumber?: string;
    };
    clients: Array<{
        name: string;
        email?: string;
        phoneNumber?: string;
    }>;
    teamMembers: Types.ObjectId[];
    status: "active" | "completed" | "on hold";
    timeline: {
        startDate: Date;
        endDate?: Date;
    };
    tasks: Types.ObjectId[];
    files: Array<{
        name: string;
        url: string;
        size: number;
        type: string;
        uploadedAt: Date;
        uploadedBy: Types.ObjectId;
        driveFileId: string;
    }>;
    createdBy: Types.ObjectId;
    isVisible: boolean;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
    meetingMins?: Types.ObjectId[]; 
    architectureFolderId?: string;
    interiorFolderId?: string;
    viewsFolderId?: string;
    spreadsheetId?: string;
    sheetName?: string;
    lastActivityAt?: Date;
    lastActivityType?: "file_uploaded" | "project_updated";
    lastActivityMessage?: string;
    lastActivityFileName?: string;
    lastActivityBy?: Types.ObjectId;
    workflow?: {
        currentPhaseId?: number;
        notOptedPhases?: number[];
        updatedAt?: Date;
    };
}

const ProjectSchema = new Schema(
    {
        projectId: {
            type: Number,
            required: false,
            unique: true,
            sparse: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
        },
        projectType: {
            type: String,
            enum: ["architecture", "interior", "both"],
            default: "both",
            required: true,
        },
        client: {
            type: new Schema(
                {
                    name: { type: String, required: true },
                    email: { type: String },
                    phoneNumber: { type: String },
                },
                { _id: false }
            ),
            required: false,
        },
        clients: [{
            name: { type: String, required: true },
            email: { type: String },
            phoneNumber: { type: String },
        }],
        teamMembers: [{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }],
        status: {
            type: String,
            enum: ["active", "completed", "on hold"],
            default: "active",
        },
        timeline: {
            startDate: {
                type: Date,
                required: true,
            },
            endDate: {
                type: Date,
            },
        },
        tasks: [
            {
                type: Schema.Types.ObjectId,
                ref: "Task",
            },
        ],
        files: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                size: { type: Number, required: true },
                type: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now },
                uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
                driveFileId: { type: String, required: true },
            },
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isVisible: {
            type: Boolean,
            default: true,
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        workflow: {
            type: new Schema(
                {
                    currentPhaseId: { type: Number, default: 1, min: 1 },
                    notOptedPhases: [{ type: Number }],
                    updatedAt: { type: Date, default: Date.now },
                },
                { _id: false }
            ),
            default: () => ({ currentPhaseId: 1, notOptedPhases: [], updatedAt: new Date() }),
        },
        meetingMins: [
            {
                type: Schema.Types.ObjectId,
                ref: "MeetingMin",
            },
        ],
        architectureFolderId: {
            type: String,
            required: false,
            index: true,
        },
        interiorFolderId: {
            type: String,
            required: false,
            index: true,
        },
        viewsFolderId: {
            type: String,
            required: false,
            index: true,
        },
        spreadsheetId: {
            type: String,
            required: false,
            index: true,
        },
        sheetName: {
            type: String,
            required: false,
        },
        lastActivityAt: {
            type: Date,
            required: false,
            index: true,
        },
        lastActivityType: {
            type: String,
            enum: ["file_uploaded", "project_updated"],
            required: false,
        },
        lastActivityMessage: {
            type: String,
            required: false,
            trim: true,
        },
        lastActivityFileName: {
            type: String,
            required: false,
            trim: true,
        },
        lastActivityBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
    },
    { timestamps: true }
);

export default models.Project || mongoose.model("Project", ProjectSchema);
