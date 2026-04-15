import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

function owoify(text: string): string {
  return text
    .replace(/r/gi, "w").replace(/l/gi, "w")
    .replace(/na/gi, "nya").replace(/ne/gi, "nye")
    .replace(/ni/gi, "nyi").replace(/no/gi, "nyo")
    .replace(/nu/gi, "nyu")
    .replace(/\!/g, " owo!")
    .replace(/\./g, " uwu.");
}

function mockify(text: string): string {
  return text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
}

function toZalgo(text: string): string {
  const up = ["̍","̎","̄","̅","̿","̑","̆","̐","͒","͗","͑","̇","̈","̊","͂","̓","̈́","͊","͋","͌","̃","̂","̌","͐","̀","́","̋","̏","̒","̓","̔","̽","̉","ͅ","͉","͊","͋","͌","͍","͎","͏","͐","͑","͒","͓","͔","͕","͖","͗","͘","͙","͚","͛","͜","͝","͞","͟","͠","͡","͢","ͣ","ͤ","ͥ","ͦ","ͧ","ͨ","ͩ","ͪ","ͫ","ͬ","ͭ","ͮ","ͯ"];
  return text.split("").map(c => c + up[Math.floor(Math.random() * 5)]).join("");
}

function toBinary(text: string): string {
  return text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
}

export default {
  data: new SlashCommandBuilder()
    .setName("textfun")
    .setDescription("🔤 Fun text transformations")
    .addSubcommand((sub) =>
      sub.setName("reverse").setDescription("🔄 Reverse a text")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to reverse").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("mock").setDescription("🤪 Mock a text (SpOnGeBoB)")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to mock").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("owoify").setDescription("🐱 OWOify a text")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to OWOify").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("clap").setDescription("👏 Add claps between words")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to clap").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("choose").setDescription("🎲 Choose randomly from options (use | as separator)")
        .addStringOption((opt) => opt.setName("options").setDescription("Options separated by |").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("zalgo").setDescription("👹 Cursed zalgo text")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to zalgo-ify").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("binary").setDescription("💻 Convert to binary")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to convert").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("flip").setDescription("🙃 Flip text upside down")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to flip").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const text = interaction.options.getString("text") || interaction.options.getString("options") || "";

    let result = "";
    let title = "";

    if (sub === "reverse") { result = text.split("").reverse().join(""); title = "🔄 Reversed"; }
    else if (sub === "mock") { result = mockify(text); title = "🤪 Mocked"; }
    else if (sub === "owoify") { result = owoify(text); title = "🐱 OWOified"; }
    else if (sub === "clap") { result = text.split(" ").join(" 👏 "); title = "👏 Clapped"; }
    else if (sub === "choose") {
      const options = text.split("|").map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) return interaction.reply({ content: "❌ Provide at least 2 options separated by `|`.", ephemeral: true });
      result = `🎲 I chose: **${options[Math.floor(Math.random() * options.length)]}**`;
      title = "🎲 Random Choice";
    }
    else if (sub === "zalgo") { result = toZalgo(text.substring(0, 50)); title = "👹 Cursed Text"; }
    else if (sub === "binary") { result = `\`${toBinary(text.substring(0, 20))}\``; title = "💻 Binary"; }
    else if (sub === "flip") {
      const flipMap: Record<string, string> = { a:"ɐ",b:"q",c:"ɔ",d:"p",e:"ǝ",f:"ɟ",g:"ƃ",h:"ɥ",i:"ı",j:"ɾ",k:"ʞ",l:"l",m:"ɯ",n:"u",o:"o",p:"d",q:"b",r:"ɹ",s:"s",t:"ʇ",u:"n",v:"ʌ",w:"ʍ",x:"x",y:"ʎ",z:"z" };
      result = text.split("").map(c => flipMap[c.toLowerCase()] || c).reverse().join("");
      title = "🙃 Flipped";
    }

    const embed = new EmbedBuilder()
      .setColor(0x9966ff)
      .setTitle(title)
      .addFields(
        { name: "Input", value: `\`${text.substring(0, 200)}\``, inline: false },
        { name: "Output", value: result.substring(0, 1024), inline: false },
      )
      .setFooter({ text: "RYZENX™ Text Fun" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
