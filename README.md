# Mojang API Proxy
## A node app built to proxy request to Mojang's session server and API.

### Usage:

The proxied version this provides shows the same results Mojang gives, with the exception of the session server. If you are retriving a skin from there, the texture URI will automatically be proxied too. 

To access the sessionserver, send all requests to the root url, `domain.tld/{ANYTHING}`. For example, to obtain a players skin, the URI syntax would be  `domain.tld/session/minecraft/profile/{UUID}`. To retrieve Notch's skin, the URI would be  `domain.tld/session/minecraft/profile/069a79f444e94726a5befca90e38aaf5`. For more information on how to use the sessionserver, visit https://wiki.vg/Mojang_API.

To access the Mojang API, prefix the URI with `/api/`. To get the UUID from a username, the URI would be `domain.tld/api/users/profiles/minecraft/{USERNAME}`. The response will be exactly the same as the one Mojang's API serves. This also allows POST requests via `https://domain.tld/profiles/minecraft`. For more information about the synatx of the Mojang API, visit https://wiki.vg/Mojang_API. Attempting to use this for authentication will not work. 

This also has support for OptiFine's cape server and it automatically resizes the image to the standard 64x32 cape. To use it, prefix the URI with `/of/`. The URI would look like `https://domain.tld/of/{ANYTHING}`. To get a players OptiFine cape, load the URI like this `https://domain.tld/of/capes/{PROFILE}.png`. Notch's OptiFine cape would be `https://domain.tld/of/capes/NOTCH.png`.

### Public Instance:

#### Session Server:

https://test.lebestnoob.repl.co

Get skin and cape, if the profile has one:
https://test.lebestnoob.repl.co/session/minecraft/profile/{UUID}

#### Mojang API:

GET: 
https://test.lebestnoob.repl.co/api/users/minecraft/profile/{USERNAME}

POST: 

https://test.lebestnoob.repl.co/api/minecraft/profile

#### OptiFine Cape:

https://test.lebestnoob.repl.co/of/capes/{USERNAME}.png

### Limitations:
* Unable to show skin signature. 
* Authentication will not work. I am not planning to implement this becuase it could lead to security issues and Mojang authentication will soon be phased out for the more secure Microsoft authentication.
* Respsonse is slower than Mojang's own servers.
* May be ratelimited as the request goes through your server.
