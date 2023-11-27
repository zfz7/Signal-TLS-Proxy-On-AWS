# Signal-TLS-Proxy-On-AWS
Signal-TLS-Proxy using CDK on AWS


# Prerequisites 
AWS Account
CDK 
Hosted Zone
These env vars

```
export AWS_ACCOUNT = 1230123
export TLS_PROXY_DOMAIN = asdfasdfasdf
```

# Deploy
```
cdk bootstrap
cdk deploy --all

ENABLE_SSH
save rsa public key as public.pem in root folder
cdk destory --all # Remove 

```
