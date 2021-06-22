const Discord = require("discord.js");
const client = new Discord.Client();
const mongoose = require("mongoose");
const handlers=require('./commands_handlers/command.handler');
require('dotenv').config();
//console.log(process.env.discordKey);
let days = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];
var today = days[new Date().getDay() - 1];
var curr_days_courses;
// I need to implement a function that waits until new reminder
async function flujo_principal() {
  var now = new Date();
  //if new day then change it
  if (now.getHours() == 0 && now.getMinutes() < 6) {
    today = days[new Date().getDay() - 1];
  }
  await mongoose
    .connect(handlers.mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      curr_days_courses = await handlers.Cursos.find({ dias: "Lunes" });
    });
  setTimeout(flujo_principal,5000);
  
}
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
        flujo_principal();
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
