import { Construct } from "constructs";
import { TParameters } from "../../types/parameter";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { ContainerFargateServicesConstruct } from "./container-service";
import { toKebabCase } from "../utils/string";

interface TSingleAppLoadbalancer {
  config: TParameters;
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
}

export class SingleApplicationConstruct extends Construct {
  public readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  public readonly targetGroup: elbv2.IApplicationTargetGroup;
  public readonly securityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: TSingleAppLoadbalancer) {
    super(scope, id);

    const config = props.config;
    const name = toKebabCase(`${config.projectName}-${config.env}`);

    if (config.deployMode.type === "frontAndBack") {
      throw new Error("This construct is not for front and back mode");
    }

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
      securityGroupName: `${name}-sg`,
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "Loadbalancer", {
      loadBalancerName: `${name}-alb`,
      vpc: props.vpc,
      securityGroup: securityGroup,
      internetFacing: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const targetGroup = new elbv2.ApplicationTargetGroup(this, `TargetGroup`, {
      targetGroupName: `${name}-tg`,
      vpc: props.vpc,
      port: config.deployMode.port,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: config.deployMode.healthCheckPath,
        healthyHttpCodes: "200-299",
        protocol: elbv2.Protocol.HTTP,
      },
    });

    const listener = alb.addListener("Listener", {
      port: 80,
      open: true,
      defaultTargetGroups: [targetGroup],
    });

    new elbv2.ApplicationListenerRule(this, "Rule1", {
      listener: listener,
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/docs*"])],
      targetGroups: [targetGroup],
    });

    new elbv2.ApplicationListenerRule(this, "Rule2", {
      listener: listener,
      priority: 2,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/openapi.json*"])],
      targetGroups: [targetGroup],
    });

    new elbv2.ApplicationListenerRule(this, "Rule3", {
      listener: listener,
      priority: 3,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/api*"])],
      targetGroups: [targetGroup],
    });

    const fargate = new ContainerFargateServicesConstruct(this, `Application`, {
      config: config,
      vpc: props.vpc,
      cluster: props.cluster,
      loadbalancerSecurityGroup: securityGroup,
    });

    targetGroup.addTarget(fargate.services[0]);
  }
}
