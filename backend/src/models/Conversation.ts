import { Schema, model, Document, Types } from 'mongoose';

export interface ILastMessage {
  content: string;
  sentAt: Date;
  senderId: Types.ObjectId;
}

export interface IConversation extends Document {
  customerId: Types.ObjectId;
  lastMessage: ILastMessage;
  customerUnread: number;
  adminUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

const LastMessageSchema = new Schema<ILastMessage>(
  {
    content: { type: String, required: true },
    sentAt: { type: Date, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: LastMessageSchema,
      required: true,
    },
    customerUnread: { type: Number, default: 0 },
    adminUnread: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ConversationSchema.index({ customerId: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ customerId: 1, updatedAt: -1 });

export default model<IConversation>('Conversation', ConversationSchema, 'conversations');
