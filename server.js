import fetch from "node-fetch";
import express from "express";
import axios from "axios";
const app = express();
const port = 3000;

"use strict";

// Disable caching on Express.JS.
app.use((req, res, next) => {
  res.append("Cache-Control", "no-store");
  next();
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("env", "production");

// Disable stack trace on invalid POST.
app.use(function(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.status(404).send({ error: "Not Found", errorMessage: "The server has not found anything matching the request URI" });
  } else next();
});

// If an empty /session/minecraft/profile path is sent, send a 404 page, like the regular Mojang sessionserver.
app.get("/session/minecraft/profile/", async (req, res) => {
  res.status(404).json({
  "message" : "Page Not Found",
  "_links" : {
    "self" : {
      "href" : req.path,
      "templated" : false
    }
  },
  "_embedded" : { }
});
});

// Proxy all requests to /session/minecraft/profile/ and change the texture to a base64 value.
app.get("/session/minecraft/profile/*", async (req, res) => {
  const uri = "https://sessionserver.mojang.com" + req.path;

  const response = await fetch(uri, {
    method: "GET",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  if ("error" in data) {
    res.status(404).json(data);
  } else {
    let encoded = data.properties[0].value;

    let decoded = Buffer.from(encoded, "base64").toString("utf8");
    let data_1 = JSON.parse(decoded);

    let image = await axios.get(data_1.textures.SKIN.url, {
      responseType: "arraybuffer",
    });
    let returnedB64Skin =
      "data:image/png;base64," + Buffer.from(image.data).toString("base64");

    data_1.textures.SKIN.url = returnedB64Skin;

    if ("CAPE" in data_1.textures) {
      let image = await axios.get(data_1.textures.CAPE.url, {
        responseType: "arraybuffer",
      });
      let returnedB64Cape =
        "data:image/png;base64," + Buffer.from(image.data).toString("base64");
      data_1.textures.CAPE.url = returnedB64Cape;
    }

    let string = JSON.stringify(data_1);

    let fix = Buffer.from(string, "utf8").toString("base64");

    data.properties[0].value = fix;

    return res.json(data);
  }
});

// If an invalid /session/* path is sent, send Unauthorized error status, like the regular Mojang sessionserver.
app.get("/session/*", async (req, res) => {
  res.sendStatus(401);
});

// Show inccorrect method warning when attempting to load POST URI on web browser.
app.get(['/api/profiles/minecraft', '/api/orders/statistics'], async (req, res) => {
  res.status(404).json({error: "Method Not Allowed",errorMessage: "The method specified in the request is not allowed for the resource identified by the request URI"});
});

// Allow post request to /api/profiles/minecraft and return the original values from Mojang's API.
app.post('/api/profiles/minecraft', (req, res) => {
axios.post("https://api.mojang.com/profiles/minecraft", 
    req.body
  )
  .then(function (response) {
    res.send(response.data);
  })
  .catch(function (error) {
    res.send("Error POSTing " + error);
  });
});

// Allow post request to /api/orders/statistics and return the original values from Mojang's API.
app.post('/api/orders/statistics', (req, res) => {
axios.post("https://api.mojang.com/orders/statistics", 
    req.body
  )
  .then(function (response) {
    res.send(response.data);
  })
  .catch(function (error) {
    res.send("Error POSTing " + error);
  });
});

// If anything /api/ is sent, send a proxied version of api.mojang.com.
app.get("/api/*", async (req, res) => {
  axios
    .get("https://api.mojang.com" + req.path.replace("/api", ""))
    .then((response) => {
      const html = response.data;
      return res.json(html);
    })
    .catch((error) => {
      res.sendStatus(404);
    });
});

// If /api is sent, send status of api.mojang.com.
app.get("/api/", async (req, res) => {
  axios
    .get("https://api.mojang.com")
    .then((response) => {
      return res.sendStatus(200);
    })
    .catch((error) => {
      res.sendStatus(502);
    });
});

// Proxy all root url requests to Mojang's session server.
app.get("/*", async (req, res) => {
  res.append("Content-Type", "text/plain");
  axios
    .get("https://sessionserver.mojang.com" + req.path)
    .then((response) => {
      const html = response.data;
      return res.send(html);
    })
    .catch((error) => {
      res.sendStatus(404);
    });
});

// Expose Express.JS server.
app.listen(port, function () {
  console.log(`Listening on port ${port}!`);
});

setInterval(async () => {
  await fetch(
    "https://test.lebestnoob.repl.co/" // Change this to your project url if using Replit, Glitch.me, or a similar service to keep it online.
  ).then(console.log("Alive!"));
}, 240000);