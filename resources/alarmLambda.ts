import { publishAlarm, deleteAlarm } from "./alarm-creation";

exports.handler = function (event: any) {
  if (event.detail.operationType === "insert") {
    console.log("insert event received");
    publishAlarm(event.detail.fullDocument.url);
  }
  if (event.detail.operationType === "delete") {
    deleteAlarm(event.detail.fullDocumentBeforeChange.url);
  }
};
