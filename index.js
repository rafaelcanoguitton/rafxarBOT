const Discord = require("discord.js");
const client = new Discord.Client();
const mongoose = require("mongoose");
const handlers=require('./commands_handlers/command.handler');
require('dotenv').config();
//console.log(process.env.discordKey);

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    status: "idle",
    activity:{
      name: `on ${client.guilds.cache.size} servers! | >help | rafxarBot!`,
      type: "PLAYING"
    }
  });
  await mongoose
    .connect(handlers.mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((mongoose) => {
      try {
        console.log("Conexión correcta  a la base de datos");
      } finally {
        mongoose.connection.close();
        handlers.flujo_principal();
      }
    });
});
//List of all commands available
client.on("message", async (msg) => {
  //console.log(msg.content[0]);
  if (msg.content[0] === ">") {
    msg.content = msg.content.substring(1);
    if (msg.content === "que dia es hoy") {
      handlers.quediahandler(msg);
    }
    if (msg.content === "manoyara") {
      client.guilds.cache.forEach((guild) => {
        console.log(`${guild.name} | ${guild.id}`);
      });
    }
    if (msg.content === "help" || msg.content === "ayuda") {
      handlers.ayudahandler(msg);
    }
    if (msg.content === "comandos") {
      handlers.comandos_handler(msg);
    }
    if (msg.content == "llamalos") {
      handlers.llamaloshandler(msg);
    }
    if (msg.content === "dime los cursos disponibles") {
      handlers.dimecursoshandler(msg);
    }
    ///////////////////////////////////////////////////////
    if (msg.content === "cursos disponibles") {
      handlers.samplehandler(msg);
    }
    if (msg.content == "nuevo curso") {
      handlers.nuevohandler(msg);
    }
    if (msg.content === "inscribirme en un curso") {
      handlers.inscrihandler(msg);
    }
  }
});
//from process.env
client.login(process.env.discordKey);
