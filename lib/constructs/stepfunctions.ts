import { Construct } from "constructs";
import { LambdaConstruct } from "../constructs";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import {
  DefinitionBody,
  Fail,
  StateMachine,
} from "aws-cdk-lib/aws-stepfunctions";

interface StepFunctionsConstructProps {
  lambda: LambdaConstruct;
}

export class StepFunctionsConstruct extends Construct {
  public fileValidationTask: LambdaInvoke;
  public dataExtractionTask: LambdaInvoke;
  public dataTransformationTask: LambdaInvoke;
  public dynamodbStoreTask: LambdaInvoke;
  public notificationTask: LambdaInvoke;
  public failState: Fail;
  public stateMachine: StateMachine;

  constructor(
    scope: Construct,
    id: string,
    { lambda }: StepFunctionsConstructProps
  ) {
    super(scope, id);

    this.fileValidationTask = new LambdaInvoke(this, "FileValidationTask", {
      lambdaFunction: lambda.fileValidationFunction,
      outputPath: "$.Payload",
    });

    this.dataExtractionTask = new LambdaInvoke(this, "DataExtractionTask", {
      lambdaFunction: lambda.dataExtractionFunction,
      outputPath: "$.Payload",
    });

    this.dataTransformationTask = new LambdaInvoke(
      this,
      "DataTransformationTask",
      {
        lambdaFunction: lambda.dataTransformationFunction,
        outputPath: "$.Payload",
      }
    );

    this.dynamodbStoreTask = new LambdaInvoke(this, "DynamodbStoreTask", {
      lambdaFunction: lambda.dynamoDbStoreFunction,
      outputPath: "$.Payload",
    });

    this.notificationTask = new LambdaInvoke(this, "NotificationTask", {
      lambdaFunction: lambda.notficationFunction,
      outputPath: "$.Payload",
    });

    this.failState = new Fail(this, "FileProcessingFailed", {
      cause: "File processing failed",
      error: "StateMachineErrors",
    });

    this.stateMachine = new StateMachine(this, "FileProcessingStateMachine", {
      definitionBody: DefinitionBody.fromChainable(
        this.fileValidationTask
          .addCatch(this.failState, {
            errors: ["States.ALL"],
            resultPath: "$.errorInfo",
          })
          .next(
            this.dataExtractionTask.addCatch(this.failState, {
              errors: ["States.ALL"],
              resultPath: "$.errorInfo",
            })
          )
          .next(
            this.dataTransformationTask.addCatch(this.failState, {
              errors: ["States.ALL"],
              resultPath: "$.errorInfo",
            })
          )
          .next(
            this.dynamodbStoreTask.addCatch(this.failState, {
              errors: ["States.ALL"],
              resultPath: "$.errorInfo",
            })
          )
          .next(
            this.notificationTask.addCatch(this.failState, {
              errors: ["States.ALL"],
              resultPath: "$.errorInfo",
            })
          )
      ),
    });

    
  }
}
