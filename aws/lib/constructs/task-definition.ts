import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { TCpu, TMemory } from "../../types/parameter";
import * as cdk from "aws-cdk-lib";
import { toKebabCase } from "../utils/string";

interface TTaskDefinition {
  name: string;
  cpu?: TCpu;
  memory?: TMemory;
}

export class TaskDefinitionConstruct extends Construct {
  public readonly definition: ecs.FargateTaskDefinition;
  public readonly taskExecRole: iam.IRole;
  public readonly taskRole: iam.IRole;

  constructor(scope: Construct, id: string, props: TTaskDefinition) {
    super(scope, id);

    const name = toKebabCase(props.name);

    const taskExecRole = new iam.Role(this, `EcsTaskExecRole`, {
      roleName: `${name}-task-exec-role`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    const taskRole = new iam.Role(this, `EcsTaskRole`, {
      roleName: `${name}-task-role`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    taskRole.attachInlinePolicy(
      new iam.Policy(this, `IamPolicy`, {
        policyName: `${name}-task-role`,
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

    this.definition = new ecs.FargateTaskDefinition(this, `FargateTaskDef`, {
      family: props.name,
      executionRole: taskExecRole,
      taskRole: taskRole,
      cpu: props.cpu ?? 256,
      memoryLimitMiB: props.memory ?? 512,
    });

    this.taskExecRole = taskExecRole;
    this.taskRole = taskRole;
  }

  public addContainer(
    repositoryName: string,
    port: number,
    containerName: string
  ) {
    this.definition.addContainer(containerName, {
      image: ecs.ContainerImage.fromRegistry(
        `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com/${repositoryName}:latest`
      ),
      portMappings: [
        {
          containerPort: port,
          hostPort: port,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });
  }
}
