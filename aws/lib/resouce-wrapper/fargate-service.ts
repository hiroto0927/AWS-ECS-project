import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export function createFargateService(
  scope: Construct,
  name: string,
  cluster: ecs.Cluster,
  vpc: ec2.Vpc,
  repositoryName: string,
  port: number,
  taskDefinition: ecs.FargateTaskDefinition,
  albSG: ec2.SecurityGroup
) {
  taskDefinition.addContainer(name, {
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

  const securityGroup = new ec2.SecurityGroup(scope, `${name}-sg`, {
    vpc: vpc,
    allowAllOutbound: true,
    securityGroupName: `${name}-sg`,
  });

  securityGroup.addIngressRule(albSG, ec2.Port.tcp(port));

  const service = new ecs.FargateService(scope, `${name}-service`, {
    cluster: cluster,
    vpcSubnets: { subnets: vpc.privateSubnets },
    taskDefinition: taskDefinition,
    securityGroups: [securityGroup],
  });

  return service;
}
