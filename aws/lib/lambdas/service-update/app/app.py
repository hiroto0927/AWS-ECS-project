import boto3
import json

from app.env import (
    CLUSTER_ARN,
    CPU,
    MEMORY,
    PORT,
    SERVICE_ARN,
    TASK_EXEC_ROLE_ARN,
    TASK_ROLE_ARN,
    FAMILY,
)

ecs_client = boto3.client("ecs")


def lambda_handler(event, context):

    task_info = create_task_definition(event)
    update_service(task_info)

    return json.dumps(
        {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "deploy success",
                }
            ),
        }
    )


def create_task_definition(event):
    response = ecs_client.register_task_definition(
        family=FAMILY,
        networkMode="awsvpc",
        taskRoleArn=TASK_ROLE_ARN,
        executionRoleArn=TASK_EXEC_ROLE_ARN,
        cpu=str(CPU),
        memory=str(MEMORY),
        requiresCompatibilities=["FARGATE"],
        containerDefinitions=[
            {
                "name": FAMILY,
                "image": f"{event['account']}.dkr.ecr.ap-northeast-1.amazonaws.com/{event['detail']['repository-name']}:{event['detail']['image-tag']}",
                "cpu": CPU,
                "memory": MEMORY,
                "essential": True,
                "portMappings": [
                    {
                        "containerPort": PORT,
                        "hostPort": PORT,
                        "protocol": "tcp",
                    },
                ],
            },
        ],
    )

    print(response)

    return response["taskDefinition"]


def update_service(task_definition):
    response = ecs_client.update_service(
        cluster=CLUSTER_ARN,
        deploymentConfiguration={"maximumPercent": 200, "minimumHealthyPercent": 50},
        desiredCount=1,
        forceNewDeployment=True,  # 要調査
        service=SERVICE_ARN,
        taskDefinition=task_definition["taskDefinitionArn"],
    )

    print(response)

    return response
