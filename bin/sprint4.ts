#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { KashifPipelineStack } from "../lib/my-pipeline-stack";
import { Sprint4Stack } from "../lib/sprint4-stack";

const app = new cdk.App();
new KashifPipelineStack(app, "kashifPipeline", {
  // env: {
  //   account: "315997497220",
  //   region: "us-east-1",
  // },
});
app.synth();
