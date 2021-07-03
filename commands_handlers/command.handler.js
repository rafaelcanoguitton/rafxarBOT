//Functions and db models
require("dotenv").config();
const mongoose = require("mongoose");
const mongoPath = process.env.mongoPath;
const Discord = require("discord.js");
const { parse } = require("dotenv");
/** Course reminder db schema
 */
const Cursos = mongoose.model("cursos", {
  dia: Number,
  hora: Number,
  minuto: Number,
  nombre: String,
  server: String,
  rol: String,
  enlace: String,
});
/** Channel to send reminder messages
 */
const canalFijado = mongoose.model("canalfijado", {
  id_sv: String,
  id_canal: String,
});
/**
 * This is simply an array to parse
 * string written days to indexes
 */
let days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];
/**
 * This function queries the database with current day hour and minute on
 * mongoDB database, these having 1 normal index and other with
 * a multi-index so it's at least a bit optimized.
 * I think this is a proper solution
 * @param {Discord.client} client discord client so that it can send message to role of specific channel
 */
async function flujo_principal(client) {
  var curr_days_courses;
  var now = new Date(); //Getting system date
  utc = now.getTime() + now.getTimezoneOffset() * 60000; //Converting time to miliseconds
  nd = new Date(utc + 3600000 * "-5"); //Using Peru offset, could change depending if I deploy on multiple servers
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      curr_days_courses = await Cursos.find({
        dia: nd.getDay(),
        hora: nd.getHours(),
        minuto: nd.getMinutes(),
      });
    });
  curr_days_courses.forEach((element) => {
    // console.log(element.nombre);
    // console.log(
    //   client.channels.cache.get(element.canal.substring(2).slice(0, -1))
    // );
    client.channels.cache
      .get(element.canal.substring(2).slice(0, -1))
      .send("Gente de " + element.rol + " tienen clases!.");
    client.channels.cache
      .get(element.canal.substring(2).slice(0, -1))
      .send("Su enlace es el siguiente: " + element.enlace);
  });
  var time_for_timeout = 60000 - new Date().getSeconds() * 1000;
  setTimeout(flujo_principal.bind(null, client), time_for_timeout); //Passing Client here is really important, I literally spent a while debugging this
} //I also learned that you need to use bind if not it doesn't work
function separacomas(a) {
  var arraystring = [];
  var placeholderstring = "";
  for (var i = 0; i < a.length; i++) {
    if (a[i] != ",") placeholderstring += a[i];
    else {
      arraystring.push(placeholderstring);
      placeholderstring = "";
    }
  }
  arraystring.push(placeholderstring);
  return arraystring;
}
function separapuntos(a) {
  var placeholderstring = "";
  var intstring = [];
  for (var i = 0; i < a.length; i++) {
    if (a[i] != ":") placeholderstring += a[i];
    else {
      intstring.push(parseInt(placeholderstring));
      placeholderstring = "";
    }
  }
  intstring.push(parseInt(placeholderstring));
  return intstring;
}
//Actual handlers
function samplehandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  msg.reply("¿A qué curso te gustaría inscribirte?");
}
async function nuevohandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      Cursos.exists({ name: "Rambo" }, function (err, result) {
        if (err) {
          msg.reply(
            "Por favor, primero fija un canal para mandar los recordatorios." +
              "/n" +
              "¡Puedes hacerlo con el comando **>fijar canal!**"
          );
        } else {
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
                        let diad = separacomas(dias);
                        let horariosd = separacomas(horarios);
                        if (diad.length > horariosd.length) {
                          msg.reply("Pusiste más días que horarios");
                        }
                        if (diad.length < horariosd.length) {
                          msg.reply("Pusiste más horarios que días");
                        }
                        if (diad.length == horariosd.length) {
                          msg.reply("¿Cual es el enlace de la reunión?");
                          msg.channel
                            .awaitMessages(filter, {
                              max: 1,
                              time: 30000,
                              errors: ["time"],
                            })
                            .then(async (msg) => {
                              msg = msg.first();
                              let enlace = msg.content;
                              await mongoose
                                .connect(mongoPath, {
                                  useNewUrlParser: true,
                                  useUnifiedTopology: true,
                                })
                                .then(async () => {
                                  try {
                                    var roleid;
                                    await msg.guild.roles
                                      .create({
                                        data: {
                                          name: curso,
                                        },
                                        reason:
                                          "Welp. Having reminders for this course I guess",
                                      })
                                      .then((role) => (roleid = role))
                                      .catch(console.error);
                                    for (var i = 0; i < diad.length; i++) {
                                      var horas = separapuntos(horariosd[i]);
                                      //I've tried so many schemas but i've settled using indexes
                                      // cuz I tried a Update||Create + Push on existing array
                                      // and I think that's the conflict I don't know but
                                      // I'm using other approach
                                      const nuevocurso = new Cursos({
                                        dia: days.indexOf(diad[i]),
                                        hora: horas[0],
                                        minuto: horas[1],
                                        nombre: curso,
                                        canal: msg.channel,
                                        rol: roleid,
                                        enlace: enlace,
                                      });
                                      nuevocurso.save();
                                      //.then(() => mongoose.connection.close());
                                    }
                                  } finally {
                                    //mongoose.connection.close();
                                  }
                                });
                              msg.reply("Curso ha sido creado correctamente");
                            })
                            .catch((collected) => {
                              msg.channel.send("Se acabó el tiempo");
                              console.log(collected);
                            });
                        }
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
      });
    });
}
//NEED TO MODIFY THIS QUERY SO THAT EVERY COURSE THAT GETS ADDED
//GETS A QUERY WITH SERVERID TO GET CHANNELID
async function inscrihandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      try {
        const all = await Cursos.aggregate([
          {
            $group: {
              _id: "$nombre",
              fieldN: {
                $push: {
                  dias: "$dia",
                  horas: "$hora",
                  minutos: "$minuto",
                  rol: "$rol",
                },
              },
            },
          },
        ]);
        if (all.length === 0) {
          msg.channel.send("Aún no existe ningún curso.");
        } else {
          var mensaje = "";
          var count = 1;
          all.forEach((element) => {
            var deis = "";
            var hors = "";
            element.fieldN.forEach((elementa) => {
              deis += days[elementa.dias];
              deis += " , ";
              if (elementa.horas == 0) {
                hors += "00:";
              } else {
                hors += elementa.horas.toString();
                hors += ":";
              }
              if (elementa.minutos == 0) {
                hors += "00";
                hors += " , ";
              } else {
                hors += elementa.minutos.toString();
                hors += " , ";
              }
            });
            deis = deis.slice(0, -2);
            hors = hors.slice(0, -2);
            mensaje +=
              "**" +
              count.toString() +
              "** : " +
              "El curso: **" +
              element._id +
              "\t" +
              "\t" +
              "En los días: **" +
              deis +
              "\t" +
              "\t" +
              "A estas horas: **" +
              hors +
              "**\n";
            count++;
          });
          msg.channel.send(mensaje).then(() => {
            msg.reply(
              "Indique el número de curso al que le gustaría matricularse"
            );
            msg.channel
              .awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ["time"],
              })
              .then(async (msg) => {
                msg = msg.first();
                if (parseInt(msg) <= all.length + 1) {
                  // msg.member.addRole(all[parseInt(msg) - 1].rol);
                  console.log(
                    all[parseInt(msg) - 1].fieldN[0].rol
                      .substring(3)
                      .slice(0, -1)
                  );
                  let role = msg.guild.roles.cache.find(
                    (r) =>
                      r.id ===
                      all[parseInt(msg) - 1].fieldN[0].rol
                        .substring(3)
                        .slice(0, -1)
                  );
                  if (
                    !msg.member.roles.cache.some((rol) => rol.id === role.id)
                  ) {
                    msg.member.roles
                      .add(role.id)
                      .then(
                        console.log(
                          `Succesfuly added role to member ${msg.author.tag}`
                        )
                      )
                      .catch(console.error);
                  }
                  msg.reply("¡Has sido matriculado exitosamente!");
                } else {
                  msg.reply("Fuera del rango.");
                }
              });
          });
        }
      } finally {
      }
    });
}
function llamaloshandler(msg) {
  let roleid = "715256258701033534";
  msg.channel.send(
    "llamando a todos los " + "<@&" + roleid + "> perras de mierda"
  );
}
function ayudahandler(msg) {
  msg.channel.send(
    "¡Hola! Me llamo rafxarBOT! Soy un bot de propósito general. Por el momento puedo recordarte el horario de tus cursos y mandarte sus enlaces de google meet cuando te toquen :D." +
      "\n Para saber que comandos puedes usar usa el comando: \n\n **>comandos**" +
      "\n\n Si quieres revisar el repositorio de este bot o reportar un error puedes usar los siguientes enlaces:" +
      "\n**Problemas**: <https://github.com/rafaelcanoguitton/rafxarBOT/issues>" +
      "\n**Código fuente**: <https://github.com/rafaelcanoguitton/rafxarBOT>"
  );
}
function comandos_handler(msg) {
  const embed = new Discord.MessageEmbed()
    .setColor("#d92701")
    .setTitle("Comandos")
    .setDescription(
      'A continuación los comandos que puedo realizar.\n Todos los comandos usan el prefijo ">"'
    )
    .addField(
      `__Comandos disponibles en ${msg.guild.name}__`,
      "\n\n**help o ayuda**: Para obtener información acerca del bot." +
        "\n**comandos**: Da una lista de comandos disponibles." +
        "\n**que dia es hoy**: Te dice que día es hoy..." +
        "\n**dime los cursos disponibles**: Da una lista de los cursos disponibles" +
        "\n**inscribirme en un curso**: Te inscribe en un curso ya existente" +
        "\n**nuevo curso**: Sirve para crear un nuevo curso con su rol respectivo"
    )
    .setFooter("Comandos rafxarBOT");
  msg.channel.send(embed);
}
function quediahandler(msg) {
  let temp = "Oidia es ";
  temp += days[new Date().getDay() - 1];
  temp += " mierda";
  msg.reply(temp);
}
function dimecursoshandler(msg) {
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
module.exports = {
  samplehandler,
  nuevohandler,
  inscrihandler,
  llamaloshandler,
  ayudahandler,
  comandos_handler,
  quediahandler,
  dimecursoshandler,
  flujo_principal,
  mongoPath,
};
