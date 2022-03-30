import { Interaction, PermissionResolvable } from "discord.js"

export interface SlashCommand {
    name: string
    description: string
    cooldown?: number
    permission: PermissionResolvable[]
    guildID: string
    ownerOnly: boolean
    args: {
        name: string
        type: string
        description: string
        required: boolean
    }[]
    execute(int: Interaction): Promise<void>
}