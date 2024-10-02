import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  S3Construct,
  SnsConstruct,
  DynamoDbConstruct,
  LambdaConstruct,
  StepFunctionsConstruct,
} from "./constructs";

export class FileProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3 = new S3Construct(this, "BucketsConstruct");
    const sns = new SnsConstruct(this, "SnsConstruct");
    const dynamodb = new DynamoDbConstruct(this, "DynamoDbConstruct");
    const lambda = new LambdaConstruct(this, "LambdaConstruct", {
      db: dynamodb,
      sns,
    });
    const stepfunctions = new StepFunctionsConstruct(
      this,
      "StepFunctionsConstruct",
      { lambda }
    );

    s3.fileUploadBucket.grantRead(lambda.fileValidationFunction);
    s3.fileUploadBucket.grantRead(lambda.dataExtractionFunction);

    lambda.setupS3EventHandler({ stepfunctions, s3 });
    stepfunctions.stateMachine.grantStartExecution(lambda.s3EventHandler);
  }
}
