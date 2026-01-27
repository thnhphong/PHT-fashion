import { Schema, model, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: Schema.Types.ObjectId;
  productIds: Schema.Types.ObjectId[];
  created_at: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export default model<IFavorite>('Favorite', FavoriteSchema);

