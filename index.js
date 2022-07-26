"use strict";

// Imports
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import compression from "compression";
import apicache from "apicache-plus";
import { fetchBuilder, MemoryCache } from "node-fetch-cache";
const fetch = fetchBuilder.withCache(
    new MemoryCache({
        ttl: 900000, // 15 minutes
    })
);
import { Headers, bag } from "fetch-headers";
import sharp from "sharp";

const app = express();
const port = process.env.PORT || 3000;
const REPL_PING = JSON.parse(process.env.REPL_PING) || false;
const REPL_URL = process.env.REPL_URL;

const headers = new Headers({ "Cache-Control": "s-maxage=900, max-age=900" });
const options = { headers: headers, cache: "force-cache" };

// Add response headers
app.use((req, res, next) => {
    res.set("Cache-control", "public, s-maxage=300, max-age=300");
    res.append("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    next();
});

// Middleware
app.use(compression());
app.use(apicache("15 minutes"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("env", "production");
app.set("json spaces", 2);

// Disable stack trace on invalid requests.
app.use(function(err, req, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        res.status(404).send({
            message: "Page Not Found",
            path: req.path,
        });
    } else next();
});

app.get("/", async(req, res) => {
    res.type("text/plain");
    return res.sendStatus(200);
});

// If /session is sent, send status of session.mojang.com.
app.get("/session/", async(req, res) => {
    const uri = "https://sessionserver.mojang.com";
    await fetch(uri, options)
        .then((response) => {
            return res.sendStatus(200);
        })
        .catch((error) => {
            res.sendStatus(502);
        });
});

// Proxy all requests to /session/minecraft/profile/ and change the texture to the proxied version.
app.get("/session/minecraft/profile/:UUID", async(req, res) => {
    const UUID = req.params.UUID;
    const unsigned = req.query.unsigned;
    let query = true;
    if (unsigned === "false") query = false;
    const uri = `https://sessionserver.mojang.com/session/minecraft/profile/${UUID}?unsigned=${query}`;

    await fetch(uri, options)
        .then((response) => response.json())
        .then((data) => {
            if ("error" in data) {
                res.status(404).json(data);
            } else {
                let encoded = data.properties[0].value;

                let decoded = Buffer.from(encoded, "base64").toString("utf8");
                let data_1 = JSON.parse(decoded);

                let image = data_1.textures.SKIN.url.replace(/^.*\/\/[^\/]+/, "");

                data_1.textures.SKIN.url = `${req.protocol}://${req.get(
          "host"
        )}${image}`;

                if ("CAPE" in data_1.textures) {
                    let image = data_1.textures.CAPE.url.replace(/^.*\/\/[^\/]+/, "");

                    data_1.textures.CAPE.url = `${req.protocol}://${req.get(
            "host"
          )}${image}`;
                }

                let string = JSON.stringify(data_1, null, 2);

                let fix = Buffer.from(string, "utf8").toString("base64");

                data.properties[0].value = fix;

                return res.json(data);
            }
        })
        .catch((error) => {
            res.status(404).json({
                path: req.path,
                errorMessage: `Not a valid UUID: ${UUID}`,
                developerMessage: `Not a valid UUID: ${UUID}`,
            });
        });
});

// If /api is sent, send status of api.mojang.com.
app.get("/api/", async(req, res) => {
    const uri = "https://api.mojang.com";
    await fetch(uri, options)
        .then((response) => {
            return res.sendStatus(200);
        })
        .catch((error) => {
            res.sendStatus(502);
        });
});

// Show incorrect method warning when attempting to load POST URI on web browser.
app.all("/api/profiles/minecraft", async(req, res) => {
    if (req.method == "POST") {
        const uri = "https://api.mojang.com/profiles/minecraft";
        await fetch(uri, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req.body),
            })
            .then((response) => response.json())
            .then((data) => {
                return res.json(data);
            })
            .catch((error) => {
                return res.send("Error POSTing");
            });
    } else {
        return res.status(405).json({
            error: "Method Not Allowed",
            errorMessage: "The method specified in the request is not allowed for the resource identified by the request URI",
            path: req.path,
        });
    }
});

// Allow post request to /api/profiles/minecraft and return the original values from Mojang's API.
// app.post("/api/profiles/minecraft", async(req, res) => {});

// Send a proxied version of api.mojang.com/users/profiles/minecraft/
app.get("/api/users/profiles/minecraft/:username", async(req, res) => {
    const user = req.params.username;
    const at = parseInt(req.query.at);
    let timestamp = null;
    if (Number.isInteger(at)) timestamp = at;
    const uri = `https://api.mojang.com/users/profiles/minecraft/${user}?at=${timestamp}}`;

    await fetch(uri, options)
        .then((response) => response.json())
        .then((data) => {
            // const html = response.data;
            if ("" in data) {
                res.sendStatus(404);
            } else {
                return res.json(data);
            }
        })
        .catch((error) => {
            res.sendStatus(404);
        });
});

// Send a proxied version of api.mojang.com/user/profiles/uuid/names.
app.get("/api/user/profiles/:UUID/names", async(req, res) => {
    const UUID = req.params.UUID;
    const uri = `https://api.mojang.com/user/profiles/${UUID}/names`;

    await fetch(uri, options)
        .then((response) => response.json())
        .then((data) => {
            // const html = response.data;
            if ("" in data) {
                res.sendStatus(404);
            } else {
                return res.json(data);
            }
        })
        .catch((error) => {
            res.sendStatus(404);
        });
});

// If /texture is sent, send status of textures.minecraft.net.
app.get("/texture/", async(req, res) => {
    const uri = "http://textures.minecraft.net";

    await fetch(uri, options)
        .then((response) => {
            return res.sendStatus(200);
        })
        .catch((error) => {
            res.sendStatus(502);
        });
});

// Send a proxied version of textures.minecraft.net/texture/.
app.get("/texture/:hashCode", async(req, res) => {
    const hashCode = req.params.hashCode;
    const uri = `http://textures.minecraft.net/texture/${hashCode}`;

    await fetch(uri, options)
        .then((response) => response.body)
        .then((response) => {
            res.type("png");
            return response.pipe(res);
        })
        .catch((error) => {
            res.type("text/plain");
            res.sendStatus(404);
        });
});

// If /of is sent, send status of s.optifine.net.
app.get("/of/", async(req, res) => {
    const uri = "http://s.optifine.net";

    await fetch(uri, options)
        .then((response) => {
            return res.sendStatus(200);
        })
        .catch((response, error) => {
            return res.sendStatus(502);
        });
});

// Ssend a proxied version of s.optifine.net/capes.
app.get("/of/capes/:username.png", async(req, res) => {
    const user = req.params.username;
    const uri = `http://s.optifine.net/capes/${user}.png`;

    await fetch(uri, options)
        .then((response) => {
            if (response.ok) {
                return response.body;
            }
            return Promise.reject(response);
        })
        .then((data) => {
            // Resize OptiFine cape to correct dimensions.
            const OFCapeResizer = sharp()
                .resize(46, 22, {
                    kernel: sharp.kernel.nearest,
                    fit: sharp.fit.contain,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                    withoutEnlargement: true,
                })
                .extend({
                    bottom: 10,
                    right: 18,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .png();
            res.type("png");
            return data.pipe(OFCapeResizer).pipe(res);
        })
        .catch((error) => {
            res.type("text/plain");
            return res.sendStatus(404);
        });
});

// 404 error
app.use(async(req, res) => {
    res.status(404).json({
        message: "Page Not Found",
        path: req.path,
    });
});

// Start Express.JS server.
const server = app.listen(port, () =>
    console.log(`Listening on port ${port}!`)
);
server.setTimeout(5000); // Timeout after 5 seconds.

// Keep server alive for atleast 12 hours
if (REPL_PING) {
    setInterval(async() => {
        await fetch(REPL_URL)
            .then(console.log("Alive!"))
            .catch((error) => {
                console.log("Alive!");
            });
    }, 240000);
}