import { Hono } from "hono";
import { timeout } from 'hono/timeout';
import { cache } from 'hono/cache';

import { Jimp } from "jimp";
import { isUUID } from "validator";

const app = new Hono();

// Middleware
app.use(timeout(5000),
  cache({
    cacheName: 'mc-textures-proxy',
    cacheControl: 'max-age=3600',
  }))

app.get("/", async(c) => c.json({
        message: "Ok",
        path: c.req.path,
    }));


app.get("/:user", async(c) => {
    let {user} = c.req.param();
    const {prefix} = c.req.query();

    let isGeyser, uuid, textureURL, imageData;
    let type = c.req.query("type") ? c.req.query("type").toUpperCase() : "SKIN";

    if(type === "OPTIFINE" || type === "OF"){
        await fetch(`http://s.optifine.net/capes/${user}.png`).then((res) => res.arrayBuffer()).then(async (data)=>{
            const image = await Jimp.fromBuffer(data);
            const padding = new Jimp({width: 64, height: 32});
            padding.composite(image);

            textureURL = await padding.getBase64("image/png");
        });
    }
    
    if(!textureURL) {
        if(!Number.isNaN(Number(user)) && user.length === 16) isGeyser = true; // XUID
    
        if(prefix) {
            user.replace(prefix,"");
            isGeyser = true;
        }
        
        if(user.startsWith(".") || user.startsWith("*")) {
            isGeyser = true;
            user = user.substring(1);
        }
        
        if(isUUID(user, "loose")) {
            uuid = user;
            if(uuid.startsWith("00000000-0000-0000"))
                isGeyser = true;
        }   

        if(!uuid && !isGeyser){
            await fetch(`https://api.mojang.com/users/profiles/minecraft/${user}`).then((res) => res.json())
                .then((data) => {
                    if("errorMessage" in data && data.errorMessage.includes("Couldn't find any profile with name")) throw Error();
                    uuid = data.id
                }).catch(()=> isGeyser=true); // assume failure means username is bedrock player
        }
            
        if(!isGeyser){
            let texturesArray;
            await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid.replaceAll("-","")}`).then((res)=>res.json())
            .then((data)=>{
                let value = Uint8Array.fromBase64(data.properties[0].value);
                const textures = JSON.parse(new TextDecoder().decode(value));
                
                texturesArray = {...textures.textures};
            });
            
            textureURL = texturesArray[type].url; 
        } else if(Number.isNaN(Number(user)) && !uuid) {
            await fetch(`https://mcprofile.io/api/v1/bedrock/gamertag/${user}`).then((res)=>res.json())
            .then((data)=>{
                textureURL = data.skin;
            })
        } else if(Number.isNaN(Number(user))){ // assume fuid
            await fetch(`https://mcprofile.io/api/v1/bedrock/fuid/${user}`).then((res)=>res.json())
            .then((data)=>{
                textureURL = data.skin;
            })
        } 
        else {
            await fetch(`https://mcprofile.io/api/v1/bedrock/xuid/${user}`).then((res)=>res.json())
            .then((data)=>{
                textureURL = data.skin;
            })
        }
    }
    
    imageData = await fetch(textureURL).then((res)=>res.body);
    return c.body(imageData);

})

// 404 error
app.notFound(async(c) => c.json({
        message: "Page not found.",
        path: c.req.path,
    })
);

export default app;