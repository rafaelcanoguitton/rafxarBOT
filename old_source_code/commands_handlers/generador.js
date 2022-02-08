const Axios = require("axios"); // or 'https' for https:// URLs
const fs = require("fs");
const http = require("http");
const apiurl = "http://generador-caratulas-ucsp-api.herokuapp.com";
async function genCaratula(carrera, titulo, curso, semestre, alumnos, fn) {
  const prires = await Axios.post(apiurl, {
    carrera: carrera,
    titulo: titulo,
    curso: curso,
    semestre: semestre,
    alumnos: alumnos,
  });
  http.get(
    apiurl + "retornar_caratula/" + prires.data,
    function (response) {
      if (response.statusCode == 200) {
        const file = fs.createWriteStream(prires.data + ".pdf");
        response.pipe(file);
        fn(prires.data + ".pdf");
      } else {
        fn(null);
      }
    }
  );
}
module.exports = genCaratula;