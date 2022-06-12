const AWS = require("aws-sdk");
import { AVAILABILITY_METRIC, NAMESPACE, LATENCY_METRIC } from "./CONSTANTS";
const cloudwatch = new AWS.CloudWatch();
import { getURLs } from "./mongodb";

/**
 * this function gets urls from mongodb data
 * and create alram on each metric.
 */

// function that publish alarms to cloudwatch
export function publishAlarm(url: string) {
  const latencyParams = getLatencyParams(url);
  const availParams = getAvailabilityParams(url);
  cloudwatch.putMetricAlarm(availParams, function (err: any, data: any) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
  });

  cloudwatch.putMetricAlarm(latencyParams, function (err: any, data: any) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
  });
}
// deleting alarms
export function deleteAlarm(url: string) {
  cloudwatch.deleteAlarms(
    {
      AlarmNames: [
        url + AVAILABILITY_METRIC + "kashif-ghafoor",
        url + LATENCY_METRIC + "kashif-ghafoor",
      ],
    },
    function (err: any, data: any) {
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
    }
  );
}

// generate availability parameters needed to create alarm
function getAvailabilityParams(url: string) {
  return {
    AlarmName: url + AVAILABILITY_METRIC + "kashif-ghafoor",
    ComparisonOperator: "LessThanThreshold",
    EvaluationPeriods: 1,
    DatapointsToAlarm: 1,
    MetricName: AVAILABILITY_METRIC,
    Namespace: NAMESPACE,
    Period: 300,
    Statistic: "Average",
    Threshold: 1.0,
    ActionsEnabled: true,
    AlarmActions: ["arn:aws:sns:us-east-1:315997497220:kashifDBLambdaTopic"],
    AlarmDescription: "Alarm when availablity is less than 1",
    Dimensions: [
      {
        Name: "url",
        Value: url,
      },
    ],
  };
}
// generate latency parameters needed to create alarm
function getLatencyParams(url: string) {
  return {
    AlarmName: url + LATENCY_METRIC + "kashif-ghafoor",
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1,
    DatapointsToAlarm: 1,
    MetricName: LATENCY_METRIC,
    Namespace: NAMESPACE,
    Period: 300,
    Statistic: "Average",
    Threshold: 3000.0,
    ActionsEnabled: true,
    AlarmActions: ["arn:aws:sns:us-east-1:315997497220:kashifDBLambdaTopic"],
    AlarmDescription: "Alarm when latency is greater than 3000",
    Dimensions: [
      {
        Name: "url",
        Value: url,
      },
    ],
  };
}
