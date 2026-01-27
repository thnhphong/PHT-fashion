import { Schema, model, Document } from 'mongoose';

export type UserRole = 'customer' | 'admin';

export interface IUser extends Document {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  avatar?: string;
  created_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
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

export default model<IUser>('User', UserSchema);