#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {StackProps} from 'aws-cdk-lib';
import {Ec2Stack} from '../lib/ec2-stack';
import {AWS_ACCOUNT, AWS_REGION, ENABLE_SSH, TLS_PROXY_DOMAIN} from "./config";
import {HostedZoneStack} from "../lib/hosted-zone-stack";

const app = new cdk.App();
const stackProps: StackProps = {
    env: {account: AWS_ACCOUNT, region: AWS_REGION}
}

const hostedZoneStack = new HostedZoneStack(app, 'SignalTlsProxyHostedZoneStack', {
    ...stackProps,
    domainName: TLS_PROXY_DOMAIN
})

new Ec2Stack(app, 'SignalTlsProxyEc2Stack', {
    ...stackProps,
    enableSsh: ENABLE_SSH,
    domainName: TLS_PROXY_DOMAIN,
    hostedZone: hostedZoneStack.hostedZone
});
