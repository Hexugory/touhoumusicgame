import { ApplicationCommandOptionData, CommandInteraction, PermissionResolvable } from "discord.js"

export interface SlashCommand {
    name: string
    description: string
    cooldown?: number
    permission: PermissionResolvable[]
    guildID?: string
    ownerOnly: boolean
    args: ApplicationCommandOptionData[]
    execute(int: CommandInteraction): Promise<void>
}