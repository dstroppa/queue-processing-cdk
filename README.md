# Lambda-SQS starter project

This project contains source code and supporting files for the serverless application that you created in the AWS Lambda console. You can update your application at any time by committing and pushing changes to your AWS CodeCommit or GitHub repository.

This project includes the following files and folders:

- src - Code for the application's Lambda function.
- events - Invocation events that you can use to invoke the function.
- \_\_tests__ - Unit tests for the application code.
- cdk - The CDK model that defines the application's AWS resources.
- buildspec.yml -  A build specification file that tells AWS CodeBuild how to create a deployment package for the function.

Your Lambda application includes two AWS CloudFormation stacks. The first stack creates the pipeline that builds and deploys your application.

The pipeline creates a second stack that contains your application's resources, including Lambda functions, and CloudWatch Events scheduled event. These resources are defined in the `cdk/lib/cdk-stack.ts` file in this project. You can update the CDK model to add AWS resources through the same deployment process that updates your application code. You can view those resources in the **Resources** section of the application overview in the Lambda console.

For a full list of possible operations, see the [AWS Lambda Applications documentation](https://docs.aws.amazon.com/lambda/latest/dg/deploying-lambda-apps.html).

## Try the application out

1. Go to the SQS console.
2. Select the queue prefixed with your application name.
3. Click **Queue Actions > Send a Message** in the top left.
4. Enter any text you'd like, then click **Send Message**.
5. Go back to the Lambda console, find your application again and click it.
6. Select **sqsPayloadLoggerFunction** in the **Resources** table.
7. On the new page, select the **Monitoring** tab, then click **View Logs in CloudWatch**, which will take you to the CloudWatch Logs console.
8. Click on the latest log stream entry, and you will find your log statement.

## Add a resource to your application

The application template uses the AWS Cloud Development Kit (AWS CDK) to define application resources. AWS CDK is an open source software development framework to model and provision your cloud application resources using familiar programming languages. AWS CDK provides a library of constructs that cover many AWS services and features, enabling you to define your applications' infrastructure at a high level. AWS CDK also provides CFN Resources, which map 1:1 with base-level AWS CloudFormation resources, and provide a way to define CloudFormation with a programming language.

Update `cdk/lib/cdk-stack.ts` to add a dead-letter queue to your application. In the `CdkStack` class import `@aws-cdk/aws-sqs` module, and in the class constructor, add a resource named **MyQueue** with the type **@aws-cdk/aws-sqs.Queue**.

```typescript
import { Queue } from '@aws-cdk/aws-sqs'
...
const dlq = new Queue(this, 'MyQueue');
```

The dead-letter queue is a location for Lambda to send events that could not be processed. It's only used if you invoke your function asynchronously, but it's useful here to show how you can modify your application's resources and function configuration.

Commit the change and push.

```bash
my-application$ git commit -am "Add dead-letter queue."
my-application$ git push
```

**To see how the pipeline processes and deploys the change**

1. Open the [**Applications**](https://console.aws.amazon.com/lambda/home#/applications) page.
1. Choose your application.
1. Choose **Deployments**.

When the deployment completes, view the application resources on the **Overview** tab to see the new resource.

## Update the permissions boundary

The sample application applies a **permissions boundary** to its function's execution role. The permissions boundary limits the permissions that you can add to the function's role. Without the boundary, users with write access to the project repository could modify the project template to give the function permission to access resources and services outside of the scope of the sample application.

In order for the function to use the queue that you added in the previous step, you must extend the permissions boundary. The Lambda console detects resources that aren't in the permissions boundary and provides an updated policy that you can use to update it.

**To update the application's permissions boundary**

1. Open the [**Applications**](https://console.aws.amazon.com/lambda/home#/applications) page.
1. Choose your application.
1. Choose **Edit permissions boundary**.
1. Follow the instructions shown to update the boundary to allow access to the new queue.

## Update the function configuration

Now you can grant the function permission to access the queue and configure the dead-letter queue setting.

In the function's properties in `cdk/lib/cdk-stack.ts`, add the **deadLetterQueue** configuration. Allow the Lambda function to send messages to a queue with the `grantSendMessages` [method](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-sqs.IQueue.html#grant-wbr-send-wbr-messagesgrantee).

```typescript
// This is a Lambda function config associated with the source code: s3-json-logger.js
const sqsPayloadLoggerFunction = new lambda.Function(this, "sqsPayloadLoggerFunction", {
  handler: "index.sqsPayloadLoggerHandler",
  runtime: lambda.Runtime.NODEJS_10_X,
  description: "A Lambda function that logs the payload of messages sent to an associated SQS queue.",
  memorySize: 128,
  // Using inline code as a workaround as local assets are not supported yet, see https://github.com/aws/aws-cdk/issues/1312
  //code: lambda.Code.asset("../src/handlers"),
  code: lambda.Code.inline(this.localAsset(path.join(__dirname, "../../src/handlers/sqs-payload-logger.js"))),
  timeout: cdk.Duration.seconds(25), //Chosen to be less than the default SQS Visibility Timeout of 30 seconds
  events: [
    new event.SqsEventSource(queue)
  ],
  deadLetterQueue: dlq
});
```

Commit and push the change. When the deployment completes, view the function in the console to see the updated configuration that specifies the dead-letter queue.

## Build and test locally

The AWS SAM command line interface (CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

If you prefer to use an integrated development environment (IDE) to build and test your application, you can use the AWS Toolkit.
The AWS Toolkit is an open-source plugin for popular IDEs that uses the AWS SAM CLI to build and deploy serverless applications on AWS. The AWS Toolkit also adds step-through debugging for Lambda function code.

To get started, see the following:

* [PyCharm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [IntelliJ](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
* [Visual Studio](https://docs.aws.amazon.com/toolkit-for-visual-studio/latest/user-guide/welcome.html)

To use the AWS SAM CLI with this sample, you need the following tools:

* AWS CLI - [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and [configure it with your AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).
* AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community).

Compile your AWS CDK app and create a AWS CloudFormation template

```
my-application$ cd cdk
cdk$ npm run build
cdk$ cdk synth --no-staging > template.yaml
```

Find the logical ID for your Lambda function in `template.yaml`. It will look like *sqsPayloadLoggerFunction12345678*, where *12345678* represents an 8-character unique ID that the AWS CDK generates for all resources. The line right after it should look like `Type: AWS::Lambda::Function`.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
my-application$ sam local invoke sqsPayloadLoggerFunction87654321 --event events/event-sqs.json
```

## Unit tests

Requirements:

* Node.js - [Install Node.js 10](https://nodejs.org/en/), including the npm package management tool.

Tests are defined in the \_\_tests__ folder in this project. Use `npm` to install the [Jest test framework](https://jestjs.io/) and run unit tests.

```bash
my-application$ npm install
my-application$ npm run test
```

## Resources

For an introduction to the AWS CDK specification, see the [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/latest/guide/home.html).

Next, you can use the AWS Serverless Application Repository to deploy ready-to-use apps that go beyond Hello World samples and learn how authors developed their applications. For more information, see the [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/) and the [AWS Serverless Application Repository Developer Guide](https://docs.aws.amazon.com/serverlessrepo/latest/devguide/what-is-serverlessrepo.html).
