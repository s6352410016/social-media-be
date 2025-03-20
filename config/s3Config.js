const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3Config = () => {
  const s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return s3;
};

module.exports = s3Config;
