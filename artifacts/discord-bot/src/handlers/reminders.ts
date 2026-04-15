import cron from "node-cron";
import { pool } from "../database";
import { ExtendedClient } from "../types";
import { EmbedBuilder, TextChannel } from "discord.js";

export function startReminderCron(client: ExtendedClient) {
  cron.schedule("* * * * *", async () => {
    try {
      const result = await pool.query(
        "SELECT * FROM reminders WHERE remind_at <= NOW()"
      );

      for (const reminder of result.rows) {
        try {
          const channel = client.channels.cache.get(reminder.channel_id) as TextChannel;
          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(0xffaa00)
              .setTitle("⏰ Reminder!")
              .setDescription(reminder.message)
              .setFooter({ text: `Reminder for <@${reminder.user_id}>` })
              .setTimestamp();
            await channel.send({ content: `<@${reminder.user_id}>`, embeds: [embed] });
          }
        } catch (err) {
          console.error("[Reminders] Failed to send reminder:", err);
        }
      }

      if (result.rows.length > 0) {
        const ids = result.rows.map((r: any) => r.id);
        await pool.query("DELETE FROM reminders WHERE id = ANY($1)", [ids]);
      }
    } catch (err) {
      console.error("[Reminders] Cron error:", err);
    }
  });

  console.log("[Reminders] Cron job started");
}
