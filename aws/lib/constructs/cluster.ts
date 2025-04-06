import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { TParameters } from "../../types/parameter";

interface TCluster {
  config: TParameters;
  vpc: ec2.IVpc;
}

export class ClusterConstruct extends Construct {
  public readonly cluster: ecs.ICluster;

  constructor(scope: Construct, id: string, props: TCluster) {
    super(scope, id);

    const config = props.config;

    const name = `${config.projectName}-${config.env}`;

    this.cluster = new ecs.Cluster(this, `EcsCluster`, {
      clusterName: name,
      vpc: props.vpc,
    });
  }
}
