from discord.ext import commands
from models import cursos, canalFijado

dias = ["domingo", "lunes", "martes",
        "miercoles", "jueves", "viernes", "sabado"]


class Cursos(commands.Cog):
    def __init__(self, client):
        self.client = client

    @commands.command(name='nuevoCurso', aliases=['nuevo'])
    async def nuevo_curso(self, ctx,curso=None):
        if curso != "curso":
            return
        author = ctx.message.author
        if canalFijado.count_documents({"_id_sv": ctx.message.guild.id}) == 0:
            await ctx.reply("Por favor, primero fija un canal para mandar los recordatorios." +
                            "\n" +
                            "Puedes hacerlo con el comando:" +
                            "\n" +
                            "**>fijar canal**")
        else:
            await ctx.reply("¿Cómo se llama el curso?")
            msg = await self.client.wait_for('message', check=lambda message: message.author == author)
            curso = msg.content
            await ctx.reply("¿Qué dias se dicta este curso?\n\npor favor escribelos de la siguiente forma:\nLunes,Martes,Miercoles...")
            msg = await self.client.wait_for('message', check=lambda message: message.author == author)
            dias = msg.content.split(",")
            await ctx.reply("¿A qué horas toca el curso? **(En el mismo orden que los días)**\n\nEn el siguiente formato:\n12:00,16:00,19:00...")
            msg = await self.client.wait_for('message', check=lambda message: message.author == author)
            horas = msg.content.split(",")
            horas = [hora.split(":") for hora in horas]
            if len(horas) != len(dias):
                await ctx.reply("No coinciden los días y las horas, por favor intente de nuevo")
                return
            await ctx.reply("¿Cual es el enlace de la reunión?")
            msg = await self.client.wait_for('message', check=lambda message: message.author == author)
            enlace = msg.content
            # creating a role for the course
            role = await ctx.guild.create_role(name=curso)
            # now we create a new document for every day-hour combination
            for i in range(len(dias)):
                cursos.insert_one(
                    {
                        "dia": dias.index(dias[i]),
                        "hora": horas[i][0],
                        "minuto": horas[i][1],
                        "nombre": curso,
                        "server": ctx.message.guild.id,
                        "rol": role.id,
                        "enlace": enlace
                    }
                )
            await ctx.reply("Se ha creado el curso: " + curso)

    @commands.command(name='inscribirme')
    async def inscribirme(self, ctx):
        author = ctx.message.author
        if cursos.count_documents({"server": ctx.message.guild.id}) == 0:
            await ctx.reply("No hay cursos en este servidor")
            return
        aggregatedCourses = cursos.aggregate([
            {"$match": {"server": ctx.message.guild.id}},
            {
                "$group": {
                    "_id": "$nombre",
                    "fieldN": {
                        "$push": {
                            "dias": "$dia",
                            "horas": "$hora",
                            "minutos": "$minuto",
                            "rol": "$rol",
                        },
                    }
                },
            }
        ])
        mensaje = "Indique el número de curso al que le gustaría matricularse \n\n"
        for i in range(len(list(aggregatedCourses))):
            curso = list(aggregatedCourses)[i]
            mensajeCurso = "**"+str(i+1) + "** : " + curso["_id"] + "\t\t" "En los días: **" + " ".join(
                [dias[curso["fieldN"][0]["dias"][i]] for i in range(len(curso["fieldN"][0]["dias"]))]) + "**" + "\t\t" + "A las horas: **" + " ".join(
                [curso["fieldN"][0]["horas"][i] + ":" + curso["fieldN"][0]["minutos"][i] for i in range(len(curso["fieldN"][0]["horas"]))]) + "**"
            mensaje += "\n" + mensajeCurso
        await ctx.reply(mensaje)
        msg = await self.client.wait_for('message', check=lambda message: message.author == author)
        curso = list(aggregatedCourses)[int(msg.content)-1]
        # then we add the user to the role
        await ctx.guild.get_member(author.id).add_roles(ctx.guild.get_role(curso["fieldN"][0]["rol"]))
        await ctx.reply("Se ha inscrito correctamente al curso: " + curso["_id"])

    @commands.command(name='fijarCanal', aliases=['fijar'])
    async def fijar_canal(self, ctx, canal=None):
        if canal != "canal":
            return
        canalFijado.update_one(
            {"_id_sv": ctx.message.guild.id},
            {"_id_canal": ctx.message.channel.id},
            upsert=True
        )
        await ctx.reply("Okay, ¡Aquí enviaré los recordatorios de ahora en adelante! en " + ctx.message.channel.mention)
    
