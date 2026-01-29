import cloudinary, { UploadApiOptions } from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function
export const uploadImage = async (filePath: string, options?: UploadApiOptions) => {
  return cloudinary.v2.uploader.upload(filePath, {
    folder: 'pht_products_img',
    ...options,
  });
};