import { Schema, model, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  description: string;
  supplier_img?: string;
  created_at: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    supplier_img: {
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

export default model<ISupplier>('Supplier', SupplierSchema);

