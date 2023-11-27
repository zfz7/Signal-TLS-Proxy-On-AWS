import {Construct} from 'constructs';
import {Stack, StackProps} from 'aws-cdk-lib';
import {ARecord, IPublicHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53';
import {CfnEIP, CfnEIPAssociation, Instance} from "aws-cdk-lib/aws-ec2";

export interface DnsStackProps extends StackProps {
    instance: Instance
    hostedZone: IPublicHostedZone
}

export class DnsStack extends Stack {
    constructor(scope: Construct, id: string, props: DnsStackProps) {
        super(scope, id, props);
        const elasticIp = new CfnEIP(this, "signal-tls-proxy-ip");

        new CfnEIPAssociation(this, "signal-tls-proxy-ec2-ip-association", {
            eip: elasticIp.ref,
            instanceId: props.instance.instanceId
        });

        new ARecord(this, 'signal-tls-proxy-ec2-record', {
            target: RecordTarget.fromIpAddresses(elasticIp.ref),
            zone: props.hostedZone,
            recordName: '', // Root of hosted zone
            deleteExisting: true,
        });

    }
}
