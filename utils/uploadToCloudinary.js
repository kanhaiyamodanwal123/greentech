const cloudinary = require('../config/cloudinary');

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) {
          console.error("Cloudinary Upload Error:", err);
          return reject(err);
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

module.exports = uploadToCloudinary;
