import { DeploySlashCommand } from "./deployslash";
import { EndGameCommand } from "./endgame";
import { GlobalBlacklistCommand } from "./gblacklist";
import { KillCommand } from "./kill";
import { RandomCaseCommand } from "./randomcase";
import { StartGameCommand } from "./startgame";
import { StartPerpetualGameCommand } from "./startperpetualgame";
import { TestCommand } from "./test";

export const CommandList = [
    new GlobalBlacklistCommand(),
    new RandomCaseCommand(),
    new TestCommand(),
    new KillCommand(),
    new StartGameCommand(),
    new StartPerpetualGameCommand(),
    new EndGameCommand(),
    new DeploySlashCommand()
];