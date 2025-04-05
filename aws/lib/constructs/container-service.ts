import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { TParameters } from "../../types/parameter";
import { TaskDefinitionConstruct } from "./task-definition";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ServiceUpdateConstruct } from "./service-update";

interface TContainerService {
  config: TParameters;
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  loadbalancerSecurityGroup: ec2.ISecurityGroup;
}

export class ContainerFargateServicesConstruct extends Construct {
  public readonly services: ecs.FargateService[];

  constructor(scope: Construct, id: string, props: TContainerService) {
    super(scope, id);

    const config = props.config;

    if (config.deployMode.type === "frontAndBack") {
      const backTask = new TaskDefinitionConstruct(this, `FargateBackTaskDef`, {
        name: `${config.projectName}-${config.env}-back-task-def`,
        cpu: config.deployMode.backendCpu,
        memory: config.deployMode.backendMemoryLimitMiB,
      });

      backTask.addContainer(
        config.deployMode.defaultBackRepoName,
        config.deployMode.backendPort,
        `${config.projectName}-${config.env}-backend`
      );

      const frontTask = new TaskDefinitionConstruct(
        this,
        `FargateFrontTaskDef`,
        {
          name: `${config.projectName}-${config.env}-front-task-def`,
          cpu: config.deployMode.frontendCpu,
          memory: config.deployMode.frontendMemoryLimitMiB,
        }
      );

      frontTask.addContainer(
        config.deployMode.defaultFrontRepoName,
        config.deployMode.frontendPort,
        `${config.projectName}-${config.env}-frontend`
      );

      const securityGroup = new ec2.SecurityGroup(this, `SecurityGroup`, {
        vpc: props.vpc,
        allowAllOutbound: true,
        securityGroupName: `${config.projectName}-${config.env}-container-sg`,
      });

      securityGroup.addIngressRule(
        props.loadbalancerSecurityGroup,
        ec2.Port.tcp(config.deployMode.frontendPort)
      );
      securityGroup.addIngressRule(
        props.loadbalancerSecurityGroup,
        ec2.Port.tcp(config.deployMode.backendPort)
      );
      const frontService = new ecs.FargateService(this, `FargateFrontService`, {
        cluster: props.cluster,
        vpcSubnets: { subnets: props.vpc.privateSubnets },
        taskDefinition: frontTask.definition,
        securityGroups: [securityGroup],
      });
      const backService = new ecs.FargateService(this, `FargateBackService`, {
        cluster: props.cluster,
        vpcSubnets: { subnets: props.vpc.privateSubnets },
        taskDefinition: backTask.definition,
        securityGroups: [securityGroup],
      });

      new ServiceUpdateConstruct(this, `UpdateFrontService`, {
        projectName: config.projectName,
        env: config.env,
        cluster: props.cluster,
        service: frontService,
        taskRole: frontTask.taskRole,
        taskExecRole: frontTask.taskExecRole,
        port: config.deployMode.frontendPort,
        family: frontTask.definition.family,
        containerName: `${config.projectName}-${config.env}-frontend`,
      });
      new ServiceUpdateConstruct(this, `UpdateBackendService`, {
        projectName: config.projectName,
        env: config.env,
        cluster: props.cluster,
        service: backService,
        taskRole: backTask.taskRole,
        taskExecRole: backTask.taskExecRole,
        port: config.deployMode.backendPort,
        family: backTask.definition.family,
        containerName: `${config.projectName}-${config.env}-backend`,
      });

      this.services = [frontService, backService];
    }

    if (config.deployMode.type === "singleApplication") {
      const task = new TaskDefinitionConstruct(this, `FargateTaskDef`, {
        name: `${config.projectName}-${config.env}-task-def`,
        cpu: config.deployMode.cpu,
        memory: config.deployMode.memoryLimitMiB,
      });

      task.addContainer(
        config.deployMode.defaultRepoName,
        config.deployMode.port,
        `${config.projectName}-${config.env}-app`
      );

      const securityGroup = new ec2.SecurityGroup(this, `SecurityGroup`, {
        vpc: props.vpc,
        allowAllOutbound: true,
        securityGroupName: `${config.projectName}-${config.env}-container-sg`,
      });

      securityGroup.addIngressRule(
        props.loadbalancerSecurityGroup,
        ec2.Port.tcp(config.deployMode.port)
      );

      const service = new ecs.FargateService(this, `FargateService`, {
        serviceName: `${config.projectName}-${config.env}-service`,
        cluster: props.cluster,
        vpcSubnets: { subnets: props.vpc.privateSubnets },
        taskDefinition: task.definition,
        securityGroups: [securityGroup],
      });

      new ServiceUpdateConstruct(this, `ServiceUpdate`, {
        projectName: config.projectName,
        env: config.env,
        cluster: props.cluster,
        service: service,
        taskRole: task.taskRole,
        taskExecRole: task.taskExecRole,
        port: config.deployMode.port,
        family: task.definition.family,
        containerName: `${config.projectName}-${config.env}-app`,
      });

      this.services = [service];
    }
  }
}
