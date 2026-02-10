# Minecraft Textures Proxy

Easily download Minecraft (Java and Bedrock) skins 

### Setup:

`git clone https://github.com/lebestnoob/minecraft-textures-proxy`

`cd minecraft-textures-proxy`

`npm install`

`wrangler dev`

### Usage:

**Every request is cached for **15** minutes to minimize rate-limiting.**

The API accepts both usernames, UUID, XUID, and FUID. All requests must be sent as GET as a location:
ie: `minecraft-textures-proxy.lebestnoob.workers.dev.com/jeb_`

If a Java player is unable to be found, the API assumes the user is a Bedrock player.

If a username starts with `.` or `*`, the API assumes the player is from Bedrock.

The API optionally accepts the following queries (case insensitive):
* `type=SKIN` (Default)
* `type=CAPE`
* `type=OF` OR `type=OPTIFINE` (OptiFine cape)
* `prefix=ANYTHING` (optional, forces a GeyserMC lookup with a custom prefix)

