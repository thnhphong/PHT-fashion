"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Upload function
const uploadImage = async (filePath, options) => {
    return cloudinary_1.default.v2.uploader.upload(filePath, {
        folder: 'pht_products_img',
        ...options,
    });
};
exports.uploadImage = uploadImage;
const uploadVideo = async (filePath, options) => {
    return cloudinary_1.default.v2.uploader.upload(filePath, {
        resource_type: 'video',
        folder: 'pht_chat_videos',
        ...options,
    });
};
exports.uploadVideo = uploadVideo;
