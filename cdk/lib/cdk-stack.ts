import cdk = require('@aws-cdk/core');
import lambda = require("@aws-cdk/aws-lambda");
import event = require("@aws-cdk/aws-lambda-event-sources");
import sqs = require("@aws-cdk/aws-sqs");
import * as fs from 'fs';
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    var appId = new cdk.CfnParameter(this, "AppId", {
      type: "String",
      description: "App Id"
    });

    // This is an SQS queue with all default configuration properties. To learn more about the available options, see
    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sqs-queues.html
    const queue = new sqs.Queue(this, "SimpleQueue");

    // This is a Lambda function config associated with the source code: s3-json-logger.js
    const sqsPayloadLoggerFunction = new lambda.Function(this, "sqsPayloadLoggerFunction", {
      handler: "index.sqsPayloadLoggerHandler",
      runtime: lambda.Runtime.NODEJS_10_X,
      description: "A Lambda function that logs the payload of messages sent to an associated SQS queue.",
      memorySize: 128,
      // Using inline code as a workaround as local assets are not supported yet, see https://github.com/aws/aws-cdk/issues/1312
      //code: lambda.Code.asset("../src/handlers"),
      code: lambda.Code.inline(this.localAsset(path.join(__dirname, "../../src/handlers/sqs-payload-logger.js"))),
      timeout: cdk.Duration.seconds(25) //Chosen to be less than the default SQS Visibility Timeout of 30 seconds
    });
    // Give Read Permissions to the SQS queue
    queue.grantConsumeMessages(sqsPayloadLoggerFunction);
    // Add event source
    sqsPayloadLoggerFunction.addEventSource(new event.SqsEventSource(queue));

  }

  localAsset(path: string) {
    return fs.readFileSync(path, 'utf8');
  }
}
