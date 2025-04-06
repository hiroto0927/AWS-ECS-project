import { Construct } from "constructs";
import { TParameters } from "../../types/parameter";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ContainerFargateServicesConstruct } from "./container-service";
import { toKebabCase } from "../utils/string";

interface TMultiAppLoadbalancer {
  config: TParameters;
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
}

export class MultiAppLoadbalancerConstruct extends Construct {
  constructor(scope: Construct, id: string, props: TMultiAppLoadbalancer) {
    super(scope, id);

    const config = props.config;
    const name = toKebabCase(`${config.projectName}-${config.env}`);

    if (config.deployMode.type === "singleApplication") {
      throw new Error("This construct is not for single application mode");
    }

    const securityGroup = new ec2.SecurityGroup(this, `SecurityGroup`, {
      securityGroupName: `${name}-sg`,
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const alb = new elbv2.ApplicationLoadBalancer(this, `Loadbalancer`, {
      loadBalancerName: `${name}-alb`,
      vpc: props.vpc,
      securityGroup: securityGroup,
      internetFacing: true,
    });

    const targetFrontGroup = new elbv2.ApplicationTargetGroup(
      this,
      `FrontendTargetGroup`,
      {
        targetGroupName: `${name}-front-tg`,
        vpc: props.vpc,
        port: config.deployMode.frontendPort,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: config.deployMode.frontendHealthCheckPath,
          healthyHttpCodes: "200-299",
          protocol: elbv2.Protocol.HTTP,
        },
      }
    );

    const targetBackGroup = new elbv2.ApplicationTargetGroup(
      this,
      `BackendTargetGroup`,
      {
        targetGroupName: `${name}-back-tg`,
        vpc: props.vpc,
        port: config.deployMode.backendPort,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: config.deployMode.backendHealthCheckPath,
          healthyHttpCodes: "200-299",
          protocol: elbv2.Protocol.HTTP,
        },
      }
    );

    const listener = alb.addListener("Listener", {
      port: 80,
      open: true,
      defaultTargetGroups: [targetFrontGroup],
    });

    new elbv2.ApplicationListenerRule(this, "Rule1", {
      listener: listener,
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/docs*"])],
      targetGroups: [targetBackGroup],
    });

    new elbv2.ApplicationListenerRule(this, "Rule2", {
      listener: listener,
      priority: 2,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/openapi.json*"])],
      targetGroups: [targetBackGroup],
    });

    new elbv2.ApplicationListenerRule(this, "Rule3", {
      listener: listener,
      priority: 3,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/api*"])],
      targetGroups: [targetBackGroup],
    });

    const fargate = new ContainerFargateServicesConstruct(this, `Application`, {
      config: config,
      vpc: props.vpc,
      cluster: props.cluster,
      loadbalancerSecurityGroup: securityGroup,
    });

    targetFrontGroup.addTarget(fargate.services[0]);
    targetBackGroup.addTarget(fargate.services[1]);
  }
}
