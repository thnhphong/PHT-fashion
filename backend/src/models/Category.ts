import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  created_at: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

export default model<ICategory>('Category', CategorySchema);

