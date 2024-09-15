import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

type TProps = cdk.StackProps & {
  projectName: string;
};

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, `${props.projectName}-VpcForECS`, {
      vpcName: `${props.projectName}-vpc-for-ecs`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 18,
          name: `${props.projectName}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 18,
          name: `${props.projectName}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    this.vpc = vpc;
  }
}
