const Discord = require("discord.js");
const client = new Discord.Client();
const mongoose = require("mongoose");
const handlers = require("./commands_handlers/command.handler");
require("dotenv").config();

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    status: "idle",
    activity: {
      name: `on ${client.guilds.cache.size} servers! | >help | rafxarBot!`,
      type: "PLAYING",
    },
  });
  const mongo=await mongoose
    .connect(handlers.mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
  console.log("Conexión correcta  a la base de datos");
  mongo.connection.close();
  handlers.flujo_principal(client);
  handlers.sub_queries(client);
});
//List of all commands available
client.on("message", async (msg) => {
  //console.log(msg.content[0]);
  if (msg.content[0] === ">") {
    msg.content = msg.content.substring(1);
    switch (msg.content) {
      //Untouchable legacy
      case "que dia es hoy":
        handlers.quediahandler(msg);
        break;
      case "help" || "ayuda":
        handlers.ayudahandler(msg);
        break;
      case "comandos":
        handlers.comandos_handler(msg);
        break;
      case "nuevo curso":
        handlers.nuevohandler(msg);
        break;
      case "inscribirme":
        handlers.inscrihandler(msg);
        break;
      case "fijar canal":
        handlers.fijar_canalHandler(msg);
        break;
      case "fijar sr":
        handlers.fijarsrhandler(msg);
        break;
      case "nuevo sr":
        handlers.nuevosrhandler(msg);
        break;
      case "que sr":
        handlers.que_srhandler(msg);
        break;
      case "borrar sr":
        handlers.borr_srhandler(msg);
        break;
      case "caratula":
        handlers.caratulahandler(msg);
        break;
    }
  }
});
//from process.env
client.login(process.env.discordKey);