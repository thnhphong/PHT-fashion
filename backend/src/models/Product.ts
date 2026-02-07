import { Schema, model, Document, Types } from 'mongoose';

export interface IProductSize {
  size: string;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  categoryId: Types.ObjectId;
  supplierId: Types.ObjectId;
  stock: number;
  img_url: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes: IProductSize[];
  created_at: Date;
}

const ProductSizeSchema = new Schema<IProductSize>(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const defaultSizes: IProductSize[] = ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
  size,
  stock: 20,
}));

const ProductSchema = new Schema<IProduct>(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    img_url: {
      type: String,
      required: true,
    },
    thumbnail_img_1: {
      type: String,
    },
    thumbnail_img_2: {
      type: String,
    },
    thumbnail_img_3: {
      type: String,
    },
    thumbnail_img_4: {
      type: String,
    },
    sizes: {
      type: [ProductSizeSchema],
      default: defaultSizes,
      validate: {
        validator: (sizes: IProductSize[]) => sizes.length > 0,
        message: 'Product must report at least one size',
      },
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

ProductSchema.index({ name: 'text', description: 'text' });

export default model<IProduct>('Product', ProductSchema);

