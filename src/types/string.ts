import { Argument } from "./arg";

class StringArgumentClass implements Argument {
    name = 'string'

    validate (arg: any): arg is string {
        return typeof arg === 'string';
    }

    parse (arg: any) {
        return arg as string;
    }
};

export const StringArgument = new StringArgumentClass();