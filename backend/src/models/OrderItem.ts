import { Schema, model, Document } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  quantity: number;
  productSize: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    productSize: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
  }
);

export default model<IOrderItem>('OrderItem', OrderItemSchema);

