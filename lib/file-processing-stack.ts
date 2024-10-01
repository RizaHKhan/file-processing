import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { StackSetOrganizationsAutoDeployment } from "aws-cdk-lib/aws-codepipeline-actions";
import { AttributeType, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { LayerVersion, AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FileProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fileUploadBucket = new Bucket(this, "FileUploadBucket", {
      bucketName: "file-processing-workflow-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    cosnt notificationTopic = new Topic(this, "NotificationTopic", {
      topicName: "file-processing-workflow-topic",
    });
  
    const table = new TableV2(this, "FileProcessingTable", {
      partitionKey: { name: "name", type: AttributeType.STRING },
      tableName: "file_processing_workflow_table",
      removalPolicy: RemovalPolicy.DESTROY,
    });
  
    const layer = new LayerVersion(this, "FileProcessingLayer", {
      code: new AssetCode("lib/lambda/layers"),
      compatibleRuntimes: [Runtime.NODEJS_20_X],
      description: "A layer for file processing functions.",
    });
  
    const fileValidationFunction = new NodejsFunction(this, "FileValidationFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: "lib/lambda/02-file-validation.ts",
    });

    fileUploadBucket.grantRead(fileValidationFunction);

    const dataExtractionFunction = new NodejsFunction(this, "DataExtractionFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: "lib/lambda/03-data-extraction.ts",
    });

    
  }
}
