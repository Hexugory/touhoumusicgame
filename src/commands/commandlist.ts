import { GlobalBlacklistCommand } from "./gblacklist";
import { RandomCaseCommand } from "./randomcase";

export const CommandList = [
    new GlobalBlacklistCommand(),
    new RandomCaseCommand()
];