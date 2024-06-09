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
cd var/www/pingo-pro-game/nodejs/

sudo systemctl restart nginx
sudo nginx -t
 cd /etc/nginx/sites-available


pm2 start app.js
pm2 start dist/server/server.mjs




mongorestore --db PINGO --dir /var/www/pingo-pro-game/PINGO
mongosh
show collections
db.addresses.find().pretty()
