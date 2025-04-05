import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { TParameters } from "../../types/parameter";

interface TAppClusterProps {
  config: TParameters;
  vpc: ec2.IVpc;
}

export class AppClusterConstruct extends Construct {
  public readonly cluster: ecs.ICluster;

  constructor(scope: Construct, id: string, props: TAppClusterProps) {
    super(scope, id);

    const config = props.config;

    this.cluster = new ecs.Cluster(this, `EcsCluster`, {
      clusterName: `${config.projectName}-${config.env}-cluster`,
      vpc: props.vpc,
    });
  }
}
