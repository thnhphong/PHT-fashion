import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
    token: string;
    userId: Types.ObjectId;
    expiresAt: Date;
    createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        token: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index: MongoDB auto-deletes when expiresAt is reached
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    }
);

export default model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
