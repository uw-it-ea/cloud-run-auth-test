'use strict';

const tracer = require('@google-cloud/trace-agent').start();
const Firestore = require('@google-cloud/firestore');
const express = require('express');

// Constants
const PORT = process.env.PORT || 8080;
const CONTEXT = process.env.CONTEXT || "/";
const HOST = '0.0.0.0';

const CLIENT_ID = process.env.CLIENT_ID
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();

async function verify(token) {
  console.log('verify');
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
  });
  console.log('ticket : ' + ticket);
  const payload = ticket.getPayload();

  console.log('payload : ' + payload);

  const userid = payload['sub'];

  return payload;
}


// App
const app = express();
const router = express.Router();


router.get('/', async (req, res) => {
  const authSpan = tracer.createChildSpan({ name: 'validate-auth' });
  const authorization = req.headers["authorization"];
  if (!authorization) {
    res.type('application/json')
    res.send(JSON.stringify({
      error: 'no authentication header'
    }));
    return;
  }

  const items = authorization.split(/[ ]+/);

  let token;
  if (items.length == 2 && items[0].trim() == "Bearer") {
    token = items[1];
    console.log(token);
    // verify token
  } else {
    res.type('application/json')
    res.send(JSON.stringify({
      error: 'not a valid token'
    }));
    return;
  }

  try {
    const authToken = await verify(token);
    authSpan.endSpan();
    console.log('valid user token : ' + JSON.stringify(authToken));
    const userInfo = {
      name: authToken.name,
      email: authToken.email,
      picture: authToken.picture,
    }

    const firestore = new Firestore();

    const document = firestore.collection('my-test-api').doc(authToken.email);
    console.log('Document created');
    await document.set({
      email: authToken.email,
      lastLogin: Firestore.Timestamp.fromDate(new Date()),
    },{merge: true});

    await document.update({
      access_count: Firestore.FieldValue.increment(1)
    });


    res.type('application/json')
    res.send(JSON.stringify(userInfo));
    return;
  }
  catch (error) {
    authSpan.endSpan();
    console.error(error);

    res.type('application/json')
    res.send(JSON.stringify({
      error: error
    }));
    return;
  }


});

app.use(CONTEXT, router);
const server = app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}${CONTEXT}`);

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};
// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  console.log("shutdown!");
  server.close(() => {
    console.log(`server stopped by ${signal} with value ${value}`);
    process.exit(128 + value);
  });
};
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});