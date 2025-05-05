// lib/iac-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export class IacStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Define the VPC ---
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: 'ontario-health-viz-vpc', // Give the VPC a name
      maxAzs: 2, // Use 2 Availability Zones for basic redundancy
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // Define the IP range for the VPC

      // Define subnet types - we'll start simple
      subnetConfiguration: [
        {
          cidrMask: 24, // Size of the subnet
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC, // Accessible from the internet (for LB, etc.)
        },
        {
          cidrMask: 24,
          name: 'private-isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Not accessible from internet, no outbound route via NAT
        },
        // We are omitting PRIVATE_WITH_EGRESS for now to avoid NAT Gateway costs.
        // If services in private subnets need outbound internet later, we can add NAT Gateways.
      ],

      natGateways: 0, // Explicitly disable NAT Gateways for cost saving initially

      // Default is true, creates endpoints for S3 and DynamoDB in the VPC for free
      // gatewayEndpoints: {
      //   S3: { service: ec2.GatewayVpcEndpointAwsService.S3 },
      //   DynamoDB: { service: ec2.GatewayVpcEndpointAwsService.DYNAMODB }
      // }
    });

    // --- Define the ECR Repository to store the Go service image ---
    const waterQualityRepo = new ecr.Repository(this, 'WaterQualityRepo', {
      repositoryName: 'ontario-health-viz/water-quality-service', // Convention: namespace/service
      imageScanOnPush: true, // Automatically scan images for vulnerabilities on push
      lifecycleRules: [{ // Rule to clean up old images
        description: 'Keep only last 10 images',
        maxImageCount: 10, // Keep max 10 images
        rulePriority: 1, // Priority order for rules
        tagStatus: ecr.TagStatus.ANY, // Apply to tagged and untagged images
      }],
      // IMPORTANT: For portfolio/dev projects, DESTROY allows the repo to be deleted when the stack is destroyed.
      // Be VERY cautious with this in production, as it deletes all images! Default is RETAIN.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true, // Automatically delete images when the repo is deleted (requires removalPolicy: DESTROY)
    });

        // --- Define the ECS Cluster ---
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      clusterName: 'ontario-health-viz-cluster',
      vpc: vpc, // Associate the cluster with the VPC we created earlier
      containerInsights: true, // Enable enhanced monitoring (recommended)
    });

    // --- Add Outputs ---
    // Output the ECR repository URI - needed for Docker push command later
    new cdk.CfnOutput(this, 'EcrRepoUri', {
      value: waterQualityRepo.repositoryUri,
      description: 'URI of the ECR repository for the water quality service',
    });

    // Output the ECS Cluster Name
    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'Name of the ECS Cluster',
    });
    
    // You can add outputs here if needed, e.g., to see the VPC ID after deployment
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });

  }
}