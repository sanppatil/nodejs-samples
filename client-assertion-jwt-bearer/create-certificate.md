
# Command to create Certificate

```bash
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.pem -sha256 -days 3650 -nodes -subj "/C=US/ST=NJ/L=Edison/O=Enodation/OU=IT/CN=enodation.org"
```

# Command to decode certificate

```bash
openssl x509 -in certificate.pem -text -noout
```

# Command to get SHA-1 certificate fingerprint

```bash
openssl x509 -noout -fingerprint -sha1 -inform pem -in certificate.pem
```

# Command to get SHA-256 certificate fingerprint

```bash
openssl x509 -noout -fingerprint -sha256 -inform pem -in certificate.pem
```


# Command to get MD5 certificate fingerprint

```bash
openssl x509 -noout -fingerprint -md5 -inform pem -in certificate.pem
```

# Reference website to decode certificate
```markdown
https://www.sslchecker.com/certdecoder
```
