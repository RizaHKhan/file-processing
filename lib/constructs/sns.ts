import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";

export class SnsConstruct extends Construct {
  public topic: Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.topic = new Topic(this, "NotificationTopic", {
      topicName: "file-processing-workflow-topic",
    });
  }
}
