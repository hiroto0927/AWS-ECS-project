import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TParameters } from "../types/parameter";

type TNetworkStack = cdk.StackProps & {
  config: TParameters;
};

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: TNetworkStack) {
    super(scope, id);

    const config = props.config;

    this.vpc = new ec2.Vpc(this, `Vpc`, {
      vpcName: `${config.projectName}-${config.env}-vpc-for-ecs`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 18,
          name: `${config.projectName}-${config.env}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 18,
          name: `${config.projectName}-${config.env}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
