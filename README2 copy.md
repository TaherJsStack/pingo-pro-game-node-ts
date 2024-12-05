server {
    listen 80;
    listen [::]:80;
    server_name pingo-pro-game pingo-pro-game.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name pingo-pro-game pingo-pro-game.com;

    ssl_certificate /etc/letsencrypt/live/pingo-pro-game.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pingo-pro-game.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # System view route
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API route
    location /api/ {
        proxy_pass http://localhost:4001;  # Adjust the backend API server address
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Additional security headers (optional)
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
}


<!-- -------------------------------------------------------------------------------------------------------------------- -->

server {
    listen 80;
    listen [::]:80;
    server_name pingo-pro-game.com www.pingo-pro-game.com;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name pingo-pro-game.com www.pingo-pro-game.com;

    ssl_certificate /etc/letsencrypt/live/pingo-pro-game.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pingo-pro-game.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/pingo-pro-game.com/html;
    index index.html index.htm;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

   location /api {
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}

npm run dev