# Web Health serverless application

this application measures the latency and availability of websites.

## Features

- measures latency and availability metrices
- generate Alarms on certain threshold
- store generated alarm to database.
- plot metrices live to aws cloudwatch dashboard
- measure metrices every one minute.

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
  cd sprint2
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
