import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Sprint4Stack } from "./sprint4-stack";

export class PipelineSage extends Stage {
  stage: any;
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.stage = new Sprint4Stack(this, "kashifSprint4Stack");
  }
}
