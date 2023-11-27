import * as cdk from 'aws-cdk-lib';
import {StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {ARecord, IPublicHostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {
    CfnEIP,
    CfnEIPAssociation,
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    MachineImage,
    Peer,
    Port,
    SecurityGroup,
    Vpc
} from "aws-cdk-lib/aws-ec2";
import {Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export interface Ec2StackProps extends StackProps {
    hostedZone: IPublicHostedZone
}

export class Ec2Stack extends cdk.Stack {
    public readonly ec2PublicIpV4: string
    constructor(scope: Construct, id: string, props: Ec2StackProps) {
        super(scope, id, props);

        const defaultVpc = Vpc.fromLookup(this, 'VPC', {isDefault: true})

        const role = new Role(this, 'signal-tls-proxy-instance-role', {assumedBy: new ServicePrincipal('ec2.amazonaws.com')})

        const securityGroup = new SecurityGroup(this, 'signal-tls-proxy-sg',
            {
                vpc: defaultVpc,
                allowAllOutbound: true,
                securityGroupName: 'signal-tls-proxy-sg',
            }
        )
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allows SSH access (ipv4)')
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allows HTTP access (ipv4)')
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allows HTTPS access (ipv4)')
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(22), 'Allows SSH access (ipv6)')
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(80), 'Allows HTTP access (ipv6)')
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(443), 'Allows HTTPS access (ipv6)')

        const instance = new Instance(this, 'signal-tls-proxy-instance', {
            vpc: defaultVpc,
            role: role,
            securityGroup: securityGroup,
            instanceName: 'signal-tls-proxy',
            instanceType: InstanceType.of(
                InstanceClass.T3A,
                InstanceSize.MICRO
            ),
            machineImage: MachineImage.latestAmazonLinux2()
        })

        const elasticIp = new CfnEIP(this, "signal-tls-proxy-ip");

        new CfnEIPAssociation(this, "signal-tls-proxy-ec2-ip-association", {
            eip: elasticIp.ref,
            instanceId: instance.instanceId
        });

        new ARecord(this, 'signal-tls-proxy-ec2-record', {
            target: RecordTarget.fromIpAddresses(elasticIp.ref),
            zone: props.hostedZone,
            recordName: '', // Root of hosted zone
            deleteExisting: true,
        });

        new cdk.CfnOutput(this, 'signal-tls-proxy-output', {
            value: instance.instancePublicIp
        })
    }
}
