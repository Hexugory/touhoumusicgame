import { ApplicationCommandOptionData, AutocompleteInteraction, CommandInteraction, PermissionResolvable } from "discord.js"

export interface SlashCommand {
    name: string
    description: string
    cooldown?: number
    permission: PermissionResolvable[]
    guildID?: string
    ownerOnly: boolean
    args: ApplicationCommandOptionData[]
    autocomplete?(int: AutocompleteInteraction): Promise<void>
    execute(int: CommandInteraction): Promise<void>
}