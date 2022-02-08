import requests
import datetime
from discord.ext import commands
import discord


class Mixed(commands.Cog):
    def __init__(self, client):
        self.client = client

    @commands.command(name='queDiaEs', aliases=['que'])
    async def que_dia_es(self, ctx, dia=None, es=None, hoy=None):
        if dia != "dia" or es != "es" or hoy != "hoy":
            return
        #get day in spanish
        await ctx.send("Oidia es " + str(datetime.datetime.now().strftime("%A")) + " mierda")

    @commands.command()
    async def ayuda(self, ctx):
        await ctx.send("¡Hola! Me llamo rafxarBOT! Soy un bot de propósito general. Por el momento puedo recordarte el horario de tus cursos y mandarte sus enlaces de google meet cuando te toquen :D." +
                       "\n Para saber que comandos puedes usar usa el comando: \n\n **>comandos**" +
                       "\n\n Si quieres revisar el repositorio de este bot o reportar un error puedes usar los siguientes enlaces:" +
                       "\n**Problemas**: <https://github.com/rafaelcanoguitton/rafxarBOT/issues>" +
                       "\n**Código fuente**: <https://github.com/rafaelcanoguitton/rafxarBOT>")

    @commands.command(name='comandos')
    async def comandos(self, ctx):
        # making and embeded message with color "#d92701"
        embed = discord.Embed(
            title="Comandos", description='A continuación los comandos que puedo realizar.\n Todos los comandos usan el prefijo **">"**', color=discord.Colour.from_rgb(217, 39, 1))
        embed.add_field(
            name=f'__Comandos generales disponibles en {ctx.guild.name}__',
            value='\n\n**>help | >ayuda**: Para obtener información acerca del bot.\n**>comandos**: Da una lista de comandos disponibles.',
            inline=False
        )
        embed.add_field(
            name=f'__Comandos recordatorios de cursos disponibles en {ctx.guild.name}__',
            value='\n\n**>inscribirme**: Te inscribe en un curso ya existente.\n**>nuevo curso**: Sirve para crear un nuevo curso con su rol respectivo.\n**>fijar canal**: Fija un canal para mandar los recordatorios de cursos.',
            inline=False
        )

        embed.add_field(
            name=f'__Comandos nuevos posts en subreddit disponibles en {ctx.guild.name}__',
            value='\n\n\n\n**>que sr**: Lista los subreddits del servidor.\n**>nuevo sr**: Agrega un nuevo subreddit para recibir recordatorios\n**>fijar_sr**: Fija un canal para mandar los nuevos posts de los subreddits\n**>borrar sr**: Elimina un subreddit de la lista de subreddits.',
            inline=False
        )

        embed.set_footer(
            text="Comandos rafxarBOT")
        await ctx.send(embed=embed)

    @commands.command(name='caratula')
    async def caratula(self, ctx):
        author = ctx.message.author
        ctx.reply("¿Cual es la carrera?")
        msg = await self.client.wait_for('message', check=lambda message: message.author == author)
        carrera = msg.content
        ctx.reply("¿Cual es el nombre del curso?")
        msg = await self.client.wait_for('message', check=lambda message: message.author == author)
        curso = msg.content
        ctx.reply("¿Cual es el título del trabajo?")
        msg = await self.client.wait_for('message', check=lambda message: message.author == author)
        titulo = msg.content
        ctx.reply("¿Qué semestre? Responda con un número del 1-10")
        msg = await self.client.wait_for('message', check=lambda message: message.author == author)
        semestre = msg.content
        ctx.reply(
            "¿Quienes son los alumnos?\n No más de 6 personas ni menos de 1, nombres y apellidos separados por comas")
        msg = await self.client.wait_for('message', check=lambda message: message.author == author)
        alumnos = msg.content
        if int(semestre) > 10 or int(semestre) < 1:
            ctx.reply("El semestre debe ser un número del 1 al 10")
            return
        if len(alumnos.split(",")) > 6 or len(alumnos.split(",")) < 1:
            ctx.reply("El número de alumnos debe ser menor a 6 y mayor a 1")
            return
        apiUrl = "http://generador-caratulas-ucsp-api.herokuapp.com"
        alumnos = alumnos.split(",")
        payload = {
            "carrera": carrera,
            "curso": curso,
            "titulo": titulo,
            "semestre": semestre,
            "alumnos": alumnos
        }
        r = requests.post(apiUrl, json=payload)
        # we get the file id from the response
        file_id = r.text
        # we send the file to the channel using the api url and the file id
        await ctx.send(file=discord.File(apiUrl + "/retornar_caratula/" + file_id))
