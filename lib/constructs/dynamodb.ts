import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DynamoDbConstruct extends Construct {
  public table: TableV2;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new TableV2(this, "FileProcessingTable", {
      partitionKey: { name: "name", type: AttributeType.STRING },
      tableName: "file_processing_workflow_table",
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
