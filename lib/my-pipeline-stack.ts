import { Stack, StackProps, pipelines, SecretValue } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PipelineSage } from "./pipelines-stage";

export class KashifPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // defining source of pipeline i.e github repo
    const source = pipelines.CodePipelineSource.gitHub(
      "kashif2022skipq/Sculptor_TS",
      "main",
      {
        authentication: SecretValue.secretsManager("kashif-github-token"),
      }
    );

    const pipeline = new pipelines.CodePipeline(this, "kashifPipeline", {
      synth: new pipelines.ShellStep("kashifSynth", {
        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: source,
        installCommands: ["npm install -g aws-cdk"],

        commands: [
          "cd kashif-ghafoor/sprint4",
          "npm ci",
          "cd layer/nodejs",
          "ls",
          "npm ci",
          "cd ../..",
          "npm run build",
          "npx cdk synth",
        ],
        primaryOutputDirectory: "kashif-ghafoor/sprint4/cdk.out",
      }),
    });

    // const betaStage = pipeline.addStage(
    //   new PipelineSage(this, "beta", {
    //     // env: { account: "315997497220", region: "us-east-1" },
    //   })
    // );

    // betaStage.addPre(
    //   new pipelines.ShellStep("Run Unit Tests", {
    //     commands: ["cd kashif-ghafoor/sprint4", "npm install", "npm test"],
    //   })
    // );

    const prodStage = pipeline.addStage(
      new PipelineSage(this, "prod", {
        // env: { account: "315997497220", region: "us-east-1" },
      })
    );
    prodStage.addPre(
      new pipelines.ManualApprovalStep("Manual  approval before production ")
    );
  }
}
