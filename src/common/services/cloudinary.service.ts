import streamifier from "streamifier";
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";

import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../../env/config";
import { UploadApiResponse } from "cloudinary";

interface UploadFileOptions {
  filePath: string;
  folder: string;
  options?: UploadApiOptions;
}

interface UploadBufferOptions {
  buffer: Buffer;
  folder: string;
  options?: UploadApiOptions;
}

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  uploadFile = async ({
    filePath,
    folder,
    options = {},
  }: UploadFileOptions) => {
    return cloudinary.uploader.upload(filePath, {
      folder,
      ...options,
    });
  };

  uploadVideo = async ({
    filePath,
    folder,
    options = {},
  }: UploadFileOptions) => {
    return cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "video",
      ...options,
    });
  };

  uploadBuffer = async ({
    buffer,
    folder,
    options = {},
  }: UploadBufferOptions): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, ...options },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        },
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  };

  deleteFile = async ({ public_id }: { public_id: string }) => {
    return cloudinary.uploader.destroy(public_id);
  };

  deleteFolderAssets = async ({ folder }: { folder: string }) => {
    return cloudinary.api.delete_resources_by_prefix(folder);
  };

  deleteFolder = async ({ folder }: { folder: string }) => {
    return cloudinary.api.delete_folder(folder);
  };
}

const cloudinaryService = new CloudinaryService();

export default cloudinaryService;
