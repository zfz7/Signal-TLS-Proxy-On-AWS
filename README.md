# Signal-TLS-Proxy-On-AWS

[Signal-TLS-Proxy](https://github.com/signalapp/Signal-TLS-Proxy) using CDK on AWS. The goal is to run one
command `cdk bootstrap && cdk deploy --all` to set up a Signal TLS Proxy using EC2

## Prerequisites

- [AWS Account](https://aws.amazon.com/account/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
- An AWS will SSO setup:
    - https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_auth
    - https://docs.aws.amazon.com/sdkref/latest/guide/access-sso.html
- Export these environment variables

```
export AWS_ACCOUNT=12345678901
export TLS_PROXY_DOMAIN=singal-relay.example.com
```

## Deployment

```
cdk bootstrap # Frist run only
cdk deploy --all 

# Destory stacks
cdk destory --all
```

### (Optional) SSH Access

In `config.ts` set `ENABLE_SSH = true` and save a `public.pem` RSA public key in the root folder. 
