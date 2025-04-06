import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TParameters } from "../types/parameter";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ClusterConstruct } from "./constructs/cluster";
import { MultiAppLoadbalancerConstruct } from "./constructs/multi-app-loadbalancer";
import { SingleApplicationConstruct } from "./constructs/single-app-loadbalancer";

type TApplicationStack = cdk.StackProps & {
  config: TParameters;
  vpc: ec2.Vpc;
};

export class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TApplicationStack) {
    super(scope, id);

    const config = props.config;

    const cluster = new ClusterConstruct(this, `Cluster`, {
      config: config,
      vpc: props.vpc,
    }).cluster;

    switch (config.deployMode.type) {
      case "frontAndBack":
        new MultiAppLoadbalancerConstruct(this, `Application`, {
          config: config,
          vpc: props.vpc,
          cluster: cluster,
        });
        break;
      case "singleApplication":
        new SingleApplicationConstruct(this, `Application`, {
          config: config,
          vpc: props.vpc,
          cluster: cluster,
        });
        break;
      default:
        throw new Error("Invalid deploy mode");
    }
  }
}
