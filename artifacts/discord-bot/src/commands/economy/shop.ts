import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const SHOP_ITEMS = [
  { id: "fishing_rod_pro", name: "🎣 Pro Fishing Rod", price: 5000, description: "Better fishing catches (+20% coins)" },
  { id: "golden_pickaxe", name: "⛏️ Golden Pickaxe", price: 8000, description: "Mine rarer ores more often" },
  { id: "lucky_charm", name: "🍀 Lucky Charm", price: 3000, description: "Increases luck in gambling by 5%" },
  { id: "bank_upgrade", name: "🏦 Bank Upgrade", price: 10000, description: "Increase bank capacity by 50,000" },
  { id: "hunting_bow", name: "🏹 Hunting Bow", price: 6000, description: "Hunt rarer animals more often" },
  { id: "disguise_kit", name: "🎭 Disguise Kit", price: 4000, description: "Reduce crime fail penalty by 30%" },
  { id: "vip_badge", name: "👑 VIP Badge", price: 25000, description: "Show off your VIP status in profile" },
  { id: "xp_boost", name: "⚡ XP Boost", price: 2000, description: "Double XP for 24 hours" },
];

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("🛒 Economy item shop")
    .addSubcommand((sub) => sub.setName("view").setDescription("🛍️ Browse all available items"))
    .addSubcommand((sub) =>
      sub.setName("buy").setDescription("💳 Purchase an item")
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item ID to purchase").setRequired(true)
            .addChoices(...SHOP_ITEMS.map((i) => ({ name: `${i.name} (🪙 ${i.price.toLocaleString()})`, value: i.id })))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "view") {
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🛒 RYZENX™ Item Shop")
        .setDescription("Use `/shop buy` to purchase an item!")
        .addFields(
          SHOP_ITEMS.map((item) => ({
            name: `${item.name} — 🪙 ${item.price.toLocaleString()}`,
            value: item.description,
            inline: true,
          }))
        )
        .setFooter({ text: "RYZENX™ Economy Shop" }).setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "buy") {
      const itemId = interaction.options.getString("item", true);
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item) return interaction.reply({ content: "❌ Item not found.", ephemeral: true });

      const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
      if (eco.wallet < item.price) {
        return interaction.reply({ content: `❌ You need 🪙 **${item.price.toLocaleString()}** but only have 🪙 **${eco.wallet.toLocaleString()}**.`, ephemeral: true });
      }

      const owned = await pool.query("SELECT quantity FROM inventory WHERE user_id = $1 AND guild_id = $2 AND item_id = $3",
        [interaction.user.id, interaction.guild!.id, itemId]);

      await pool.query("UPDATE economy SET wallet = wallet - $1 WHERE user_id = $2 AND guild_id = $3", [item.price, interaction.user.id, interaction.guild!.id]);

      if (owned.rows.length) {
        await pool.query("UPDATE inventory SET quantity = quantity + 1 WHERE user_id = $1 AND guild_id = $2 AND item_id = $3",
          [interaction.user.id, interaction.guild!.id, itemId]);
      } else {
        await pool.query("INSERT INTO inventory (user_id, guild_id, item_id, item_name) VALUES ($1, $2, $3, $4)",
          [interaction.user.id, interaction.guild!.id, itemId, item.name]);
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("✅ Purchase Successful!")
        .setDescription(`You bought **${item.name}**!`)
        .addFields(
          { name: "💰 Paid", value: `🪙 ${item.price.toLocaleString()}`, inline: true },
          { name: "💵 Remaining", value: `🪙 ${(eco.wallet - item.price).toLocaleString()}`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Economy Shop" }).setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
