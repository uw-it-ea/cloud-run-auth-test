# Test google cloud run with authentication


Test the app here https://uwit-ea-gcp-poc.firebaseapp.com


## Test api deploy 

This will deploy a cloud run service.
At the time of writing, it was still a beta service that needed to be activated in the gcloud cli

To do so, run 

```
gcloud components install beta
```

Commands should be ran in the `my-test-api` folder 

``` 
cd my-test-api
```

### Build the app on gcloud using 

``` 
 gcloud builds submit --tag gcr.io/uwit-ea-gcp-poc/my-test-api
```

### deploy the app as a cloud run service 

```
gcloud beta run deploy my-test-api --image gcr.io/uwit-ea-gcp-poc/my-test-api --region=us-central1 --memory=256Mi --set-env-vars=CLIENT_ID=${CLIENT_ID},CONTEXT=/my-test-api
```


Add the url to the function to the authorized Javascript origins of the Oauth consent screen : https://console.cloud.google.com/apis/credentials/oauthclient/

### Configure who can authenticate against the service 

in https://console.cloud.google.com/run?project=uwit-ea-gcp-poc , select the my-test-api service, in the right column, add the `Cloud Run Invoker` role to the members/group tha sould have access to the service 


## Firebase deploy

This will require the firebase cli. To install it, run 

```
npm install -g firebase-tools
```

Commands should be ran in the `my-website` folder 

``` 
cd my-website
```

### Update `my-test-api/public/index.html` with the correct client id 
```
<meta name="google-signin-client_id"
    content="68060519968-afeikidnpf26qqu8808pc26t6g6g9ek4.apps.googleusercontent.com">
``` 

### deploy 

```
firebase deploy
```



## Configure Oauth 

### Consent screen 

Add the firebase domain and the cloud run function domain to the list of authorized domains in the oauth consent screen for your project : https://console.cloud.google.com/apis/credentials/consent 

The `email`, `profile` and `openid` scopes should be selected


### Client Id

Create a new Oauth Client Id   https://console.cloud.google.com/apis/credentials/consent 

The javascript origin should be the firebase base url

