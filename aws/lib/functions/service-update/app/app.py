import boto3
import json
import os


TASK_ROLE_ARN = os.getenv("TASK_ROLE_ARN")
TASK_EXEC_ROLE_ARN = os.getenv("TASK_EXEC_ROLE_ARN")
MEMORY = int(os.getenv("MEMORY"))
CPU = int(os.getenv("CPU"))
CLUSTER_ARN = os.getenv("CLUSTER_ARN")
SERVICE_ARN = os.getenv("SERVICE_ARN")
PORT = int(os.getenv("PORT"))
FAMILY = os.getenv("FAMILY")
CONTAINER_NAME = os.getenv("CONTAINER_NAME")

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
                "name": CONTAINER_NAME,
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

    return response
