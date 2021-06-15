const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const mongoose = require("mongoose");
const { mongoPath } = require("./config.json");
//const mongo = require("./mongo");
let days = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((mongoose) => {
      try {
        console.log("Conexión correcta  a la base de datos");
      } finally {
        mongoose.connection.close();
      }
    });
});
client.on("message", (msg) => {
  if (msg.content === "que dia es hoy") {
    if (new Date().getDay() === 1) {
      let temp = "Oidia es ";
      temp += days[new Date().getDay() - 1];
      temp += " mierda";
      msg.reply(temp);
    }
  }
  if (msg.content === "manoyara") {
    client.guilds.cache.forEach((guild) => {
      console.log(`${guild.name} | ${guild.id}`);
    });
  }
  if (msg.content == "llamalos") {
    let roleid = "715256258701033534";
    msg.channel.send(
      "llamando a todos los " + "<@&" + roleid + "> perras de mierda"
    );
  }
  if (msg.content === "dime los cursos disponibles") {
    let filter = (m) => m.author.id === msg.author.id;
    msg.channel.send(`Quieres crear un rol dices: \`SI\` / \`NO\``).then(() => {
      msg.channel
        .awaitMessages(filter, {
          max: 1,
          time: 30000,
          errors: ["time"],
        })
        .then((msg) => {
          msg = msg.first();
          if (
            msg.content.toUpperCase() == "SI" ||
            msg.content.toUpperCase() == "S"
          ) {
            msg.channel.send(`Uff perra somos a ver di pinga`).then(() => {
              msg.channel
                .awaitMessages(filter, {
                  max: 1,
                  time: 30000,
                  errors: ["time"],
                })
                .then((msg) => {
                  msg = msg.first();
                  if (msg.content === "pinga") {
                    msg.channel.send("jajaja gaaaa");
                  } else {
                    msg.reply("cagon :(");
                  }
                });
            });
          } else if (
            msg.content.toUpperCase() == "NO" ||
            msg.content.toUpperCase() == "N"
          ) {
            msg.channel.send(`Okay`);
          } else {
            msg.channel.send(`Respuesta inválida`);
          }
        })
        .catch((collected) => {
          msg.channel.send("Timeout");
        });
    });
  }
  ///////////////////////////////////////////////////////
  if (msg.content === "cursos disponibles") {
    let filter = (m) => m.author.id === msg.author.id;
    msg.reply("¿A qué curso te gustaría inscribirte?");
    //QUERY ALL COURSES
  }
  if (msg.content == "nuevo curso") {
    let filter = (m) => m.author.id === msg.author.id;
    msg.reply("¿Cómo se llamará el nuevo curso?").then(() => {
      msg.channel
        .awaitMessages(filter, {
          max: 1,
          time: 30000,
          errors: ["time"],
        })
        .then((msg) => {
          msg = msg.first();
          let curso = msg.content;
          msg.reply(
            "¿Qué dias se dicta este curso?\n\npor favor escribelos de la siguiente forma:\nLunes,Martes,Miercoles..."
          );
          msg.channel
            .awaitMessages(filter, {
              max: 1,
              time: 30000,
              errors: ["time"],
            })
            .then((msg) => {
              msg = msg.first();
              let dias = msg.content;
              msg.reply(
                "¿A qué horas toca el curso? **(En el mismo orden que los días)**\n\nEn el siguiente formato:\n12:00,16:00,19:00..."
              );
              msg.channel
                .awaitMessages(filter, {
                  max: 1,
                  time: 30000,
                  errors: ["time"],
                })
                .then(async (msg) => {
                  msg = msg.first();
                  let horarios = msg.content;
                  console.log(curso);
                  console.log(dias);
                  console.log(horarios);
                  await mongoose
                    .connect(mongoPath, {
                      useNewUrlParser: true,
                      useUnifiedTopology: true,
                    })
                    .then(() => {
                      try {
                        const Cursos = mongoose.model("cursos", {
                          nombre: String,
                          dias: String,
                          horas: String,
                        });
                        const nuevocurso = new Cursos({
                          nombre: curso,
                          dias: dias,
                          horas: horarios,
                        });
                        nuevocurso.save().then(() =>  mongoose.connection.close());
                      } finally {
                       ;
                      }
                    });
                  msg.guild.roles
                    .create({
                      data: {
                        name: curso,
                      },
                      reason: "Welp. Having reminders for this course I guess",
                    })
                    .then(console.log.id)
                    .catch(console.error);
                  msg.reply("Curso ha sido creado correctamente");
                })
                .catch((collected) => {
                  msg.channel.send("Se acabó el tiempo");
                  console.log(collected);
                });
            })
            .catch((collected) => {
              msg.channel.send("Se acabó el tiempo");
              console.log(collected);
            });
        })
        .catch((collected) => {
          msg.channel.send("Se acabó el tiempo");
          console.log(collected);
        });
    });
  }
  if (msg.content === "inscribirme en un curso") {
    //QUERY ALL COURSES
  }
});
client.login("get your own key bb");