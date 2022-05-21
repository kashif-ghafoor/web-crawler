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
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as constants from "../resources/CONSTANTS";

export class Sprint2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
    });

    /**
     * policy section: creating roles and policies for services
     * assign policies to resources according to requirement
     * every lambda function have basic+cloudWatchFullAccess policy
     *
     */

    // creating role for web health lambda
    const wHLambdaRole = this.create_lambda_role(
      "cloudwatchRole",
      "granting full access of aws cloudWatch to wHLambda"
    );
    //creating role for database lambda
    const dBLambdaRole = this.create_lambda_role(
      "dBLambda",
      "granting full access of aws dynamoDB to dbLambda"
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
      "kashifWHLambda",
      "wHLambda.handler",
      "resources",
      layer,
      wHLambdaRole
    );
    wHLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // defining eventBridge to automate creation of events

    // creating database lamdba
    const dbLambda = this.createLambda(
      "kashifDBLambda",
      "dbLambda.handler",
      "resources",
      layer,
      dBLambdaRole
    );

    dbLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    //event bridge service to create event after
    // perticular time
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Rule.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html
    const rule = new Rule(this, "ScheduleRule", {
      schedule: Schedule.rate(Duration.minutes(1)),
      targets: [new targets.LambdaFunction(wHLambda)],
    });

    // creating dynamodb table
    const snsTable = new dynamodb.Table(this, "snsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });
    snsTable.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // storing table name to environment variable of database lambda
    dbLambda.addEnvironment("tableName", snsTable.tableName);

    // using SNS service
    const Topic = new sns.Topic(this, "Topic");

    // adding lambda subscription to SNS topic
    Topic.addSubscription(new subscriptions.LambdaSubscription(dbLambda));

    /**
     * Alarm section.
     * In this function I created alarms for metric of each URL
     * userful links for this section:
     * creating alarms: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Alarm.html
     * actions: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch_actions.SnsAction.html
     */

    //for availability metric
    constants.URLs.forEach((url) => {
      const availabilityAlarm = new cloudwatch.Alarm(
        this,
        constants.AVAILABILITY_METRIC + url + "kashif-ghafoor",
        {
          comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
          threshold: 1,
          evaluationPeriods: 1,
          datapointsToAlarm: 1,
          metric: new cloudwatch.Metric({
            metricName: constants.AVAILABILITY_METRIC,
            namespace: constants.NAMESPACE,
            period: Duration.minutes(1),
            dimensionsMap: { url: url },
          }),
        }
      );
      // adding SNS action to alarm.
      availabilityAlarm.addAlarmAction(new cw_actions.SnsAction(Topic));
      availabilityAlarm.applyRemovalPolicy(RemovalPolicy.DESTROY);
    });

    // for latency metric
    constants.URLs.forEach((url) => {
      const latencyAlarm = new cloudwatch.Alarm(
        this,
        constants.LATENCY_METRIC + url + "kashif-ghafoor",
        {
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          threshold: 3000,
          evaluationPeriods: 1,
          datapointsToAlarm: 1,
          metric: new cloudwatch.Metric({
            metricName: constants.LATENCY_METRIC,
            namespace: constants.NAMESPACE,
            period: Duration.minutes(1),
            dimensionsMap: { url: url },
          }),
        }
      );
      // adding SNS alarm action to alarm
      latencyAlarm.addAlarmAction(new cw_actions.SnsAction(Topic));
      latencyAlarm.applyRemovalPolicy(RemovalPolicy.DESTROY);
    });
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
      timeout: cdk.Duration.minutes(15),
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
