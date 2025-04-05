import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TPropsParameters } from "../types/parameter";
import { createEcrRepository } from "./resouce-wrapper/ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { createLoadBalancerFrontAndBack } from "./resouce-wrapper/loadbalancer-front-and-back";
import { createLoadBalancerSingleApp } from "./resouce-wrapper/loadbalancer-single-app";
import { createFargateService } from "./resouce-wrapper/fargate-service";
import { createEcsTaskDefinition } from "./resouce-wrapper/ecs-task-def";
import { createServiceUpdateLambda } from "./resouce-wrapper/service-update-lambda";

type TProps = cdk.StackProps & {
  config: TPropsParameters;
  vpc: ec2.Vpc;
};

export class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id);

    const config = props.config;

    const cluster = new ecs.Cluster(this, `${config.projectName}-ecs-cluster`, {
      clusterName: `${config.projectName}-${config.env}-cluster`,
      vpc: props.vpc,
    });

    if (config.deployMode.type === "frontAndBack") {
      const backRepo = createEcrRepository(
        this,
        `${config.projectName}-${config.env}-back-repo`
      );
      const frontRepo = createEcrRepository(
        this,
        `${config.projectName}-${config.env}-front-repo`
      );

      const alb = createLoadBalancerFrontAndBack(
        this,
        `${config.projectName}-${config.env}`,
        config.deployMode.frontendHealthCheckPath,
        config.deployMode.frontendPort,
        config.deployMode.backendHealthCheckPath,
        config.deployMode.backendPort,
        props.vpc
      );

      const frontTaskDef = createEcsTaskDefinition(
        this,
        `${config.projectName}-${config.env}-front`,
        config.deployMode.frontendCpu,
        config.deployMode.frontendMemoryLimitMiB
      );
      const fargateFrontService = createFargateService(
        this,
        `${config.projectName}-${config.env}-front`,
        cluster,
        props.vpc,
        config.deployMode.defaultFrontRepoName,
        config.deployMode.frontendPort,
        frontTaskDef.taskDefinition,
        alb.albSG
      );

      const backTaskDef = createEcsTaskDefinition(
        this,
        `${config.projectName}-${config.env}-back`,
        config.deployMode.backendCpu,
        config.deployMode.backendMemoryLimitMiB
      );

      const fargateBackService = createFargateService(
        this,
        `${config.projectName}-${config.env}-back`,
        cluster,
        props.vpc,
        config.deployMode.defaultBackRepoName,
        config.deployMode.backendPort,
        backTaskDef.taskDefinition,
        alb.albSG
      );

      alb.targetFrontGroup.addTarget(fargateFrontService);
      alb.targetBackGroup.addTarget(fargateBackService);

      createServiceUpdateLambda(
        this,
        `${config.projectName}-${config.env}-front`,
        frontTaskDef.taskDefinition.family,
        frontRepo.repositoryName,
        frontTaskDef.taskRole.roleArn,
        frontTaskDef.taskExecRole.roleArn,
        cluster.clusterArn,
        fargateFrontService.serviceArn,
        config.deployMode.frontendPort
      );

      createServiceUpdateLambda(
        this,
        `${config.projectName}-${config.env}-back`,
        backTaskDef.taskDefinition.family,
        backRepo.repositoryName,
        backTaskDef.taskRole.roleArn,
        backTaskDef.taskExecRole.roleArn,
        cluster.clusterArn,
        fargateBackService.serviceArn,
        config.deployMode.backendPort
      );
    } else {
      const ecrRepo = createEcrRepository(
        this,
        `${config.projectName}-${config.env}-repo`
      );

      const alb = createLoadBalancerSingleApp(
        this,
        `${config.projectName}-${config.env}`,
        config.deployMode.healthCheckPath,
        config.deployMode.port,
        props.vpc
      );
      const task = createEcsTaskDefinition(
        this,
        `${config.projectName}-${config.env}`,
        config.deployMode.cpu,
        config.deployMode.memoryLimitMiB
      );
      const service = createFargateService(
        this,
        `${config.projectName}-${config.env}`,
        cluster,
        props.vpc,
        config.deployMode.defaultRepoName,
        config.deployMode.port,
        task.taskDefinition,
        alb.albSG
      );

      alb.targetGroup.addTarget(service);

      createServiceUpdateLambda(
        this,
        `${config.projectName}-${config.env}`,
        task.taskDefinition.family,
        ecrRepo.repositoryName,
        task.taskRole.roleArn,
        task.taskExecRole.roleArn,
        cluster.clusterArn,
        service.serviceArn,
        config.deployMode.port
      );
    }
  }
}
