// This code has made by Digo, a LegionLabs brazilian developer

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const express = require("express");
require("dotenv").config();

// Verificação do token
if (!process.env.TOKEN) {
  console.error("Erro: O token do bot não foi encontrado no arquivo .env!");
  process.exit(1);
}

const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Servidor Express para Uptime Robot
app.get("/", (req, res) => {
  res.send("LegionLabs");
});

client.once("ready", async () => {
  console.log(`O bot iniciou com sucesso! ✅`);

  app.listen(3000, () => {
    console.log("O servidor Express iniciou com sucesso! ✅");
  });

  // Comandos de barra
  const commands = [
    new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Envia uma embed personalizada.")
      .addStringOption((option) =>
        option
          .setName("titulo")
          .setDescription("O título da embed.")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("mensagem")
          .setDescription("O conteúdo da embed.")
          .setRequired(true),
      )
      .addChannelOption((option) =>
        option
          .setName("canal")
          .setDescription("O canal para enviar a embed.")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("imagem")
          .setDescription("URL da imagem (opcional).")
          .setRequired(false),
      )
      .addRoleOption((option) =>
        option
          .setName("cargo")
          .setDescription("O cargo para mencionar na mensagem (opcional).")
          .setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName("limpar")
      .setDescription("Limpa um número de mensagens.")
      .addIntegerOption((option) =>
        option
          .setName("quantidade")
          .setDescription("Quantas mensagens deseja apagar.")
          .setRequired(true)
          .setMaxValue(500),
      ),
    new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("Aplica um timeout em um usuário.")
      .addUserOption((option) =>
        option
          .setName("usuário")
          .setDescription("O usuário a ser colocado em timeout.")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("tempo")
          .setDescription(
            "Tempo do timeout (ex: '10 min', '2 horas', '1 dia').",
          )
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("razão")
          .setDescription("Razão para o timeout.")
          .setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName("say")
      .setDescription("Envia uma mensagem em um canal.")
      .addStringOption((option) =>
        option
          .setName("mensagem")
          .setDescription("A mensagem que você deseja enviar.")
          .setRequired(true),
      )
      .addChannelOption((option) =>
        option
          .setName("canal")
          .setDescription("O canal onde a mensagem será enviada.")
          .setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Altera o status do bot.")
      .addStringOption((option) =>
        option
          .setName("status")
          .setDescription("O status que você deseja definir para o bot.")
          .setRequired(true)
          .addChoices(
            { name: "online", value: "online" },
            { name: "ausente", value: "idle" },
            { name: "não perturbe", value: "dnd" },
            { name: "offline", value: "invisible" },
          ),
      ),
    new SlashCommandBuilder()
      .setName("dado")
      .setDescription("Rola um dado ou múltiplos dados.")
      .addIntegerOption((option) =>
        option
          .setName("numero")
          .setDescription("Número de faces do dado.")
          .setRequired(false),
      )
      .addIntegerOption(
        (option) =>
          option
            .setName("quantidade")
            .setDescription("Quantidade de dados a serem rolados.")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(100), // Limite máximo de 100 dados
      ),
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Atualizando comandos de barra...");
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, "YOUR_GUILD_ID"),
      {
        body: commands,
      },
    );
    console.log("Comandos de barra registrados com sucesso! ✅");
  } catch (error) {
    console.error("Erro ao registrar comandos de barra:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  // Verifica se o usuário tem o cargo "Legion Team" (exceto para o comando "dado")
  if (
    !interaction.member.roles.cache.some(
      (role) => role.name === "Legion Team",
    ) &&
    interaction.commandName !== "dado"
  ) {
    return interaction.reply({
      content: "Você não tem permissão para usar este comando.",
      ephemeral: true,
    });
  }

  if (interaction.commandName === "embed") {
    const titulo = interaction.options.getString("titulo");
    const mensagem = interaction.options.getString("mensagem");
    const imagem = interaction.options.getString("imagem");
    const canal = interaction.options.getChannel("canal");
    const cargo = interaction.options.getRole("cargo");

    if (!canal || !canal.isTextBased()) {
      return interaction.reply({
        content: "O canal selecionado não é válido para envio de mensagens.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(mensagem)
      .setColor("#acc647");

    if (imagem) {
      embed.setImage(imagem);
    }

    let mensagemComCargo = "";

    if (cargo) {
      mensagemComCargo += `<@&${cargo.id}>`;
    }

    try {
      await canal.send({ embeds: [embed], content: mensagemComCargo });
      interaction.reply({
        content: "Embed enviada com sucesso!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Erro ao enviar a embed:", error);
      interaction.reply({
        content: "Houve um erro ao enviar a embed.",
        ephemeral: true,
      });
    }
  }

  if (interaction.commandName === "limpar") {
    const quantidade = interaction.options.getInteger("quantidade");

    try {
      const deletedMessages = await interaction.channel.bulkDelete(
        quantidade,
        true,
      );

      interaction.reply({
        content: `Limpei ${deletedMessages.size} mensagens!`,
        ephemeral: true
      });

      const logChannel = await interaction.guild.channels.fetch(
        "1311753744328691835",
      );
      logChannel.send(
        `Foram apagadas ${deletedMessages.size} mensagens no canal ${interaction.channel.name}.`,
      );
    } catch (error) {
      console.error("Erro ao limpar mensagens:", error);
      interaction.reply({
        content: "Houve um erro ao limpar as mensagens.",
        ephemeral: true,
      });
    }
  }

  if (interaction.commandName === "timeout") {
    const user = interaction.options.getUser("usuário");
    const tempo = interaction.options.getString("tempo");
    const razão =
      interaction.options.getString("razão") || "Nenhuma razão fornecida.";

    const match = tempo.match(/^(\d+)\s*(min|hora|dia)s?$/i);

    if (!match) {
      return interaction.reply({
        content:
          "Formato de tempo inválido. Use algo como '10 min', '2 horas' ou '1 dia'.",
        ephemeral: true,
      });
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    let milliseconds;

    if (unit === "min") {
      milliseconds = value * 60 * 1000;
    } else if (unit === "hora") {
      milliseconds = value * 60 * 60 * 1000;
    } else if (unit === "dia") {
      milliseconds = value * 24 * 60 * 60 * 1000;
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(milliseconds, razão);

      interaction.reply({
        content: `Timeout aplicado ao usuário ${user.tag} por ${value} ${unit}(s). Razão: ${razão}`,
        ephemeral: true,
      });

      const logChannel = await interaction.guild.channels.fetch(
        "1311753744328691835",
      );
      logChannel.send(
        `${user.tag} foi colocado em timeout por ${value} ${unit}(s). Razão: ${razão}.`,
      );
    } catch (error) {
      console.error("Erro ao aplicar timeout:", error);
      interaction.reply({
        content: "Houve um erro ao aplicar o timeout.",
        ephemeral: true,
      });
    }
  }

  if (interaction.commandName === "say") {
    const mensagem = interaction.options.getString("mensagem");
    const canal = interaction.options.getChannel("canal");

    if (!canal || !canal.isTextBased()) {
      return interaction.reply({
        content: "O canal selecionado não é válido para envio de mensagens.",
        ephemeral: true,
      });
    }

    try {
      await canal.send(mensagem);
      interaction.reply({
        content: `Mensagem enviada com sucesso para o canal ${canal.name}!`,
        ephemeral: true,
      });

      const logChannel = await interaction.guild.channels.fetch(
        "1311753744328691835",
      );
      logChannel.send(`Mensagem enviada no canal <#${canal.id}>: ${mensagem}`);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      interaction.reply({
        content: "Houve um erro ao enviar a mensagem.",
        ephemeral: true,
      });
    }
  }

  if (interaction.commandName === "status") {
    const status = interaction.options.getString("status");

    // Verifica se o status recebido é válido
    if (!["online", "idle", "dnd", "invisible"].includes(status)) {
      return interaction.reply({
        content:
          "Status inválido. Use 'online', 'idle', 'dnd', ou 'invisible'.",
        ephemeral: true,
      });
    }

    try {
      // Muda o status do bot com base na escolha do usuário
      client.user.setPresence({
        status: status, // status pode ser 'online', 'idle', 'dnd', 'invisible'
        activities: [{ name: "YOUR_ACTIVITY_HERE", type: 0 }],
      });
      interaction.reply({
        content: `Status do bot alterado para ${status}!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Erro ao alterar o status:", error);
      interaction.reply({
        content: "Houve um erro ao alterar o status.",
        ephemeral: true,
      });
    }
  }

  if (interaction.commandName === "dado") {
    // Usando valores padrão para número de faces (20) e quantidade de dados (1)
    const numeroDeFaces = interaction.options.getInteger("numero") || 20;
    const quantidadeDeDados = interaction.options.getInteger("quantidade") || 1;

    if (numeroDeFaces > 100) {
      return interaction.reply({
        content: "O número de faces do dado não pode ser maior que 100.",
        ephemeral: true,
      });
    }

    if (quantidadeDeDados < 1) {
      return interaction.reply({
        content: "Você precisa rolar pelo menos um dado!",
        ephemeral: true,
      });
    }

    // Verificar se a quantidade de dados está dentro do limite de 100
    if (quantidadeDeDados > 100) {
      return interaction.reply({
        content: "Você pode rolar no máximo 100 dados.",
        ephemeral: true,
      });
    }

    let resultados = [];
    let somaTotal = 0;

    for (let i = 0; i < quantidadeDeDados; i++) {
      const resultado = Math.floor(Math.random() * numeroDeFaces) + 1; // Gera um número aleatório entre 1 e o número de faces
      resultados.push(resultado);
      somaTotal += resultado;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const nickname = member.nickname || interaction.user.username; // Usa o nickname ou o nome de usuário

    // Se for apenas 1 dado, não mostrar a soma total
    let contentMessage = `${nickname} rolou ${quantidadeDeDados} dado(s) de ${numeroDeFaces} lado(s)! 
> **Resultado:** ${resultados.join(", ")}`;

    if (quantidadeDeDados > 1) {
      contentMessage += `\n> **Soma total:** ${somaTotal}`;
    }

    interaction.reply({
      content: contentMessage,
      ephemeral: false,
    });
  }
});

client.login(process.env.TOKEN);
