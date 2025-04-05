import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TParameters } from "../types/parameter";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { AppClusterConstruct } from "./constructs/cluster";
import { MultiAppLoadbalancerConstruct } from "./constructs/multi-app-loadbalancer";
import { SingleAppLoadbalancerConstruct } from "./constructs/single-app-loadbalancer";
import { ContainerFargateServicesConstruct } from "./constructs/container-service";

type TApplicationStack = cdk.StackProps & {
  config: TParameters;
  vpc: ec2.Vpc;
};

export class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TApplicationStack) {
    super(scope, id);

    const config = props.config;

    const cluster = new AppClusterConstruct(this, `AppCluster`, {
      config: config,
      vpc: props.vpc,
    }).cluster;

    if (config.deployMode.type === "frontAndBack") {
      const alb = new MultiAppLoadbalancerConstruct(this, `Loadbalancer`, {
        config: config,
        vpc: props.vpc,
      });

      const fargate = new ContainerFargateServicesConstruct(
        this,
        `ContainerService`,
        {
          config: config,
          vpc: props.vpc,
          cluster: cluster,
          loadbalancerSecurityGroup: alb.securityGroup,
        }
      );

      alb.targetFrontGroup.addTarget(fargate.services[0]);
      alb.targetBackGroup.addTarget(fargate.services[1]);
    } else {
      const alb = new SingleAppLoadbalancerConstruct(this, `Loadbalancer`, {
        config: config,
        vpc: props.vpc,
      });

      const fargate = new ContainerFargateServicesConstruct(
        this,
        `ContainerService`,
        {
          config: config,
          vpc: props.vpc,
          cluster: cluster,
          loadbalancerSecurityGroup: alb.securityGroup,
        }
      );

      alb.targetGroup.addTarget(fargate.services[0]);
    }
  }
}
