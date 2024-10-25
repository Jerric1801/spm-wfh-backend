import config from '../../config/default'; 

const awsConfig = {
  accessKeyId: config.awsAccessKey,
  secretAccessKey: config.awsSecretKey,
  region: config.awsRegion,
  bucketName: config.awsBucketName, 
};

export default awsConfig;