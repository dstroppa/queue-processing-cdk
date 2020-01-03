#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkStack } from '../lib/cdk-stack';
import { PermissionsBoundary } from '../lib/permissions-boundary'

const app = new cdk.App();
const stack = new CdkStack(app, 'CdkStack');

stack.node.applyAspect(new PermissionsBoundary('arn:' + cdk.Aws.PARTITION + ':iam::' + cdk.Aws.ACCOUNT_ID + ':policy/' + cdk.Aws.STACK_NAME + '-' + cdk.Aws.REGION + '-PermissionsBoundary'))
