import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TPropsDeployMode } from "../types/parameter";
import { createEcrRepository, dockerImagePushForEcr } from "./functions/ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { createLoadBalancerFrontAndBack } from "./functions/loadbalancer-front-and-back";
import { createLoadBalancerSingleApp } from "./functions/loadbalancer-single-app";
import { createFargateService } from "./functions/fargate-service";
import { createEcsTaskDefinition } from "./functions/ecs-task-def";

type TProps = cdk.StackProps & {
  projectName: string;
  deployMode: TPropsDeployMode;
  vpc: ec2.Vpc;
};

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const ecsCluster = new ecs.Cluster(this, "EcsCluster", {
      clusterName: `${props.projectName}-ecs-cluster`,
      vpc: props.vpc,
    });

    if (props.deployMode.type === "frontAndBack") {
      const frontRepo = createEcrRepository(
        this,
        `${props.projectName}-backend-repo`
      );

      dockerImagePushForEcr(
        this,
        `${props.projectName}-frontend-image`,
        frontRepo,
        `../../../applications/${props.deployMode.deployFrontAppFolderName}`
      );

      const backRepo = createEcrRepository(
        this,
        `${props.projectName}-frontend-repo`
      );

      dockerImagePushForEcr(
        this,
        `${props.projectName}-backend-image`,
        backRepo,
        `../../../applications/${props.deployMode.deployBackAppFolderName}`
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
      const fargateFront = createFargateService(
        this,
        `${props.projectName}-frontend`,
        ecsCluster,
        props.vpc,
        frontRepo,
        props.deployMode.frontendPort,
        createEcsTaskDefinition(this, `${props.projectName}-frontend`)
      );
      const fargateBack = createFargateService(
        this,
        `${props.projectName}-backend`,
        ecsCluster,
        props.vpc,
        backRepo,
        props.deployMode.backendPort,
        createEcsTaskDefinition(this, `${props.projectName}-backend`)
      );

      alb.targetFrontGroup.addTarget(fargateFront);
      alb.targetBackGroup.addTarget(fargateBack);
    } else {
      const repo = createEcrRepository(this, `${props.projectName}-repo`);

      dockerImagePushForEcr(
        this,
        `${props.projectName}-backend-image`,
        repo,
        `../../../applications/${props.deployMode.deployAppFolderName}`
      );

      const alb = createLoadBalancerSingleApp(
        this,
        props.projectName,
        props.deployMode.healthCheckPath,
        props.deployMode.port,
        props.vpc
      );
      const task = createEcsTaskDefinition(this, props.projectName);
      const fargate = createFargateService(
        this,
        props.projectName,
        ecsCluster,
        props.vpc,
        repo,
        props.deployMode.port,
        task
      );

      alb.addTarget(fargate);
    }
  }
}
