Step 1
Push your angular app to a GitHub repository.

Step 2
Now, add the angular-cli-ghpages package to your project by using below command.

`ng add angular-cli-ghpages`

Step 3
Run the following command by replacing with your-projectfolder name and your-repositoryname to successfully deploy your app to GitHub pages.

`ng run your-projectfolder-name:deploy --base-href=/your-repositoryname/`

 ng run NG-CRM:deploy --base-href=/NG-CRM/
 ng build --prod --base-href "/NG-CRM/"

 ng run practical-assessment:deploy --base-href=/PracticalAssessment/


1- git branch gh-pages

2- git checkout gh-pages

3- git push -u origin gh-pages

4- ng add angular-cli-ghpages

5- ng deploy --base-href=https://TaherJsStack.github.io/NG-CRM-DEPLOY/


curl http://localhost:4001
curl -v https://pingo-pro-game.com
cd var/www/pingo-pro-game/nodejs/

sudo systemctl restart nginx
sudo nginx -t
cd /etc/nginx/sites-available

Create a symbolic link to the sites-enabled directory:
sudo ln -s /etc/nginx/sites-available/pingo-pro-game.com /etc/nginx/sites-enabled/

Test Nginx Configuration:
sudo nginx -t

If the test is successful, reload Nginx:
sudo systemctl reload nginx


pm2 start app.js
pm2 start dist/server/server.mjs


mongorestore --db PINGO --dir /var/www/pingo-pro-game/PINGO
mongosh
show collections
db.addresses.find().pretty()



sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt
sudo certbot --nginx -d pingo-pro-game.com -d www.pingo-pro-game.com


http://pingo-pro-game.com/

http://2.58.80.7/8000

\


الاحد + اربع الساعة 8:10 pm
start in 30-6-2024
call : 01203599998



