import {Construct} from 'constructs';
import {Stack, StackProps} from 'aws-cdk-lib';
import {IPublicHostedZone, PublicHostedZone} from 'aws-cdk-lib/aws-route53';
import {TLS_PROXY_DOMAIN} from "../bin/config";

export interface HostedZoneStackProps extends StackProps {
}

export class HostedZoneStack extends Stack {
    public readonly hostedZone: IPublicHostedZone
    constructor(scope: Construct, id: string, props: HostedZoneStackProps) {
        super(scope, id, props);
        this.hostedZone = PublicHostedZone.fromLookup(this, `Signal-TLS-Proxy-HZ`, {
            domainName: TLS_PROXY_DOMAIN
        });

    }
}
