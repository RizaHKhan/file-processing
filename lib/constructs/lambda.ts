import { LayerVersion, AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import {
  DynamoDbConstruct,
  SnsConstruct,
  StepFunctionsConstruct,
  S3Construct,
} from "../constructs";
import { EventType } from "aws-cdk-lib/aws-s3";
import { Duration } from "aws-cdk-lib";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";

interface LambdaConstructProps {
  db: DynamoDbConstruct;
  sns: SnsConstruct;
}

export class LambdaConstruct extends Construct {
  public layer: LayerVersion;
  public s3EventHandler: NodejsFunction;
  public fileValidationFunction: NodejsFunction;
  public dataExtractionFunction: NodejsFunction;
  public dataTransformationFunction: NodejsFunction;
  public dynamoDbStoreFunction: NodejsFunction;
  public notficationFunction: NodejsFunction;

  constructor(scope: Construct, id: string, { db, sns }: LambdaConstructProps) {
    super(scope, id);

    this.layer = new LayerVersion(this, "FileProcessingLayer", {
      code: new AssetCode("lib/lambda/layers"),
      compatibleRuntimes: [Runtime.NODEJS_20_X],
      description: "A layer for file processing functions.",
    });

    this.fileValidationFunction = new NodejsFunction(
      this,
      "FileValidationFunction",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: "lib/lambda/02-file-validation.ts",
      }
    );

    this.dataExtractionFunction = new NodejsFunction(
      this,
      "DataExtractionFunction",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: "lib/lambda/03-data-extraction.ts",
        layers: [this.layer],
        bundling: {
          externalModules: ["csv-parser", "@aws-sdk/client-s3"],
        },
      }
    );

    this.dataTransformationFunction = new NodejsFunction(
      this,
      "DataTransformationFunction",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: "lib/lambda/04-data-transform.ts",
      }
    );

    this.dynamoDbStoreFunction = new NodejsFunction(
      this,
      "DynamoDbStoreFunction",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: "lib/lambda/05-dynamodb-store.ts",
        timeout: Duration.seconds(30),
        environment: {
          TABLE_NAME: db.table.tableName,
        },
      }
    );

    db.table.grantReadWriteData(this.dynamoDbStoreFunction);

    this.notficationFunction = new NodejsFunction(
      this,
      "NotificationFunction",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: "lib/lambda/06-email-notification.ts",
      }
    );

    sns.topic.grantPublish(this.notficationFunction);
  }

  setupS3EventHandler({
    stepfunctions,
    s3,
  }: {
    stepfunctions: StepFunctionsConstruct;
    s3: S3Construct;
  }) {
    this.s3EventHandler = new NodejsFunction(this, "S3EventHandler", {
      runtime: Runtime.NODEJS_20_X,
      entry: "lib/lambda/01-s3-event.ts",
      environment: {
        STATE_MACHINE_ARN: stepfunctions.stateMachine.stateMachineArn,
      },
      bundling: {
        externalModules: ["@aws-sdk/client-sfn"],
      },
    });

    s3.fileUploadBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(this.s3EventHandler)
    );
  }
}
