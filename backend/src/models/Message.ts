import { Schema, model, Document, Types } from 'mongoose';

export interface IProductCard {
  productId: Types.ObjectId;
  name: string;
  price: number;
  img_url: string;
  slug: string;
}

export type MessageType = 'text' | 'image' | 'product_card';
export type MessageStatus = 'sent' | 'delivered';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'customer' | 'admin';
  type: MessageType;
  content?: string;
  imageUrl?: string;
  imagePublicId?: string;
  product?: IProductCard;
  status: MessageStatus;
  createdAt: Date;
}

const ProductCardSchema = new Schema<IProductCard>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    img_url: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'product_card'],
      required: true,
    },
    content: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    product: { type: ProductCardSchema },
    status: {
      type: String,
      enum: ['sent', 'delivered'],
      default: 'sent',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

MessageSchema.index({ conversationId: 1, _id: -1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

export default model<IMessage>('Message', MessageSchema, 'messages');
