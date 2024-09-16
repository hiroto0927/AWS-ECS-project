import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { TPropsCpu, TPropsMemoryLimitMiB } from "../../types/parameter";

export function createEcsTaskDefinition(
  scope: Construct,
  name: string,
  cpu?: TPropsCpu,
  memoryLimitMiB?: TPropsMemoryLimitMiB
) {
  const taskExecRole = new iam.Role(scope, `${name}-exec-role`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  });

  const taskRole = new iam.Role(scope, `${name}-ecs-task-role`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
  });

  taskRole.attachInlinePolicy(
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

  taskExecRole.addManagedPolicy(
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AmazonECSTaskExecutionRolePolicy"
    )
  );

  const taskDefinition = new ecs.FargateTaskDefinition(
    scope,
    `${name}-task-def`,
    {
      executionRole: taskExecRole,
      taskRole: taskRole,
      cpu: cpu ?? 256,
      memoryLimitMiB: memoryLimitMiB ?? 512,
      family: name,
    }
  );

  return { taskDefinition, taskExecRole, taskRole };
}
