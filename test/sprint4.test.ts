import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Sprint4Stack } from "../lib/sprint4-stack";

test("we have five lambda functions", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Sprint4Stack(app, "MyTestStack");
  // THEN
  const template = Template.fromStack(stack);
  template.resourceCountIs("AWS::Lambda::Function", 5);
});

test("layer is created for lambda", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Sprint4Stack(app, "MyTestStack");
  // THEN
  const template = Template.fromStack(stack);

  template.hasResource("AWS::Lambda::LayerVersion", {});
});
test("SNS subscription created successfully", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Sprint4Stack(app, "MyTestStack");
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::SNS::Subscription", {
    Protocol: "lambda",
  });
});
test("DynamoDB table is created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Sprint4Stack(app, "MyTestStack");
  // THEN
  const template = Template.fromStack(stack);

  template.hasResource("AWS::DynamoDB::Table", {});
});

test("Event Bridge rule is created for 1 minute", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Sprint4Stack(app, "MyTestStack");
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::Events::Rule", {
    State: "ENABLED",
  });
});
