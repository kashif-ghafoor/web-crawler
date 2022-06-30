# serverless web crawler

this application measures the latency and availability of websites.
### Desgin Diagram
![image](https://user-images.githubusercontent.com/58185339/176626964-7a6b0a5b-d5e3-4b26-8e97-cecee7258c60.png)

## Features

- measures latency and availability metrices
- generate Alarms on certain threshold
- store generated alarm to database.
- plot metrices live to aws cloudwatch dashboard
- measure metrices every five minutes.
- you can create delete get and update list of urls in mongodb using express server.
- alarms on metrices will created or deleted according to url operation.
- if you add a new url a new alarm will be created automatically.
- if you delete a url corresponding alarm will be deleted automatically.
- logs will be shown at cloudwatch
- CI/CD is implented in this project.
- make any changes in your application or stack
  they will automatically be deployed to your account.
- If your web crawler is in alarm state pipeline will
  automatically rollback applicatin to last successfule build.
- you can add your own cloudwatch metrices to applicatin see this guidline:
  for alarms https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Alarm.html
  for metric https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Function.html#metricwbrerrorsprops

## Run locally

#### setting up aws cdk.

If you already have aws cdk proceed to next step.

installing aws-cdk

```
    npm install aws-cdk-lib
```

set your credentials

```
    aws configure
```

## Run project

Clone the project

```bash
  git clone https://github.com/kashif2022skipq/Sculptor_TS/tree/main/kashif-ghafoor/sprint2
```

Go to the project directory

```bash
  cd sprint4
```

Install dependencies

```bash
  npm install
```

typescript compilation

```bash
  npm run watch
```

deploy lambda

```
    cdk deploy
```

that's it you have deployed your serverless application to aws.

cdk watch onstantly observe the changes in your code and deploy it to aws.

```
    cdk watch
```

## output

after deployment go to your lambda in aws console.
you will have two lambda functions there.
you can observer them in their cloudwatch.
you can also see the alarms generated in cloudwatch and in dynamodb table.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
