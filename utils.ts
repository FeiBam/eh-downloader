import { exists } from "https://deno.land/std@0.188.0/fs/exists.ts";
import { initParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm-noinit.ts";

export function sleep(time: number): Promise<undefined> {
    return new Promise((r) => {
        setTimeout(() => {
            r(undefined);
        }, time);
    });
}

export async function sure_dir(f = "./test") {
    if (!await exists(f)) {
        await Deno.mkdir(f, { "recursive": true });
    }
}

export enum PromiseStatus {
    Pending,
    Fulfilled,
    Rejected,
}

export type PromiseState<T> = {
    status: PromiseStatus;
    value: Awaited<T> | undefined;
    reason: unknown;
};

export function promiseState<T>(p: Promise<T>): Promise<PromiseState<T>> {
    const pe = { status: PromiseStatus.Pending };
    return new Promise((resolve) => {
        Promise.race([p, pe]).then((v) => {
            v === pe ? resolve(pe as PromiseState<T>) : resolve(
                {
                    status: PromiseStatus.Fulfilled,
                    value: v,
                } as PromiseState<T>,
            );
        }).catch((e) => {
            resolve(
                { status: PromiseStatus.Rejected, reason: e } as PromiseState<
                    T
                >,
            );
        });
    });
}

let inited_parser = false;

export async function initDOMParser() {
    if (!inited_parser) {
        await initParser();
        inited_parser = true;
    }
}

export function parse_bool(s: string) {
    const l = s.toLowerCase();
    return l === "true" || l === "yes";
}
