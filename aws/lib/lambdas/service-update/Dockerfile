FROM public.ecr.aws/lambda/python:3.10

RUN mkdir app
COPY app ${LAMBDA_TASK_ROOT}/app

CMD ["app.app.lambda_handler"]