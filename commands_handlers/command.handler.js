//Functions and db models
require("dotenv").config();
const mongoose = require("mongoose");
const mongoPath = process.env.mongoPath;
const Discord = require("discord.js");
const { parse } = require("dotenv");
const wrapper = require("./redditwrap");
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
  _id_sv: String,
  _id_canal: String,
});
const subreddits = mongoose.model("subreddits", {
  _id_sub: String,
  _id_sv: [String],
});
const canalsr = mongoose.model("canalsr", {
  _id_sv: String,
  _id_canal: String,
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
  /*"<@&"*/
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
  curr_days_courses.forEach(async (element) => {
    canalFijado.findOne({ _id_sv: element.server }, function (err, result) {
      client.channels.cache
        .get(result._id_canal)
        .send("Gente de " + element.rol + " tienen clases!.");
      client.channels.cache
        .get(result._id_canal)
        .send("Su enlace es el siguiente: " + element.enlace);
    });
  });
  var time_for_timeout = 60000 - new Date().getSeconds() * 1000;
  setTimeout(flujo_principal.bind(null, client), time_for_timeout); //Passing Client here is really important, I literally spent a while debugging this
} //I also learned that you need to use bind if not it doesn't work
var miMapa = new Map();
async function sub_queries(client) {
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      //HERE I NEED TO ADD A LOOP SO THAT 
      //IF MORE THAN 1 NEW POST WAS POSTED THEN
      //POST EVERY POST TILL THAT
      miMapa.forEach(async (value, key) => {
        var res = await wrapper.scrapeSubreddit(key);
        if (res[0].title != value) {
          var sub = await subreddits.findOne({ _id_sub: key });
          sub._id_sv.forEach(async (element) => {
            var ch = await canalsr.findOne({ _id_sv: element });
            client.channels.cache
              .get(ch._id_canal)
              .send("¡Hay un nuevo post en **" + key + "**! \n\n" + res.link);
          });
        }
      });
      const number = await subreddits.countDocuments();
      if (number != miMapa.size) {
        var subsbd = await subreddits.find({});
        subsbd.forEach(async (element) => {
          if (!miMapa.has(element._id_sub)) {
            curr_last_post = await wrapper.scrapeSubreddit(element._id_sub);
            miMapa.set(element._id_sub, curr_last_post[0].title);
          }
        });
      }
      console.log(miMapa);
    });
  setTimeout(sub_queries.bind(null, client), 3000); //Execute every 5 minutes 300000
}
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
async function fijar_canalHandler(msg) {
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      canalFijado.updateOne(
        { _id_sv: msg.guild.id },
        { _id_canal: msg.channel.id },
        { upsert: true },
        function (err) {
          if (err) {
            msg.reply("Ocurrió un error en el servidor");
          } else {
            msg.reply(
              "Okay, ¡Aquí enviaré los recordatorios de ahora en adelante! en " +
                msg.channel.name
            );
          }
        }
      );
    });
}
async function nuevohandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      canalFijado.exists({ _id_sv: msg.guild.id }, function (err, result) {
        if (!result) {
          msg.reply(
            "Por favor, primero fija un canal para mandar los recordatorios." +
              "\n" +
              "Puedes hacerlo con el comando:" +
              "\n" +
              "**>fijar canal**"
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
                                        server: msg.guild.id,
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
          { $match: { server: msg.guild.id } },
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
        "\n**inscribirme**: Te inscribe en un curso ya existente" +
        "\n**nuevo curso**: Sirve para crear un nuevo curso con su rol respectivo"
    )
    .setFooter("Comandos rafxarBOT");
  msg.channel.send(embed);
}
/**
 * This function tells you what day is with a twist
 * It's legacy code that my friends wanted to stay
 */
function quediahandler(msg) {
  let temp = "Oidia es ";
  temp += days[new Date().getDay()];
  temp += " mierda";
  msg.reply(temp);
}
async function fijarsrhandler(msg) {
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      canalsr.updateOne(
        { _id_sv: msg.guild.id },
        { _id_canal: msg.channel.id },
        { upsert: true },
        function (err) {
          if (err) {
            msg.reply("Ocurrió un error en el servidor");
          } else {
            msg.reply(
              "Okay, ¡Aquí enviaré los nuevos posts de ahora en adelante! en #" +
                msg.channel.name
            );
          }
        }
      );
    });
}
async function nuevosrhandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose
    .connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      canalsr.exists({ _id_sv: msg.guild.id }, (err, result) => {
        if (!result) {
          msg.reply(
            "Por favor, primero fija un canal para mandar los nuevos posts." +
              "\n" +
              "Puedes hacerlo con el comando:" +
              "\n" +
              "**>fijar sr**"
          );
        } else {
          msg.reply("¿Qué subreddit te gustaría agregar?").then((msg) => {
            msg.channel
              .awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ["time"],
              })
              .then(async (msg) => {
                msg = msg.first();
                subreddits.updateOne(
                  { _id_sub: msg.content },
                  { $push: { _id_sv: msg.guild.id } },
                  { upsert: true },
                  function (err) {
                    if (err) {
                      msg.reply("Ocurrió un error en el servidor");
                    } else {
                      msg.reply("¡Subreddit agregado correctamente!");
                    }
                  }
                );
              });
          });
        }
      });
    });
}
function que_srhandler() {}
module.exports = {
  nuevohandler, //Handler for new course
  inscrihandler, //Handler to get role for reminders of a course
  ayudahandler, //Handler to get help information
  comandos_handler, //Handler to get bot commands
  quediahandler, //Legacy handler to get what day is today
  flujo_principal, //Function that keeps query for reminders going
  fijar_canalHandler, //Handler to tell which channel the bot will send reminders to
  sub_queries,
  fijarsrhandler,
  nuevosrhandler,
  que_srhandler,
  mongoPath,
};
