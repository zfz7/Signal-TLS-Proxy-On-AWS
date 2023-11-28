MIME-Version: 1.0

--//
Content-Type: text/cloud-config; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="cloud-config.txt"

#cloud-config
cloud_final_modules:
- [scripts-user, always]

--//
Content-Type: text/x-shellscript; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="userdata.txt"

#!/bin/bash
set -e
cd /home/ec2-user
sudo yum upgrade
sudo yum update -y
sudo yum install docker containerd git screen -y
sleep 1
if ! [ -f "/usr/local/bin/docker-compose" ]; then
  sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
  sleep 1
  sudo chmod +x /usr/local/bin/docker-compose
  sleep 5
  systemctl enable docker.service --now
  sudo usermod -a -G docker ec2-user
  sleep 1
  echo "Rebooting to set permissions"
  sudo reboot
fi
sleep 5
systemctl enable docker.service --now
# Wait for IP address to be associated
max_retries=300
retry_interval=10  # in seconds

for ((i=1; i<=$max_retries; i++)); do
    # Resolve the desired URL to an IP address
    desired_ip=$(dig +short "${TLS_PROXY_DOMAIN}" @1.1.1.1 | head -n 1)
    current_ip=$(curl -s ifconfig.me/ip)

    if [ "$current_ip" == "$desired_ip" ]; then
        echo "IP matched desired URL: $current_ip"
        break
    else
        echo "Retrying in $retry_interval seconds (Attempt $i/$max_retries)..."
        sleep $retry_interval
    fi
done

#Add Github keys
cd /home/ec2-user
rm /home/ec2-user/.ssh/known_hosts || echo "known_hosts not found"
echo  -e "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl\ngithub.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=\ngithub.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=" >> /home/ec2-user/.ssh/known_hosts
#Clone repo
git clone https://github.com/signalapp/Signal-TLS-Proxy.git || echo "Already cloned"
cd Signal-TLS-Proxy
git pull

if [ -d "./data/certbot" ]; then
  docker-compose up --detach
else
  ./init-certificate.sh <<< "${TLS_PROXY_DOMAIN}"
  docker-compose up --detach
fi
--//--