import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export function createServiceUpdateLambda(
  scope: Construct,
  name: string,
  family: string,
  repoName: string,
  taskRoleArn: string,
  taskExecRoleArn: string,
  clusterArn: string,
  serviceArn: string,
  port: number,
  memory?: number,
  cpu?: number
) {
  const lambdaFunction = new lambda.Function(scope, name, {
    functionName: name,
    code: lambda.Code.fromAsset(
      path.join(__dirname, "../functions/service-update/app")
    ),
    handler: "app.lambda_handler",
    runtime: lambda.Runtime.PYTHON_3_12,
    environment: {
      SERVICE_NAME: name,
      TASK_ROLE_ARN: taskRoleArn,
      TASK_EXEC_ROLE_ARN: taskExecRoleArn,
      MEMORY: memory ? memory.toString() : "512",
      CPU: cpu ? cpu.toString() : "256",
      CLUSTER_ARN: clusterArn,
      SERVICE_ARN: serviceArn,
      PORT: port.toString(),
      FAMILY: family,
    },
  });

  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      actions: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ecs:UpdateService",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
      ],
      resources: ["*"],
    })
  );

  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [taskRoleArn, taskExecRoleArn],
    })
  );

  new events.Rule(scope, `${name}-event`, {
    eventPattern: {
      source: ["aws.ecr"],
      detailType: ["ECR Image Action"],
      detail: {
        result: ["SUCCESS"],
        "action-type": ["PUSH"],
        "repository-name": [repoName],
      },
    },
    targets: [new targets.LambdaFunction(lambdaFunction)],
  });
}
