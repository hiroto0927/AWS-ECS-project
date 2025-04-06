import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TParameters } from "../types/parameter";
import { toKebabCase } from "./utils/string";

type TNetworkStack = cdk.StackProps & {
  config: TParameters;
};

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: TNetworkStack) {
    super(scope, id);

    const config = props.config;
    const name = toKebabCase(`${config.projectName}-${config.env}`);

    this.vpc = new ec2.Vpc(this, `Vpc`, {
      vpcName: `${name}-vpc`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 18,
          name: `${name}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 18,
          name: `${name}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
