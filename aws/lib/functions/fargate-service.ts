import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

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

export function createFargateService(
  scope: Construct,
  name: string,
  cluster: ecs.Cluster,
  vpc: ec2.Vpc,
  repository: ecr.Repository,
  port: number,
  taskDefinition: ecs.TaskDefinition,
  cpu?: TPropsCpu,
  memoryLimitMiB?: TPropsMemoryLimitMiB
) {
  taskDefinition.addContainer(name, {
    image: ecs.ContainerImage.fromRegistry(
      `${repository.repositoryUri}:latest`
    ),
    memoryLimitMiB: memoryLimitMiB ?? 512,
    cpu: cpu ?? 256,
    portMappings: [
      {
        containerPort: port,
        hostPort: port,
        protocol: ecs.Protocol.TCP,
      },
    ],
  });

  const service = new ecs.FargateService(scope, `${name}-service`, {
    cluster: cluster,
    vpcSubnets: { subnets: vpc.privateSubnets },
    taskDefinition: taskDefinition,
    // deploymentAlarms: {
    //   behavior: ecs.AlarmBehavior.FAIL_ON_ALARM,
    //   alarmNames: ["ECSFailureAlarm"],
    // },
  });

  return service;
}
