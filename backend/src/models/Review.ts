import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  userId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  rating: number;
  content: string;
  created_at: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export default model<IReview>('Review', ReviewSchema);

