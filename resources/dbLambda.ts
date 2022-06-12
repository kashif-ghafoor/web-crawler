import { putItem } from "./dynamodb_sdk";
/**
 * datbase lambda handler take SNS alarm as input pass that to putItem
 * function that publish that data to dynamodb table.
 *
 * */
exports.handler = async function (event: any, context: any) {
  const data = JSON.parse(event.Records[0].Sns.Message);
  const tableName = process.env.tableName;
  await putItem(data, tableName);
};
