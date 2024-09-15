import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";

type TPropsCpu = 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
type TPropsMemoryLimitMiB =
  | 512
  | 1024
  | 2048
  | 4096
  | 8192
  | 16384
  | 32768
  | 65536;

export function createEcsTaskDefinition(
  scope: Construct,
  name: string,
  cpu?: TPropsCpu,
  memoryLimitMiB?: TPropsMemoryLimitMiB
) {
  const ecsExecutionRole = new iam.Role(scope, `${name}-exec-role`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  });

  const ecsTaskRole = new iam.Role(scope, `${name}-ecs-task-role`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  });

  ecsTaskRole.attachInlinePolicy(
    new iam.Policy(scope, `${name}-ecs-task-exec-policy`, {
      statements: [
        new iam.PolicyStatement({
          actions: [
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          resources: ["*"],
        }),
      ],
    })
  );

  ecsExecutionRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AmazonECSTaskExecutionRolePolicy"
    )
  );

  const taskDefinition = new ecs.FargateTaskDefinition(
    scope,
    `${name}-task-def`,
    {
      executionRole: ecsExecutionRole,
      taskRole: ecsTaskRole,
      cpu: cpu ?? 256,
      memoryLimitMiB: memoryLimitMiB ?? 512,
      family: name,
    }
  );

  return taskDefinition;
}
