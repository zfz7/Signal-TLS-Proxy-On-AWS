#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {Ec2Stack} from '../lib/ec2-stack';
import {StackProps} from "aws-cdk-lib";
import {AWS_ACCOUNT, AWS_REGION} from "./config";
import {ProxyHostedZone} from "../lib/proxy-hosted-zone";

const app = new cdk.App();
const stackProps: StackProps = {
    env: {account: AWS_ACCOUNT, region: AWS_REGION}
}

const hostedZoneStack = new ProxyHostedZone(app, 'SignalTlsProxyHostedZoneStack', {
    ...stackProps,
})

new Ec2Stack(app, 'SignalTlsProxyOnAwsStack', {
    ...stackProps,
    hostedZone: hostedZoneStack.hostedZone
});
