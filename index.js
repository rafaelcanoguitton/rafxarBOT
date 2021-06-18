const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const mongoose = require("mongoose");
const { mongoPath } = require("./config.json");
const { isModuleNamespaceObject } = require("util/types");
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
const Cursos = mongoose.model("cursos", {
  nombre: String,
  dias: [String],
  horas: [String],
});
function separacomas(a) {
  var arraystring = [];
  var placeholderstring = "";
  var iter = 0;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != ",") placeholderstring += a[i];
    else {
      arraystring[iter] = placeholderstring;
      iter++;
      placeholderstring = "";
    }
  }
  arraystring[iter] = placeholderstring;
  return arraystring;
}
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
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      curr_days_courses = await Cursos.find({ dias: "Lunes" });
    });
  setTimeout(flujo_principal,5000);
  
}
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
        console.log("Hoy es " + today);
        flujo_principal();
        console.log('imout');
      }
    });
});
client.on("message", async (msg) => {
  //console.log(msg.content[0]);
  if (msg.content[0] === ">") {
    msg.content = msg.content.substring(1);
    if (msg.content === "que dia es hoy") {
      //if (new Date().getDay() === 1) {
      let temp = "Oidia es ";
      temp += days[new Date().getDay() - 1];
      temp += " mierda";
      msg.reply(temp);
      //}
    }
    if (msg.content === "manoyara") {
      client.guilds.cache.forEach((guild) => {
        console.log(`${guild.name} | ${guild.id}`);
      });
    }
    if (msg.content === "help" || msg.content === "ayuda") {
      msg.channel.send(
        "¡Hola! Me llamo rafxarBOT! Soy un bot de propósito general. Por el momento puedo recordarte el horario de tus cursos y mandarte sus enlaces de google meet cuando te toquen :D. Para saber que comandos puedes usar usa el comando: \n **>comandos**"
      );
    }
    if (msg.content === "comandos") {
      const embed = new Discord.MessageEmbed()
        .setColor("#d92701")
        .setTitle("Comandos")
        .setDescription(
          'A continuación los comandos que puedo realizar.\n Todos los comandos usan el prefijo ">"'
        )
        .addField(
          "__Comandos disponibles en Grillby's__",
          "\n**help o ayuda**: Para obtener información acerca del bot.\n**comandos**: Da una lista de comandos disponibles.\n**que dia es hoy**: Te dice que día es hoy...\n**dime los cursos disponibles**: Da una lista de los cursos disponibles\n**inscribirme en un curso**: Te inscribe en un curso ya existente\n**nuevo curso**: Sirve para crear un nuevo curso con su rol respectivo"
        )
        .setFooter("Comandos rafxarBOT");
      msg.channel.send(embed);
    }
    if (msg.content == "llamalos") {
      let roleid = "715256258701033534";
      msg.channel.send(
        "llamando a todos los " + "<@&" + roleid + "> perras de mierda"
      );
    }
    if (msg.content === "dime los cursos disponibles") {
      let filter = (m) => m.author.id === msg.author.id;
      msg.channel
        .send(`Quieres crear un rol dices: \`SI\` / \`NO\``)
        .then(() => {
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
                    console.log("Separando");
                    let diad = separacomas(dias);
                    let horariosd = separacomas(horarios);
                    console.log(diad);
                    console.log(horariosd);
                    await mongoose
                      .connect(mongoPath, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                      })
                      .then(() => {
                        try {
                          const nuevocurso = new Cursos({
                            nombre: curso,
                            dias: diad,
                            horas: horariosd,
                          });
                          nuevocurso
                            .save()
                            .then(() => mongoose.connection.close());
                        } finally {
                        }
                      });
                    msg.guild.roles
                      .create({
                        data: {
                          name: curso,
                        },
                        reason:
                          "Welp. Having reminders for this course I guess",
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
      await mongoose
        .connect(mongoPath, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(async () => {
          try {
            const all = await Cursos.find();
            var mensaje = "";

            all.forEach((element) => {
              mensaje +=
                "El curso: **" +
                element.nombre +
                "**\n" +
                "\t" +
                "\t" +
                "En los días: **" +
                element.dias +
                "**\n" +
                "\t" +
                "\t" +
                "A estas horas: **" +
                element.horas +
                "**\n" +
                "\n";
            });
            //console.log(mensaje);
            msg.channel.send(mensaje);
          } finally {
          }
        });
    }
  }
});
client.login("get your own brotha");
