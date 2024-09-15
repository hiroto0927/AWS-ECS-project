import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";

export function createEcsTaskDefinition(scope: Construct, name: string) {
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
    }
  );

  return taskDefinition;
}
