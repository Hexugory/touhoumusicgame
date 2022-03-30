import { Message } from "discord.js"

export interface Argument {
    name: string
    validate (arg: any, msg: Message): boolean
    parse (arg: any, msg: Message): any
}