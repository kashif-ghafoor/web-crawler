const AWS = require("aws-sdk");

export class AWS_CloudWatch {
  /**
   * uses sdk to publish metrics to cloud watch
   * @param url: url to which metric belogns
   * @param namespace : namespace wher metric will appear
   * @param metricName : metrice name to publish on cloudwatch
   * @param metricValue : metric value that is measured
   */
  publishMetric(
    url: string,
    namespace: string,
    metricName: string,
    metricValue: Number
  ) {
    const cloudwatch = new AWS.CloudWatch();
    const params = {
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: [
            {
              Name: "url",
              Value: url,
            },
          ],
          Value: metricValue,
        },
      ],
      Namespace: namespace,
    };
    cloudwatch.putMetricData(params, function (err: any, data: any) {
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
    });
  }
}
