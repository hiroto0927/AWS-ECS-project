import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TPropsDeployMode } from "../types/parameter";
import { createEcrRepository } from "./resouce-wrapper/ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { createLoadBalancerFrontAndBack } from "./resouce-wrapper/loadbalancer-front-and-back";
import { createLoadBalancerSingleApp } from "./resouce-wrapper/loadbalancer-single-app";
import { createFargateService } from "./resouce-wrapper/fargate-service";
import { createEcsTaskDefinition } from "./resouce-wrapper/ecs-task-def";
import { createServiceUpdateLambda } from "./resouce-wrapper/service-update-lambda";

type TProps = cdk.StackProps & {
  projectName: string;
  deployMode: TPropsDeployMode;
  vpc: ec2.Vpc;
};

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, `${props.projectName}-ecs-cluster`, {
      clusterName: `${props.projectName}-ecs-cluster`,
      vpc: props.vpc,
    });

    if (props.deployMode.type === "frontAndBack") {
      const backRepo = createEcrRepository(
        this,
        `${props.projectName}-back-repo`
      );
      const frontRepo = createEcrRepository(
        this,
        `${props.projectName}-front-repo`
      );

      const alb = createLoadBalancerFrontAndBack(
        this,
        props.projectName,
        props.deployMode.frontendHealthCheckPath,
        props.deployMode.frontendPort,
        props.deployMode.backendHealthCheckPath,
        props.deployMode.backendPort,
        props.vpc
      );

      const frontTaskDef = createEcsTaskDefinition(
        this,
        `${props.projectName}-frontend`,
        props.deployMode.frontendCpu,
        props.deployMode.frontendMemoryLimitMiB
      );
      const fargateFrontService = createFargateService(
        this,
        `${props.projectName}-frontend`,
        cluster,
        props.vpc,
        props.deployMode.defaultFrontRepoName,
        props.deployMode.frontendPort,
        frontTaskDef.taskDefinition,
        alb.albSG
      );

      const backTaskDef = createEcsTaskDefinition(
        this,
        `${props.projectName}-backend`,
        props.deployMode.backendCpu,
        props.deployMode.backendMemoryLimitMiB
      );

      const fargateBackService = createFargateService(
        this,
        `${props.projectName}-backend`,
        cluster,
        props.vpc,
        props.deployMode.defaultBackRepoName,
        props.deployMode.backendPort,
        backTaskDef.taskDefinition,
        alb.albSG
      );

      alb.targetFrontGroup.addTarget(fargateFrontService);
      alb.targetBackGroup.addTarget(fargateBackService);

      createServiceUpdateLambda(
        this,
        `${props.projectName}-front-update`,
        frontTaskDef.taskDefinition.family,
        frontRepo.repositoryName,
        frontTaskDef.taskRole.roleArn,
        frontTaskDef.taskExecRole.roleArn,
        cluster.clusterArn,
        fargateFrontService.serviceArn,
        props.deployMode.frontendPort.toString()
      );

      createServiceUpdateLambda(
        this,
        `${props.projectName}-back-update`,
        backTaskDef.taskDefinition.family,
        backRepo.repositoryName,
        backTaskDef.taskRole.roleArn,
        backTaskDef.taskExecRole.roleArn,
        cluster.clusterArn,
        fargateBackService.serviceArn,
        props.deployMode.backendPort.toString()
      );
    } else {
      const ecrRepo = createEcrRepository(this, `${props.projectName}-repo`);

      const alb = createLoadBalancerSingleApp(
        this,
        props.projectName,
        props.deployMode.healthCheckPath,
        props.deployMode.port,
        props.vpc
      );
      const task = createEcsTaskDefinition(
        this,
        props.projectName,
        props.deployMode.cpu,
        props.deployMode.memoryLimitMiB
      );
      const service = createFargateService(
        this,
        props.projectName,
        cluster,
        props.vpc,
        props.deployMode.defaultRepoName,
        props.deployMode.port,
        task.taskDefinition,
        alb.albSG
      );

      alb.targetGroup.addTarget(service);

      createServiceUpdateLambda(
        this,
        `${props.projectName}-repo-update`,
        task.taskDefinition.family,
        ecrRepo.repositoryName,
        task.taskRole.roleArn,
        task.taskExecRole.roleArn,
        cluster.clusterArn,
        service.serviceArn,
        props.deployMode.port.toString()
      );
    }
  }
}
