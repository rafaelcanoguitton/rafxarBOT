const Cursos = mongoose.model("cursos", {
  dia: Number,
  hora: Number,
  minuto: Number,
  nombre: String,
  server: String,
  rol: String,
  enlace: String,
});
const getAllCoursesAsString = (id) => {
  const all = await Cursos.aggregate([
    { $match: { server: id } },
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
  if (all.length == 0) {
    return -1;
  }
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
  return mensaje;
};
module.exports = { getAllCoursesAsString };