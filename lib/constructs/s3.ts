import { RemovalPolicy } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3Construct extends Construct {
  public fileUploadBucket: Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.fileUploadBucket = new Bucket(this, "FileUploadBucket", {
      bucketName: "file-processing-workflow-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
