const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadImageToS3(base64Image, folder = 'projects') {
  if (!base64Image || !base64Image.startsWith('data:image')) {
    throw new Error('Invalid image data');
  }

  const base64Data = Buffer.from(
    base64Image.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  // png, jpeg, etc.
  const type = base64Image.split(';')[0].split('/')[1] || 'png';

  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${type}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: base64Data,
    ContentEncoding: 'base64',
    ContentType: `image/${type}`,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    // URL pública del objeto
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return url;
  } catch (err) {
    console.error('Error uploading to S3:', err);
    throw err;
  }
}

module.exports = { uploadImageToS3 };
