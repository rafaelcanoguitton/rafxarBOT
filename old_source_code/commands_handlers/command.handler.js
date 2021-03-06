//Functions and db models
require("dotenv").config();
const mongoose = require("mongoose");
const mongoPath = process.env.mongoPath;
const Discord = require("discord.js");
const { parse } = require("dotenv");
const wrapper = require("./redditwrap");
const generador = require("./generador");
const genCaratula = require("./generador");
const fs = require("fs");
const utils = require("./utilFunctions");

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
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  curr_days_courses = await Cursos.find({
    dia: nd.getDay(),
    hora: nd.getHours(),
    minuto: nd.getMinutes(),
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
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
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
          .send(
            "??Hay un nuevo post en **r/" +
              key +
              "**! \n\n" +
              "**" +
              res[0].title +
              "**" +
              "\n" +
              res[0].url
          );
      });
      miMapa.set(key, res[0].title);
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
  setTimeout(sub_queries.bind(null, client), 300000); //Execute every 5 minutes 300000
}
//No le sab??a al split xd
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
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  canalFijado.updateOne(
    { _id_sv: msg.guild.id },
    { _id_canal: msg.channel.id },
    { upsert: true },
    function (err) {
      if (err) {
        msg.reply("Ocurri?? un error en el servidor");
      } else {
        msg.reply(
          "Okay, ??Aqu?? enviar?? los recordatorios de ahora en adelante! en " +
            msg.channel.name
        );
      }
    }
  );
}
async function nuevohandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const channelExists = await canalFijado.exists({ _id_sv: msg.guild.id });
  if (!channelExists) {
    msg.reply(
      "Por favor, primero fija un canal para mandar los recordatorios." +
        "\n" +
        "Puedes hacerlo con el comando:" +
        "\n" +
        "**>fijar canal**"
    );
  } else {
    try {
      msg.reply("??C??mo se llamar?? el nuevo curso?");
      const reply = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      msg = reply.first();
      let curso = msg.content;
      msg.reply(
        "??Qu?? dias se dicta este curso?\n\npor favor escribelos de la siguiente forma:\nLunes,Martes,Miercoles..."
      );
      const secondReply = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      msg = secondReply.first();
      let dias = msg.content;
      msg.reply(
        "??A qu?? horas toca el curso? **(En el mismo orden que los d??as)**\n\nEn el siguiente formato:\n12:00,16:00,19:00..."
      );
      const thirdReply = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      msg = thirdReply.first();
      let horarios = msg.content;
      let diad = separacomas(dias);
      let horariosd = separacomas(horarios);
      if (diad.length > horariosd.length) {
        msg.reply("Pusiste m??s d??as que horarios");
      }
      if (diad.length < horariosd.length) {
        msg.reply("Pusiste m??s horarios que d??as");
      }
      if (diad.length == horariosd.length) {
        msg.reply("??Cual es el enlace de la reuni??n?");
        const fourthReply = await msg.channel.awaitMessages(filter, {
          max: 1,
          time: 30000,
          errors: ["time"],
        });
        msg = fourthReply.first();
        let enlace = msg.content;
        await mongoose.connect(mongoPath, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        const roleid = await msg.guild.roles.create({
          data: {
            name: curso,
          },
          reason: "Welp. Having reminders for this course I guess",
        });
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
        msg.reply("Curso ha sido creado correctamente");
      }
    } catch (e) {
      msg.reply("Ocurri?? un error");
    } finally {
      mongoose.connection.close();
    }
  }
}

async function inscrihandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const mensaje = await utils.getAllCoursesAsString(msg.guild.id);
    if (mensaje === -1) {
      msg.reply("A??n no existe ning??n curso.");
      return;
    }
    msg.channel.send(mensaje).then(() => {
      msg.reply("Indique el n??mero de curso al que le gustar??a matricularse");
      const reply = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      msg = reply.first();
      if (parseInt(msg) <= all.length + 1) {
        let role = msg.guild.roles.cache.find(
          (r) =>
            r.id ===
            all[parseInt(msg) - 1].fieldN[0].rol.substring(3).slice(0, -1)
        );
        if (!msg.member.roles.cache.some((rol) => rol.id === role.id)) {
          msg.member.roles
            .add(role.id)
            .then(
              console.log(`Succesfuly added role to member ${msg.author.tag}`)
            )
            .catch(console.error);
        }
        msg.reply("??Has sido matriculado exitosamente!");
      } else {
        msg.reply("Fuera del rango.");
      }
    });
  } finally {
    mongoose.connection.close();
  }
}
function ayudahandler(msg) {
  msg.channel.send(
    "??Hola! Me llamo rafxarBOT! Soy un bot de prop??sito general. Por el momento puedo recordarte el horario de tus cursos y mandarte sus enlaces de google meet cuando te toquen :D." +
      "\n Para saber que comandos puedes usar usa el comando: \n\n **>comandos**" +
      "\n\n Si quieres revisar el repositorio de este bot o reportar un error puedes usar los siguientes enlaces:" +
      "\n**Problemas**: <https://github.com/rafaelcanoguitton/rafxarBOT/issues>" +
      "\n**C??digo fuente**: <https://github.com/rafaelcanoguitton/rafxarBOT>"
  );
}
function comandos_handler(msg) {
  const embed = new Discord.MessageEmbed()
    .setColor("#d92701")
    .setTitle("Comandos")
    .setDescription(
      'A continuaci??n los comandos que puedo realizar.\n Todos los comandos usan el prefijo **">"**'
    )
    .addField(
      `__Comandos generales disponibles en ${msg.guild.name}__`,
      "\n\n**>help | >ayuda**: Para obtener informaci??n acerca del bot." +
        "\n**>comandos**: Da una lista de comandos disponibles."
    )
    .addField(
      `__Comandos recordatorios de cursos disponibles en ${msg.guild.name}__`,
      "\n\n**>inscribirme**: Te inscribe en un curso ya existente." +
        "\n**>nuevo curso**: Sirve para crear un nuevo curso con su rol respectivo." +
        "\n**>fijar canal**: Fija un canal para mandar los recordatorios de cursos."
    )
    .addField(
      `__Comandos nuevos posts en subreddit disponibles en ${msg.guild.name}__`,
      "\n\n**>que sr**: Lista los subreddits del servidor." +
        "\n**>nuevo sr**: Agrega un nuevo subreddit para recibir recordatorios" +
        "\n**>fijar sr**: Fija un canal para mandar los nuevos posts de los subreddits" +
        "\n**>borrar sr**: Elimina un subreddit de la lista de subreddits."
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
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  canalsr.updateOne(
    { _id_sv: msg.guild.id },
    { _id_canal: msg.channel.id },
    { upsert: true },
    function (err) {
      if (err) {
        msg.reply("Ocurri?? un error en el servidor");
      } else {
        msg.reply(
          "Okay, ??Aqu?? enviar?? los nuevos posts de ahora en adelante! en <#" +
            msg.channel.name +
            ">"
        );
      }
    }
  );
}
async function nuevosrhandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
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
      msg.reply("??Qu?? subreddit te gustar??a agregar?");
      const reply = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      msg = reply.first();
      subreddits.updateOne(
        { _id_sub: msg.content },
        { $push: { _id_sv: msg.guild.id } },
        { upsert: true },
        function (err) {
          if (err) {
            msg.reply("Ocurri?? un error en el servidor");
          } else {
            msg.reply("??Subreddit agregado correctamente!");
          }
        }
      );
      var tempres = await wrapper.scrapeSubreddit(msg.content);
      miMapa[msg.content] = tempres[0].title;
    }
  });
}
async function que_srhandler(msg) {
  var server = msg.guild.id;
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  var men = "Se recibe nuevos posts para los siguientes subreddits:\n\n";
  curr_sv_sr = await subreddits.find({ _id_sv: server });
  if (curr_sv_sr.length == 0) {
    msg.reply(
      "A??n no tiene ning??n subreddit, puede agregar uno con el comando:\n\n" +
        "**>nuevo sr**"
    );
  } else {
    curr_sv_sr.forEach((element) => {
      men = men + "**r/" + element._id_sub + "**\n";
    });
    msg.reply(men);
  }
}
async function borr_cursohandler(msg) {
  try {
    const filter = (m) => m.author.id === msg.author.id;
    const courseString = await utils.getAllCoursesAsString(msg.guild.id);
    if (courseString.length === 0) {
      msg.reply("No hay cursos para borrar");
      return 0;
    }
    msg.reply(courseString);
    msg.reply("??Qu?? curso quieres borrar?");
    const reply = msg.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
      errors: ["time"],
    });
    msg = reply.first();
    Cursos.deleteOne({ _id_sv: msg.guild.id, _id_curso: msg.content });
    msg.reply("Curso borrado correctamente");
  } catch (err) {
    msg.reply("Ocurri?? un error en el servidor");
  }
}
async function borr_srhandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  allsr = await subreddits.find({ _id_sv: msg.guild.id });
  if (allsr.length == 0) {
    msg.reply(
      "A??n no tiene ning??n subreddit, puede agregar uno con el comando:\n\n" +
        "**>nuevo sr**"
    );
  } else {
    var men = "Seleccione el subreddit que desea eliminar:\n\n";
    var i = 1;
    allsr.forEach((element) => {
      men = men + i.toString() + ": **r/" + element._id_sub + "**\n";
      i++;
    });
    msg.reply(men);
    const reply = await msg.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
      errors: ["time"],
    });
    msg = reply.first();
    await subreddits.updateOne(
      {
        _id_sub: allsr[parseInt(msg.content) - 1]._id_sub,
      },
      { $pull: { _id_sv: msg.guild.id } }
    );
    miMapa.delete(allsr[parseInt(msg.content) - 1]._id_sub);
    msg.reply(
      `Se ha eliminado **${
        allsr[parseInt(msg.content) - 1]._id_sub
      }** de la lista.`
    );
  }
}
async function caratulahandler(msg) {
  let filter = (m) => m.author.id === msg.author.id;
  msg.reply("??Cual es el la carrera?");
  const firstReply = await msg.channel.awaitMessages(filter, {
    max: 1,
    time: 30000,
    errors: ["time"],
  });
  msg = firstReply.first();
  var carrera = msg.content;
  msg.reply("??Cual es el t??tulo del trabajo?");
  const secondReply = await msg.channel.awaitMessages(filter, {
    max: 1,
    time: 30000,
    errors: ["time"],
  });
  msg = secondReply.first();
  var titulo = msg.content;
  msg.reply("??Cual es el curso?");
  const thirdReply = await msg.channel.awaitMessages(filter, {
    max: 1,
    time: 30000,
    errors: ["time"],
  });
  msg = thirdReply.first();
  var curso = msg.content;
  msg.reply("??Qu?? semestre? Responda con un n??mero del 1-10");
  const fourthReply = await msg.channel.awaitMessages(filter, {
    max: 1,
    time: 30000,
    errors: ["time"],
  });
  msg = fourthReply.first();
  var semestre = parseInt(msg.content);
  if (semestre > 10 || semestre < 1) {
    msg.reply("No es un n??mero v??lido");
  } else {
    msg.reply(
      "??Quienes son los alumnos?\n No m??s de 6 personas ni menos de 1, nombres y apellidos separados por comas"
    );
    const fifthReply = await msg.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
      errors: ["time"],
    });
    msg = fifthReply.first();
    var alumnos = msg.content.split(",");
    if (alumnos.length > 6 || alumnos.length < 1) {
      msg.reply("No es un n??mero v??lido de alumnos.");
    } else {
      alumnos.forEach((element, index) => {
        alumnos[index] = element.trim();
      });
      generador.genCaratula(
        carrera,
        titulo,
        curso,
        semestre,
        alumnos,
        (archivo) => {
          if (archivo != null) {
            msg.channel.send({ files: ["./" + archivo] });
            fs.unlinkSync("./" + archivo);
          } else {
            msg.reply("No se pudo generar la caratula");
          }
        }
      );
    }
  }
}
module.exports = {
  nuevohandler, //Handler for new course
  inscrihandler, //Handler to get role for reminders of a course
  ayudahandler, //Handler to get help information
  comandos_handler, //Handler to get bot commands
  quediahandler, //Legacy handler to get what day is today
  flujo_principal, //Function that keeps query for reminders going
  fijar_canalHandler, //Handler to tell which channel the bot will send reminders to
  sub_queries, //Function that queries if new post on subreddits every 5 min
  fijarsrhandler, //Handler to tell which channel the bot will send new posts to
  nuevosrhandler, //Handler to add a new subreddit to receive new posts from
  que_srhandler, //Handler to list all subreddits the server receives new posts from
  borr_srhandler, //Handler to delete a subreddit from the list of subreddits a server gets new posts from
  caratulahandler, //Handler to get covers for univerity work
  mongoPath, //Database path
};
