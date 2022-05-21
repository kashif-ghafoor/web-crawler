const DynamoDB = require("aws-sdk/clients/dynamodb");
const documentClient = new DynamoDB.DocumentClient({ region: "us-east-1" });

/**
 * here I used cdk to put data to dynamodb
 *
 * @param item Message from Alarm notification
 * @param tableName table name where store this item
 */
export const putItem = async (item: any, tableName: any) => {
  item["id"] = item["AlarmName"]; // assigning alarm name value id
  delete item["AlarmName"]; // deleting alarm name
  const params = {
    TableName: tableName,
    Item: item,
  };
  try {
    const data = await documentClient.put(params).promise();
    console.log(data);
  } catch (err) {
    console.log(err);
  }
};
