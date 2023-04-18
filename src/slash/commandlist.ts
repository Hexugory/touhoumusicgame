import { EndGameCommand } from "./endgame";
import { GuessCommand } from "./guess";
import { StartGameCommand } from "./startgame";

export const SlashCommandList = [
    new GuessCommand(),
    new StartGameCommand(),
    new EndGameCommand()
];