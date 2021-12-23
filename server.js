"use strict";

import express from "express";
import axios from "axios";
import sharp from "sharp";
const app = express();
const port = 3000;

// Add headers: disable caching and other methods
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.append("Cache-Control", "no-store");
  res.append("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  next();
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("env", "production");
app.set("json spaces", 2);

// Disable stack trace on invalid POST.
app.use(function (err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res
      .status(404)
      .send({
        error: "Not Found",
        errorMessage:
          "The server has not found anything matching the request URI",
      });
  } else next();
});

// If /session/minecraft/profile is just sent, send a 404 error.
app.get("/session/minecraft/profile/", async (req, res) => {
  res.status(404).json({
    message: "Page Not Found",
    _links: {
      self: {
        href: req.path,
        templated: false,
      },
    },
    _embedded: {},
  });
});

// Proxy all requests to /session/minecraft/profile/ and change the texture to a proxied version.
app.get("/session/minecraft/profile/*", async (req, res) => {
  const uri = `https://sessionserver.mojang.com${req.path}`;

  axios
    .get(uri)
    .then((response) => {
      const data = response.data;
      if ("error" in data) {
        res.status(404).json(data);
      } else {
        let encoded = data.properties[0].value;

        let decoded = Buffer.from(encoded, "base64").toString("utf8");
        let data_1 = JSON.parse(decoded);

        let image = data_1.textures.SKIN.url.replace(/^.*\/\/[^\/]+/, "");

        data_1.textures.SKIN.url = `${req.protocol}://${req.get(
          "host"
        )}/textures${image}`;

        if ("CAPE" in data_1.textures) {
          let image = data_1.textures.CAPE.url.replace(/^.*\/\/[^\/]+/, "");

          data_1.textures.CAPE.url = `${req.protocol}://${req.get(
            "host"
          )}/textures${image}`;
        }

        let string = JSON.stringify(data_1, null, 2);

        let fix = Buffer.from(string, "utf8").toString("base64");

        data.properties[0].value = fix;

        return res.json(data);
      }
    })
    .catch((error) => {
      res.status(404).json({
        error: "Bad Request",
        path: req.path,
      });
    });
});

// If an invalid /session path is sent, send Unauthorized error message.
app.get("/session/*", async (req, res) => {
  res.sendStatus(401);
});

// Show inccorrect method warning when attempting to load POST URI on web browser.
app.get(
  ["/api/profiles/minecraft", "/api/orders/statistics"],
  async (req, res) => {
    res
      .status(404)
      .json({
        error: "Method Not Allowed",
        errorMessage:
          "The method specified in the request is not allowed for the resource identified by the request URI",
      });
  }
);

// Allow post request to /api/profiles/minecraft and return the original values from Mojang's API.
app.post("/api/profiles/minecraft", (req, res) => {
  axios
    .post("https://api.mojang.com/profiles/minecraft", req.body)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      res.send("Error POSTing " + error);
    });
});

// Allow post request to /api/orders/statistics and return the original values from Mojang's API.
app.post("/api/orders/statistics", (req, res) => {
  axios
    .post("https://api.mojang.com/orders/statistics", req.body)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      res.send("Error POSTing " + error);
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

// If anything in /api/ is sent, send a proxied version of api.mojang.com.
app.get("/api/*", async (req, res) => {
  axios
    .get(`https://api.mojang.com${req.path.replace("/api", "")}`)
    .then((response) => {
      const html = response.data;
      if ("" in html) {
        res.status(404).json(data);
      } else {
        return res.json(html);
      }
    })
    .catch((error) => {
      res.sendStatus(404);
    });
});

// If /textures is sent, send status of textures.minecraft.net.
app.get("/textures/", async (req, res) => {
  axios
    .get("http://textures.minecraft.net")
    .then((response) => {
      return res.sendStatus(200);
    })
    .catch((error) => {
      res.sendStatus(502);
    });
});

// If anything in /textures/ is sent, send a proxied version of textures.minecraft.net.
app.get("/textures/*", async (req, res) => {
  axios
    .get(`http://textures.minecraft.net${req.path.replace("/textures", "")}`, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      res.append("Content-Type", "image/png");
      return res.send(Buffer.from(response.data));
    })
    .catch((error) => {
      res.append("Content-Type", "text/plain");
      res.sendStatus(404);
    });
});

// If /of is sent, send status of s.optifine.net.
app.get("/of/", async (req, res) => {
  axios
    .get("http://s.optifine.net")
    .then((response) => {
      return res.sendStatus(200);
    })
    .catch((response, error) => {
      return res.sendStatus(502);
    });
});

// If anything in /of/ is sent, send a proxied version of s.optifine.net.
app.get("/of/*", async (req, res) => {
  axios
    .get(`http://s.optifine.net${req.path.replace("/of", "")}`, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      // Resize Optifine cape to correct dimmensions.
      sharp(Buffer.from(response.data))
        .resize(64, 32, {
          withoutEnlargement: true,
        })
        .extend({
          bottom: 10,
          right: 18,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
        .then((data) => res.type("png").send(data));
    })
    .catch((error) => {
      res.append("Content-Type", "text/plain");
      res.sendStatus(404);
    });
});

// Proxy all root url requests to Mojang's session server.
app.get("/", async (req, res) => {
  res.append("Content-Type", "text/plain");
  res.sendStatus(200);
});

// Proxy all root url requests to Mojang's session server.
app.get("/*", async (req, res) => {
  res.append("Content-Type", "text/plain");
  axios
    .get(`https://sessionserver.mojang.com${req.path}`)
    .then((response) => {
      const html = response.data;
      return res.send(html);
    })
    .catch((error) => {
      res.sendStatus(404);
    });
});

// Start Express.JS server.
app.listen(port, function () {
  console.log(`Listening on port ${port}!`);
});

// Keep server alive for atleast 12 hours
setInterval(async () => {
  await axios
    .get(
      "https://test.lebestnoob.repl.co/" // Change this to your project url if using Repl.it, Glitch.me, or a similar service to keep it online.
    )
    .then(console.log("Alive!"))
    .catch((error) => {
      console.log("Alive!");
    });
}, 240000);
