import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";

type TProps = cdk.StackProps & {
  vpc: ec2.Vpc;
  containerPort: number;
};

export function createLoadBalancerSingleApp(
  scope: Construct,
  projectName: string,
  healthCheckPath: string,
  port: number,
  vpc: ec2.Vpc
) {
  const albSG = new ec2.SecurityGroup(scope, "SecurityGroupELB", {
    vpc: vpc,
    allowAllOutbound: true,
    securityGroupName: `langchain-alb-sg`,
  });

  albSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

  const alb = new elbv2.ApplicationLoadBalancer(scope, `${projectName}-alb`, {
    loadBalancerName: `${projectName}-alb`,
    vpc: vpc,
    securityGroup: albSG,
    internetFacing: true,
    vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
  });

  const targetGroup = new elbv2.ApplicationTargetGroup(
    scope,
    `${projectName}-target-group`,
    {
      targetGroupName: `${projectName}-target-group`,
      vpc: vpc,
      port: port,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: healthCheckPath,
        healthyHttpCodes: "200",
        protocol: elbv2.Protocol.HTTP,
      },
    }
  );

  const listener = alb.addListener("Listener", {
    port: 80,
    open: true,
    defaultTargetGroups: [targetGroup],
  });

  new elbv2.ApplicationListenerRule(scope, "ListenerRule1", {
    listener: listener,
    priority: 1,
    conditions: [elbv2.ListenerCondition.pathPatterns(["/docs*"])],
    targetGroups: [targetGroup],
  });

  new elbv2.ApplicationListenerRule(scope, "ListenerRule2", {
    listener: listener,
    priority: 2,
    conditions: [elbv2.ListenerCondition.pathPatterns(["/openapi.json*"])],
    targetGroups: [targetGroup],
  });

  new elbv2.ApplicationListenerRule(scope, "ListenerRule3", {
    listener: listener,
    priority: 3,
    conditions: [elbv2.ListenerCondition.pathPatterns(["/api*"])],
    targetGroups: [targetGroup],
  });

  return targetGroup;
}
