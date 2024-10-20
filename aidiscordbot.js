// Importing all the necessary files, modules, and tokens
const fs = require("fs").promises;
const { Client, GatewayIntentBits } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

// Initializes a Discord client with specific Gateway intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Importing the API KEY from the .env file
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});

// Requesting OpenAI for the config
const openai = new OpenAIApi(configuration);

// Store the user interactions and responses
const userResponses = new Map();

// Receiving data from Discord
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "chat") {
    const message = interaction.options.getString("message");

    try {
      await interaction.deferReply();

      const response = await openai.createCompletion({
        model: "text-davinci-005", // Update with the latest available model
        prompt: `User: ${message}\nChatGPT:`,
        temperature: 0.5,
        max_tokens: 2000,
        top_p: 1.0,
        frequency_penalty: 0.5,
        presence_penalty: 0.0,
      });

      const reply = response.data.choices[0].text;

      // Store the user's interaction and response
      userResponses.set(interaction.user.id, {
        interaction: message,
        response: reply,
      });

      interaction.editReply({
        content: `ChatGPT: ${reply}`,
        fetchReply: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply("An error occurred while processing your request.");
    }
  } else if (commandName === "reply") {
    try {
      await interaction.deferReply();

      // Retrieve the user's previous response
      const previousResponse = userResponses.get(interaction.user.id)?.response;

      if (previousResponse) {
        // Get the user's reply message
        const replyMessage = interaction.options.getString("message");

        // Get only the new interaction without the previous response
        const newInteraction = previousResponse ? `User: ${previousResponse}\n\nUser: ${replyMessage}` : "";

        const response = await openai.createCompletion({
          model: "text-davinci-005", // Update with the latest available model
          prompt: `${newInteraction}\nChatGPT:`,
          temperature: 0.5,
          max_tokens: 2000,
          top_p: 1.0,
          frequency_penalty: 0.5,
          presence_penalty: 0.0,
        });

        const newReply = response.data.choices[0].text;

        // Store the updated response
        userResponses.set(interaction.user.id, {
          response: newReply,
        });

        // Send only the new response
        interaction.editReply({
          content: `${newReply}`,
          fetchReply: true,
        });
      } else {
        interaction.editReply("No previous interaction found.");
      }
    } catch (error) {
      console.error(error);
      interaction.reply("An error occurred while processing your request.");
    }
  } else if (commandName === "about") {
    interaction.reply({
      content:
        "Hi, my name is ChatGPT and I was founded by Ryder_tHuGLiFe#5042. I am using the text-davinci-005 model. Use the `/chat` command to start chatting with me.\n\nBe happy and start chatting!\n\nRegards,\nChatGPT, OpenAI, and Ryder_tHuGLiFe#5042\n\nDisclaimer: OpenAI has been used as the main source.",
    });
  } else if (commandName === "ping") {
    const pingTime = Date.now() - interaction.createdTimestamp;
    interaction.reply(`Pong! Latency: ${pingTime}ms`);
  }
});

// Log in to Discord with the provided bot token
client.login(process.env.DISCORD_KEY);
