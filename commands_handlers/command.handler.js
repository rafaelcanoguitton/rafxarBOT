//Functions and db models
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
  //Actual handlers
function samplehandler(msg){
    let filter = (m) => m.author.id === msg.author.id;
    msg.reply("¿A qué curso te gustaría inscribirte?");
}
module.exports={
    samplehandler
}