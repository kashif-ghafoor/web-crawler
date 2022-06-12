import {
  Duration,
  Stack,
  StackProps,
  aws_iam as iam,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cw_actions,
  aws_sns as sns,
  aws_sns_subscriptions as subscriptions,
  aws_dynamodb as dynamodb,
  aws_codedeploy as codedeploy,
  aws_apigateway as apigateway,
  RemovalPolicy,
  aws_lambda as lambda,
  aws_events as events,
  aws_events_targets as targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { publishAlarm } from "../resources/alarm-creation";
import { getURLs } from "../resources/mongodb";

export class Sprint4Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // getting array of urls on which alarms should be created

    /**
     * Layers section:
     * for dependencies of lambda functions
     */

    //creating layer for web health lambda function to use axios library in application
    const layer = new lambda.LayerVersion(this, "kashifLayer", {
      code: lambda.Code.fromAsset("layer"),
      compatibleArchitectures: [
        lambda.Architecture.X86_64,
        lambda.Architecture.ARM_64,
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /**
     * policy section: creating roles and policies for services
     * assign policies to resources according to requirement
     * every lambda function have basic+cloudWatchFullAccess policy
     *
     */

    // creating role for web health lambda
    const wHLambdaRole = this.create_lambda_role(
      "wHLambdaCloudWatchRole",
      "granting full access of aws cloudWatch to expressLambda"
    );
    //creating role for database lambda
    const dBLambdaRole = this.create_lambda_role(
      "dBLambdaCloudWatchRole",
      "granting full access of aws dynamoDB to dbLambda"
    );

    // creating role for express lambda function
    const eLambdaRole = this.create_lambda_role(
      "expressLambdaCloudWatchRole",
      "granting full access of aws cloudWatch to expressLambda"
    );
    // creating role for alarm lambda function
    const aLambdaRole = this.create_lambda_role(
      "alarmLambdaCloudWatchRole",
      "granting full access of aws cloudWatch to alarmLambda"
    );

    // database lambda function need permissions to write on dynamodb
    dBLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    /**
     * resources/services initialization section:
     * in this section all services being used are created
     */

    // creating web health lambda function
    const wHLambda = this.createLambda(
      "kashif-webhealth-lambda",
      "wHLambda.handler",
      "resources",
      layer,
      wHLambdaRole
    );
    wHLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // defining alias:
    const version = wHLambda.currentVersion;
    const alias = new lambda.Alias(this, "LambdaAlias", {
      aliasName: "Prod",
      version,
    });

    // defining eventBridge to automate creation of events

    // creating database lamdba
    const dbLambda = this.createLambda(
      "kashif-database-lambda",
      "dBLambda.handler",
      "resources",
      layer,
      dBLambdaRole
    );

    dbLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // creating express-server lambda function to run REST APIs
    const expressLambda = this.createLambda(
      "kashif-express-lambda",
      "expressLambda.handler",
      "resources",
      layer,
      eLambdaRole
    );
    expressLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // creating alarmLambda for creation and deletion of alarms
    const alarmLambda = this.createLambda(
      "kashif-alarm-lambda",
      "alarmLambda.handler",
      "resources",
      layer,
      aLambdaRole
    );
    alarmLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // creating api gateway to send requests to express lambda function

    new apigateway.LambdaRestApi(this, "express-api", {
      handler: expressLambda,
    });

    //event bridge service to create event after
    // perticular time
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Rule.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html
    const rule = new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.rate(Duration.minutes(10)),
      targets: [new targets.LambdaFunction(wHLambda)],
    });
    rule.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // creating rule to direct events of insertion and deletion
    // from mongodb to lambda function for creation and deletion of alarms
    const event_bus = events.EventBus.fromEventBusArn(
      this,
      "eventBusFrommongodbSource",
      "arn:aws:events:us-east-1:315997497220:event-bus/aws.partner/mongodb.com/stitch.trigger/62a0b1dbeeac02b8c2315754"
    );
    const rule_two = new events.Rule(this, "RuleforAlarmLambda", {
      eventBus: event_bus,
      targets: [new targets.LambdaFunction(alarmLambda)],
      eventPattern: {
        source: [
          "aws.partner/mongodb.com/stitch.trigger/62a0b1dbeeac02b8c2315754",
        ],
      },
    });
    rule_two.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // creating dynamodb table
    const snsTable = new dynamodb.Table(this, "snsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });
    snsTable.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // storing table name to environment variable of database lambda
    dbLambda.addEnvironment("tableName", snsTable.tableName);

    // using SNS service
    const Topic = new sns.Topic(this, "Topic", {
      topicName: "kashifDBLambdaTopic",
    });

    // adding lambda subscription to SNS topic
    Topic.addSubscription(new subscriptions.LambdaSubscription(dbLambda));

    /**
     * Alarm section.
     * In this function I created alarms for metric of each URL
     * userful links for this section:
     * creating alarms: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Alarm.html
     * actions: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch_actions.SnsAction.html
     */

    // this function creates alarms on availability and latency
    // metric for each URL retrieved from mongoDB
    // used aws-sdk to create alarms as cdk was not working
    // for asynchroneous creation of alarms
    getURLs().then(
      (urls) => {
        urls.forEach((url: string) => {
          publishAlarm(url);
        });
      },
      (err) =>
        console.log("in createAlarm function of file alarm-creation.", err)
    );

    // measuring the health of web crawler
    const durationMetric = wHLambda.metricDuration({
      label: "average duration",
      period: Duration.minutes(10),
      statistic: cloudwatch.Statistic.AVERAGE,
    });
    const errorMetric = wHLambda.metricErrors({
      label: "average errors",
      period: Duration.minutes(10),
      statistic: cloudwatch.Statistic.AVERAGE,
    });

    // creating alarm on duration metric
    const durationAlarm = new cloudwatch.Alarm(
      this,
      "kashifwHLambdaDurationAlarm",
      {
        metric: durationMetric,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 40000,
        evaluationPeriods: 1,
        alarmDescription: "Alarm if duration is greater than 1 minute",
        actionsEnabled: true,
      }
    );
    // creating alarm on erro metric
    const errorAlarm = new cloudwatch.Alarm(this, "kashifwHLambdaErrorAlarm", {
      metric: errorMetric,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: "Alarm if there is error in execution of web crawler",
      actionsEnabled: true,
    });
    // implemeting auto rollback to previous build when lambda is in alarm

    // /**
    //  * deployment section
    //  * In this section I have setup deployment configurations
    //  * to implement BlueGreenDeployment for web crawler.
    //  */
    // configurations for deployment group
    const config = new codedeploy.CustomLambdaDeploymentConfig(
      this,
      "CustomConfig",
      {
        type: codedeploy.CustomLambdaDeploymentConfigType.LINEAR,
        interval: Duration.minutes(1),
        percentage: 5,
      }
    );

    const deploymentGroup = new codedeploy.LambdaDeploymentGroup(
      this,
      "BlueGreenDeployment",
      {
        alias,
        deploymentConfig: config,
        alarms: [durationAlarm, errorAlarm],
      }
    );
  }

  /**
   * @desc utility function is used to create lambda function.
   * @param id -> unique id assigned to each lambda function
   *@param handler -> name of the function that will be called by lambda function
   *@param layer -> layer object contains dependencies for application
   *@returns lambda function
   */
  createLambda(
    id: string,
    handler: string,
    path: string,
    layer: any,
    lambdaRole: any
  ) {
    return new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: handler,
      code: lambda.Code.fromAsset(path),
      timeout: cdk.Duration.minutes(5),
      layers: [layer],
      role: lambdaRole,
    });
  }

  /**
   * this function create basic role with cloud watch full access
   * I will use this role to assign more policies and pass to resource/service
   * @param id -> for role id
   * @param description -> description of role
   * @returns a Role (policy)
   */
  create_lambda_role(id: string, description: string) {
    const lambdaRole = new iam.Role(this, id, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: description,
    });
    // I want to assign cloudwatch access to every lambda
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess")
    );
    return lambdaRole;
  }
}
