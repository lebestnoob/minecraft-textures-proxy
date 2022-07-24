# Minecraft Textures Proxy

A node server built to proxy Minecraft skins and capes.

### Setup:

`git clone https://github.com/lebestnoob/minecraft-textures-proxy`

`cd minecraft-textures-proxy`

`npm install`

`npm start` or `node server.js`

### Usage:

**Every request is cached for **15** minutes to minimize rate-limiting.**

#### Session Server:

Method GET: `/session/minecraft/profile/{UUID}`

#### Texture Server:

Method GET: `/texture/{hashCode}`

#### Mojang API:

Method GET: `/api/users/profiles/minecraft/{USERNAME}`

Method POST: `/api/profiles/minecraft`

#### OptiFine Cape:

##### The server automatically resizes capes to a 64x32 resolution.

Method GET: `/of/capes/{USERNAME}.png`

### Public Instance:

https://minecraft-textures-proxy.lebestnoob.repl.co

### Limitations:

- OptiFine Special Cosmetics are not proxied
