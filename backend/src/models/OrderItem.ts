import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  productSize: string;
  unit_price: number; // snapshot of price at time of purchase
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
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
      uppercase: true,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    versionKey: false,
  }
);

export default model<IOrderItem>('OrderItem', OrderItemSchema);