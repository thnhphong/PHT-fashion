export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId?: string;
  supplierId?: string;
  stock?: number;
  img_url?: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes?: { size: string; stock: number }[];
};

export type Category = {
  _id: string;
  name: string;
};

export type Supplier = {
  _id: string;
  name: string;
};