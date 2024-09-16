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
  port: string,
  memory?: string,
  cpu?: string
) {
  const lambdaFunction = new lambda.DockerImageFunction(scope, name, {
    functionName: name,
    code: lambda.DockerImageCode.fromImageAsset(
      path.join(__dirname, "../lambdas/service-update")
    ),
    environment: {
      SERVICE_NAME: name,
      TASK_ROLE_ARN: taskRoleArn,
      TASK_EXEC_ROLE_ARN: taskExecRoleArn,
      MEMORY: memory ?? "512",
      CPU: cpu ?? "256",
      CLUSTER_ARN: clusterArn,
      SERVICE_ARN: serviceArn,
      PORT: port,
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

// arn:aws:ecs:ap-northeast-1:859871104911:service/sample-project-ecs-cluster/EcsStack-sample-project-sampleprojectserviceService319604D1-vxrsE3Jf7AaQ
