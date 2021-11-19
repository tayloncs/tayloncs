require("dotenv").config();
const {
    Client,
    Intents,
    MessageCollector,
    MessageActionRow,
    MessageSelectMenu,
} = require("discord.js");

const fs = require("fs");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.login(process.env.TOKEN);

client.on("ready", () => {
    console.log("Bot is ready");
});

client.on("messageCreate", async (message) => {
    const comandoBot = message.content.split(" ", 1);
    let erro = false;

    if (comandoBot[0] === "!bot") {
        const arrayMsg = message.content.split(" ");
        let nomeSerie = arrayMsg[1].toUpperCase();
        let numEpisodio = arrayMsg[2];
        const dados = JSON.parse(
            fs.readFileSync("./src/database/data.json", "utf8")
        );

        if (
            nomeSerie === "VIDEOS" ||
            nomeSerie === "VIDEO" ||
            nomeSerie === "SERIES" ||
            nomeSerie === "SERIE"
        ) {
            mostrarSeries(dados, message);
            return;
        }

        const serie = dados.find((item) => item.nome === nomeSerie);

        if (numEpisodio && serie) {
            const Str = numEpisodio.replace(/[^0-9]/g, "");
            const numEp = parseInt(Str);
            const link = serie.episodios.find((item) =>
                item.episodio.includes(numEp)
            );
            if (link) {
                message.channel.send(link.video);
            } else numEpisodio = 0;
        }

        if (serie && !numEpisodio) {
            mostrarEpisodios(message, serie);
        } else erro = true;

        if (erro) message.channel.send("Não encontramos seu pedido");
    }
});

async function mostrarSeries(dados, message) {
    const listaSerie = ListaSerie(dados);
    const resposta = await message.reply({
        content: "Temos as series",
        components: [listaSerie],
        ephemeral: true,
    });
    const collector = resposta.createMessageComponentCollector({
        max: 1,
        time: 2 * 60000,
    });

    collector.on("collect", (selecao) => {
        const serie = dados.find((item) => item.nome === selecao.values[0]);
        message.channel
            .send(serie.nome)
            .then(() =>
                resposta.edit({
                    content: "Escolheu a serie",
                    components: [],
                })
            )
            .catch(() =>
                resposta.edit({
                    content: "Erro",
                    components: [],
                })
            );
        mostrarEpisodios(message, serie);
    });

    collector.on("end", (collected, reason) => {
        if (reason === "time")
            resposta.edit({
                content: "O tempo para o pedido se esgotou!",
                components: [],
            });
    });
}

async function mostrarEpisodios(message, serie) {
    const listaEp = montarLista(serie);
    const resposta = await message.reply({
        content: "Escolha um episodio",
        components: [listaEp],
        ephemeral: true,
    });
    const collector = resposta.createMessageComponentCollector({
        max: 1,
        time: 3 * 60000,
    });

    collector.on("collect", (selecao) => {
        const link = serie.episodios.find(
            (item) => item.episodio === selecao.values[0]
        ).video;
        message.channel
            .send(link)
            .then(() =>
                resposta.edit({
                    content: "Assista!",
                    components: [],
                })
            )
            .catch(() =>
                resposta.edit({
                    content: "Erro",
                    components: [],
                })
            );
    });

    collector.on("end", (collected, reason) => {
        if (reason === "time")
            resposta.edit({
                content: "O tempo para informar o canal se esgotou!",
                components: [],
            });
    });
}

function montarLista(serie) {
    const ep = serie.episodios.map((item) => {
        return {
            label: item.episodio,
            description: item.descricao,
            value: item.episodio,
        };
    });
    const episodios = new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId("select")
            .setPlaceholder(`Escolha o episodio de ${serie.nome}`)
            .addOptions(ep)
    );
    return episodios;
}

function ListaSerie(dados) {
    const serie = dados.map((item) => {
        return {
            label: item.nome,
            description: item.episodios.length.toString() + " Episodios",
            value: item.nome,
        };
    });
    const lista = new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId("select")
            .setPlaceholder("Escolha o episodio de")
            .addOptions(serie)
    );
    return lista;
}

function arvore(msg) {
    const collector = new MessageCollector(
        msg.channel,
        (m) => m.author.id === msg.author.id,
        { time: 10000 }
    );
    collector.on("collect", (msg) => {
        if (msg.content == "1") {
            msg.channel.send("You Want 1");
        } else if (msg.content == "2") {
            msg.channel.send("You Want 2");
        }
    });
}
