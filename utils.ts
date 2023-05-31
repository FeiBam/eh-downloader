import { exists, existsSync } from "std/fs/exists.ts";
import { extname } from "std/path/mod.ts";
import { initParser } from "deno_dom/deno-dom-wasm-noinit.ts";

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

export function sure_dir_sync(f = "./test") {
    if (!existsSync(f)) {
        Deno.mkdirSync(f, { "recursive": true });
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

export function try_remove_sync(
    s: string,
    o: Deno.RemoveOptions | undefined = undefined,
) {
    try {
        Deno.removeSync(s, o);
    } catch (_) {
        return;
    }
}

export async function asyncFilter<T>(
    arr: T[],
    callback: (element: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> {
    const fail = Symbol();
    const t = <[T][]> (await Promise.all(
        arr.map(async (item, index, array) =>
            (await callback(item, index, array)) ? [item] : fail
        ),
    )).filter((i) => i !== fail);
    return t.map((t) => t[0]);
}

export async function asyncForEach<T, V>(
    arr: ArrayLike<T>,
    callback: (
        this: V | undefined,
        element: T,
        index: number,
        array: ArrayLike<T>,
    ) => Promise<void>,
    thisArg?: V,
) {
    for (let i = 0; i < arr.length; i++) {
        await callback.apply(thisArg, [arr[i], i, arr]);
    }
}

export function addZero(n: string | number, len: number) {
    let s = n.toString();
    while (s.length < len) s = "0" + s;
    return s;
}

export function filterFilename(p: string, maxLength = 256) {
    // strip control chars
    p = p.replace(/\p{C}/gu, "");
    // normalize newline
    p = p.replace(/[\n\r]/g, "");
    p = p.replace(/\p{Zl}/gu, "");
    p = p.replace(/\p{Zp}/gu, "");
    // normalize space
    p = p.replace(/\p{Zs}/gu, " ");
    p = p.replace(/[\\/]/g, "_");
    if (Deno.build.os == "windows") {
        p = p.replace(/[:\*\?\"<>\|]/g, "_");
    } else if (Deno.build.os == "linux") {
        p = p.replace(/[!\$\"]/g, "_");
    }
    if (p.length > maxLength) {
        const ext = extname(p);
        return p.slice(0, maxLength - ext.length) + ext;
    }
    return p;
}

export type DiscriminatedUnion<
    K extends PropertyKey,
    T extends Record<PropertyKey, unknown>,
> = {
    [P in keyof T]: ({ [Q in K]: P } & T[P]) extends infer U
        ? { [Q in keyof U]: U[Q] }
        : never;
}[keyof T];
