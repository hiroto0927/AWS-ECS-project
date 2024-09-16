import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export function createLoadBalancerFrontAndBack(
  scope: Construct,
  projectName: string,
  frontHealthCheckPath: string,
  frontrendPort: number,
  backHealthCheckPath: string,
  backendPort: number,
  vpc: ec2.Vpc
) {
  const albSG = new ec2.SecurityGroup(scope, `${projectName}-alb-sg`, {
    vpc: vpc,
    allowAllOutbound: true,
    securityGroupName: `${projectName}-alb-sg`,
  });

  albSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

  const alb = new elbv2.ApplicationLoadBalancer(scope, `${projectName}-alb`, {
    loadBalancerName: `${projectName}-alb`,
    vpc: vpc,
    securityGroup: albSG,
    internetFacing: true,
  });

  const targetFrontGroup = new elbv2.ApplicationTargetGroup(
    scope,
    `${projectName}-frontend-tg`,
    {
      targetGroupName: `${projectName}-frontend-tg`,
      vpc: vpc,
      port: frontrendPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: frontHealthCheckPath,
        healthyHttpCodes: "200",
        protocol: elbv2.Protocol.HTTP,
      },
    }
  );

  const targetBackGroup = new elbv2.ApplicationTargetGroup(
    scope,
    `${projectName}-backend-tg`,
    {
      targetGroupName: `${projectName}-backend-tg`,
      vpc: vpc,
      port: backendPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: backHealthCheckPath,
        healthyHttpCodes: "200",
        protocol: elbv2.Protocol.HTTP,
      },
    }
  );

  const listener = alb.addListener("Listener", {
    port: 80,
    open: true,
    defaultTargetGroups: [targetFrontGroup],
  });

  new elbv2.ApplicationListenerRule(scope, "ListenerRule1", {
    listener: listener,
    priority: 1,
    conditions: [elbv2.ListenerCondition.pathPatterns(["/docs*"])],
    targetGroups: [targetBackGroup],
  });

  new elbv2.ApplicationListenerRule(scope, "ListenerRule2", {
    listener: listener,
    priority: 2,
    conditions: [elbv2.ListenerCondition.pathPatterns(["/openapi.json*"])],
    targetGroups: [targetBackGroup],
  });

  new elbv2.ApplicationListenerRule(scope, "ListenerRule3", {
    listener: listener,
    priority: 3,
    conditions: [elbv2.ListenerCondition.pathPatterns(["/api*"])],
    targetGroups: [targetBackGroup],
  });

  return { targetFrontGroup, targetBackGroup, albSG };
}
