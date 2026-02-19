// frontend/src/types/types.ts

export interface Category {
  _id: string;
  name: string;
  created_at: string;
}

export interface Supplier {
  _id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ProductSize {
  size: string;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: Category | string;
  supplierId: Supplier | string;
  stock: number;
  img_url: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes: ProductSize[];
  created_at: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}