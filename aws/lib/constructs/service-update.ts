import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs from "aws-cdk-lib/aws-ecs";

interface TServiceUpdate {
  name: string;
  env: string;
  port: number;
  family: string;
  taskRole: iam.IRole;
  taskExecRole: iam.IRole;
  cluster: ecs.ICluster;
  service: ecs.IService;
}

export class ServiceUpdateConstruct extends Construct {
  constructor(scope: Construct, id: string, props: TServiceUpdate) {
    super(scope, id);

    const repository = new ecr.Repository(this, "ContainerImageRepository", {
      repositoryName: props.name,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 3,
        },
      ],
    });

    const fn = new lambda.Function(this, "ServiceUpdateLambda", {
      functionName: props.name,
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../functions/service-update/app")
      ),
      handler: "app.lambda_handler",
      environment: {
        TASK_ROLE_ARN: props.taskRole.roleArn,
        TASK_EXEC_ROLE_ARN: props.taskExecRole.roleArn,
        MEMORY: "512",
        CPU: "256",
        CLUSTER_ARN: props.cluster.clusterArn,
        SERVICE_ARN: props.service.serviceArn,
        PORT: props.port.toString(),
        FAMILY: props.family,
        CONTAINER_NAME: props.name,
      },
    });

    fn.addToRolePolicy(
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

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [props.taskRole.roleArn, props.taskExecRole.roleArn],
      })
    );

    new events.Rule(this, `EventRule`, {
      eventPattern: {
        source: ["aws.ecr"],
        detailType: ["ECR Image Action"],
        detail: {
          result: ["SUCCESS"],
          "action-type": ["PUSH"],
          "repository-name": [repository.repositoryName],
        },
      },
      targets: [new targets.LambdaFunction(fn)],
    });
  }
}
