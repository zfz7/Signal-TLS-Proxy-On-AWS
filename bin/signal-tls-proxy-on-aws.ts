#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {Ec2Stack} from '../lib/ec2-stack';
import {StackProps} from "aws-cdk-lib";
import {AWS_ACCOUNT, AWS_REGION, ENABLE_SSH} from "./config";
import {HostedZoneStack} from "../lib/hosted-zone-stack";
import {DnsStack} from "../lib/dns-stack";

const app = new cdk.App();
const stackProps: StackProps = {
    env: {account: AWS_ACCOUNT, region: AWS_REGION}
}

const hostedZoneStack = new HostedZoneStack(app, 'SignalTlsProxyHostedZoneStack', {
    ...stackProps,
})

const ec2Stack = new Ec2Stack(app, 'SignalTlsProxyEc2tack', {
    ...stackProps,
    enableSsh: ENABLE_SSH,
});

new DnsStack(app, 'SignalTlsProxyDNSStack', {
    ...stackProps,
    hostedZone: hostedZoneStack.hostedZone,
    instance: ec2Stack.instance
})
