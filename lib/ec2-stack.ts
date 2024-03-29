import * as cdk from 'aws-cdk-lib';
import {StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
    CfnEIP, CfnEIPAssociation,
    CfnKeyPair,
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    MachineImage,
    Peer,
    Port,
    SecurityGroup,
    UserData,
    Vpc
} from "aws-cdk-lib/aws-ec2";
import {Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import * as fs from "fs";
import {ARecord, IPublicHostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";

export interface Ec2StackProps extends StackProps {
    enableSsh: Boolean
    domainName: string
    hostedZone: IPublicHostedZone
}

export class Ec2Stack extends cdk.Stack {

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
        if (props.enableSsh) {
            securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allows SSH access (ipv4)')
            securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(22), 'Allows SSH access (ipv6)')
        }
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(80), 'Allows HTTP access (ipv6)')
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allows HTTP access (ipv4)')
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allows HTTPS access (ipv4)')
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(443), 'Allows HTTPS access (ipv6)')

        const cfnKeyPair = props.enableSsh ? new CfnKeyPair(this, 'signal-tls-proxy-key', {
            keyName: 'signal-tls-key',
            keyFormat: 'pem',
            keyType: 'rsa',
            publicKeyMaterial: fs.readFileSync("./public.pem", 'utf-8')
        }) : undefined;
        let userData = fs.readFileSync('./scripts/userdata.sh', 'utf8');
        userData = userData.replace(/\${TLS_PROXY_DOMAIN}/g, props.domainName)

        const instance = new Instance(this, 'signal-tls-proxy-instance', {
            vpc: defaultVpc,
            role: role,
            securityGroup: securityGroup,
            instanceName: 'signal-tls-proxy',
            instanceType: InstanceType.of(
                InstanceClass.T3A,
                InstanceSize.MICRO
            ),
            machineImage: MachineImage.latestAmazonLinux2(),
            keyName: props.enableSsh ? cfnKeyPair?.keyName : undefined,
            userData: UserData.forLinux({shebang:'Content-Type: multipart/mixed; boundary="//"'})
        })
        instance.addUserData(userData)

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
    }
}
